<?php

namespace App\Jobs;

use DateTimeZone;
use DateTimeImmutable;
use Exception;
use App\Models\Hotel;
use App\Models\Offer;
use App\Models\Room;
use App\Models\Search;
use BaseApi\Cache\Cache;
use Override;
use Throwable;
use BaseApi\Queue\Job;

class SearchJob extends Job
{
    protected int $maxRetries = 1;

    protected int $retryDelay = 30; // seconds

    public function __construct(
        public Search $search,
    ) {}

    #[Override]
    public function handle(): void
    {
        $hash = $this->search->generateDeterministicHash();
        $exists = Cache::has($hash);

        if ($exists) {
            $this->search->delete();
            $this->search = Cache::get($hash)['search'] ?? throw new Exception('Search not found in cache');
            return;
        }

        $this->search->status = 'started';
        $this->search->save();

        $hotels = $this->loadHotelsData();

        if ($hotels === []) {
            $this->handleNoResults($hash);
            return;
        }

        $processedHotels = $this->processHotelsData($hotels);
        $sortedHotels = $this->sortHotelsByCheapestPrice($processedHotels);

        $this->search->status = 'completed';
        $this->search->results = count($sortedHotels);
        $this->search->save();

        $this->cacheResults($hash, $sortedHotels);
    }

    /**
     * Load hotels and their related data (rooms and offers)
     */
    protected function loadHotelsData(): array
    {
        return Hotel::where('location_id', '=', $this->search->location_id)->get();
    }

    /**
     * Process raw hotel data into the response format
     */
    protected function processHotelsData(array $hotels): array
    {
        $hotelData = [];

        foreach ($hotels as $hotel) {
            assert($hotel instanceof Hotel);

            $hotelArray = $hotel->toArray();
            // Load all rooms and filter by capacity in PHP  
            $allRooms = $hotel->rooms()->get();
            $rooms = array_filter($allRooms, function($room): bool {
                assert($room instanceof Room);
                return $room->capacity >= $this->search->capacity;
            });

            $roomData = [];

            foreach ($rooms as $room) {
                assert($room instanceof Room);

                $roomArray = $room->toArray();
                
                // Load all offers and filter in PHP (BaseAPI doesn't support where() on relations)
                $allOffers = $room->offers()->get();
                $offers = array_filter($allOffers, function($offer): bool {
                    assert($offer instanceof Offer);
                    return $offer->availability && 
                           $offer->starts_on <= $this->search->starts_on && 
                           $offer->ends_on >= $this->search->ends_on;
                });

                // Skip room if no valid offers after initial filtering
                if ($offers === []) {
                    continue;
                }

                // Apply additional date containment logic for proper hotel booking semantics
                $validOffers = $this->validateOfferDates($offers);

                // Skip room if no offers pass the containment check
                if ($validOffers === []) {
                    continue;
                }

                $roomArray['offers'] = $this->sortOffersByPrice($validOffers);

                $roomData[] = $roomArray;
            }

            // Skip hotel if no valid rooms
            if ($roomData === []) {
                continue;
            }

            // Sort rooms by their cheapest offer
            $roomData = $this->sortRoomsByCheapestOffer($roomData);

            $hotelArray['rooms'] = $roomData;
            $hotelData[] = $hotelArray;
        }

        return $hotelData;
    }

    /**
     * Validate offers using complex date containment logic
     * (Called after SQL-level filtering for performance)
     */
    protected function validateOfferDates(array $offers): array
    {
        $validOffers = [];

        foreach ($offers as $offer) {
            assert($offer instanceof Offer);

            // Check if offer covers the entire requested stay
            if (!$this->offerCoversStay($offer->starts_on, $offer->ends_on, $this->search->starts_on, $this->search->ends_on)) {
                continue;
            }

            $validOffers[] = $offer;
        }

        return $validOffers;
    }

    /**
     * Check if offer covers the entire requested stay period
     * Uses proper hotel booking semantics with half-open intervals [start, end)
     */
     protected function offerCoversStay(string $offerStart, string $offerEnd, string $searchStart, string $searchEnd): bool
    {
        $dateTimeZone = new DateTimeZone('UTC');

        try {
            // Treat ranges as [start, end) at midnight UTC
            $oS = (new DateTimeImmutable($offerStart, $dateTimeZone))->setTime(0, 0, 0);
            $oE = (new DateTimeImmutable($offerEnd, $dateTimeZone))->setTime(0, 0, 0);
            $sS = (new DateTimeImmutable($searchStart, $dateTimeZone))->setTime(0, 0, 0);
            $sE = (new DateTimeImmutable($searchEnd, $dateTimeZone))->setTime(0, 0, 0);

            // Validate ranges are not empty
            if ($oE <= $oS || $sE <= $sS) {
                return false;
            }

            // Offer must contain the requested stay: offer_start <= search_start && search_end <= offer_end
            return $oS <= $sS && $sE <= $oE;
        } catch (Exception) {
            // If date parsing fails, reject the offer
            return false;
        }
    }

    /**
     * Sort hotels by cheapest effective price across all their offers
     */
    protected function sortHotelsByCheapestPrice(array $hotels): array
    {
        usort($hotels, function ($hotelA, $hotelB): int {
            $minPriceA = $this->getHotelMinPrice($hotelA);
            $minPriceB = $this->getHotelMinPrice($hotelB);

            return $minPriceA <=> $minPriceB;
        });

        return $hotels;
    }

    /**
     * Get the minimum effective price across all offers for a hotel
     */
    protected function getHotelMinPrice(array $hotel): float
    {
        $minPrice = PHP_FLOAT_MAX;

        foreach ($hotel['rooms'] as $room) {
            foreach ($room['offers'] as $offer) {
                $effectivePrice = is_array($offer) ? $offer['effective_price'] : $offer->effective_price;
                $minPrice = min($minPrice, $effectivePrice);
            }
        }

        return $minPrice === PHP_FLOAT_MAX ? 0.0 : $minPrice;
    }

    /**
     * Sort offers by effective price (cheapest first)
     */
    protected function sortOffersByPrice(array $offers): array
    {
        usort($offers, function ($offerA, $offerB): int {
            $priceA = is_array($offerA) ? $offerA['effective_price'] : $offerA->effective_price;
            $priceB = is_array($offerB) ? $offerB['effective_price'] : $offerB->effective_price;

            return $priceA <=> $priceB;
        });

        return $offers;
    }

    /**
     * Sort rooms by their cheapest offer (cheapest first)
     */
    protected function sortRoomsByCheapestOffer(array $rooms): array
    {
        usort($rooms, function ($roomA, $roomB): int {
            $minPriceA = $this->getRoomMinPrice($roomA);
            $minPriceB = $this->getRoomMinPrice($roomB);

            return $minPriceA <=> $minPriceB;
        });

        return $rooms;
    }

    /**
     * Get the minimum effective price across all offers for a room
     */
    protected function getRoomMinPrice(array $room): float
    {
        $minPrice = PHP_FLOAT_MAX;

        foreach ($room['offers'] as $offer) {
            $effectivePrice = is_array($offer) ? $offer['effective_price'] : $offer->effective_price;
            $minPrice = min($minPrice, $effectivePrice);
        }

        return $minPrice === PHP_FLOAT_MAX ? 0.0 : $minPrice;
    }

    /**
     * Handle the case when no hotels are found
     */
    protected function handleNoResults(string $hash): void
    {
        $this->search->status = 'no_results';
        $this->search->save();

        Cache::put($hash, ['search' => $this->search, 'hotels' => []], 3600); // Cache for 1 hour
    }

    /**
     * Cache the search results
     */
    protected function cacheResults(string $hash, array $hotels): void
    {
        Cache::put(
            $hash,
            [
                'search' => $this->search,
                'hotels' => $hotels,
            ],
            3600, // Cache for 1 hour
        );
    }

    // Future extensibility methods (placeholders for upcoming features)

    /**
     * Apply filters to hotel data (placeholder for future implementation)
     */
    protected function applyFilters(array $hotels, array $filters = []): array
    {
        return $hotels;
    }

    /**
     * Check availability for hotels (placeholder for future implementation)
     */
    protected function checkAvailability(array $hotels, array $searchCriteria = []): array
    {
        return $hotels;
    }

    /**
     * Apply different sorting options (extensible for future sorting methods)
     */
    protected function applySorting(array $hotels, string $sortBy = 'price_asc'): array
    {
        return match ($sortBy) {
            'price_asc' => $this->sortHotelsByCheapestPrice($hotels),
            'price_desc' => array_reverse($this->sortHotelsByCheapestPrice($hotels)),
            default => $hotels,
        };
    }

    #[Override]
    public function failed(Throwable $throwable): void
    {
        $this->search->status = 'failed';

        parent::failed($throwable);
    }
}

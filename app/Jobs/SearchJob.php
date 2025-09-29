<?php

namespace App\Jobs;

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
            $rooms = $hotel->rooms()->get();

            $roomData = [];

            foreach ($rooms as $room) {
                assert($room instanceof Room);

                // Filter out rooms that don't meet capacity requirements
                if ($room->capacity < $this->search->capacity) {
                    continue;
                }

                $roomArray = $room->toArray();
                $offers = $room->offers()->get();

                // Filter offers by availability and date overlap
                $filteredOffers = $this->filterOffers($offers);

                // Skip room if no valid offers
                if ($filteredOffers === []) {
                    continue;
                }

                $roomArray['offers'] = $this->sortOffersByPrice($filteredOffers);

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
     * Filter offers by availability and date overlap
     */
    protected function filterOffers(array $offers): array
    {
        $filteredOffers = [];

        foreach ($offers as $offer) {
            assert($offer instanceof Offer);

            // Check availability
            if (!$offer->availability) {
                continue;
            }

            // Check date overlap
            if (!$this->datesOverlap($offer->starts_on, $offer->ends_on, $this->search->starts_on, $this->search->ends_on)) {
                continue;
            }

            $filteredOffers[] = $offer;
        }

        return $filteredOffers;
    }

    /**
     * Check if two date ranges overlap
     */
    protected function datesOverlap(string $offer_start, string $offer_end, string $search_start, string $search_end): bool
    {
        // Convert to timestamps for comparison
        $offer_start_ts = strtotime($offer_start);
        $offer_end_ts = strtotime($offer_end);
        $search_start_ts = strtotime($search_start);
        $search_end_ts = strtotime($search_end);

        // Check if ranges overlap: offer_start <= search_end && search_start <= offer_end
        return $offer_start_ts <= $search_end_ts && $search_start_ts <= $offer_end_ts;
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

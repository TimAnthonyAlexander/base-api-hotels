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

            /** @var Room[] $unfilteredRooms */
            $unfilteredRooms = $hotel->rooms()->get();

            $rooms = array_values(array_filter($unfilteredRooms, fn(Room $room): bool => $room->capacity >= $this->search->capacity));
            if ($rooms === []) {
                continue;
            }

            // Batch-fetch all offers for kept rooms in single query to eliminate N+1
            $roomIds = array_map(fn($r): string => $r->id, $rooms);

            $offers = Offer::query()
                ->whereIn('room_id', $roomIds)
                ->where('availability', '=', true)
                ->where('starts_on', '<=', $this->search->starts_on)
                ->where('ends_on', '>=', $this->search->ends_on)
                ->get();

            // Bucket offers by room_id
            $byRoom = [];
            foreach ($offers as $o) {
                $byRoom[$o->room_id][] = $o;
            }

            $roomData = [];
            foreach ($rooms as $room) {
                $candidates = $byRoom[$room->id] ?? [];

                // Apply date containment logic (cheap prefilter above, precise logic here)
                $valid = array_values(array_filter(
                    $candidates,
                    fn($o): bool => $this->offerCoversStay($o->starts_on, $o->ends_on, $this->search->starts_on, $this->search->ends_on)
                ));

                if ($valid === []) {
                    continue;
                }

                $r = $room->toArray();
                $r['offers'] = $this->sortOffersByPrice($valid);
                $roomData[] = $r;
            }

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
     * Sort hotels by cheapest effective price across all their offers with stable secondary sort by ID
     */
    protected function sortHotelsByCheapestPrice(array $hotels): array
    {
        usort($hotels, function (array $hotelA, array $hotelB): int {
            $minPriceA = $this->getHotelMinPrice($hotelA);
            $minPriceB = $this->getHotelMinPrice($hotelB);

            // Primary sort by minimum price
            $priceCmp = $minPriceA <=> $minPriceB;
            if ($priceCmp !== 0) {
                return $priceCmp;
            }

            // Secondary sort by hotel ID for deterministic output on price ties
            $idA = $hotelA['id'];
            $idB = $hotelB['id'];
            return $idA <=> $idB;
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
     * Sort offers by effective price (cheapest first) with stable secondary sort by ID
     */
    protected function sortOffersByPrice(array $offers): array
    {
        usort($offers, function ($offerA, $offerB): int {
            $priceA = is_array($offerA) ? $offerA['effective_price'] : $offerA->effective_price;
            $priceB = is_array($offerB) ? $offerB['effective_price'] : $offerB->effective_price;

            // Primary sort by price
            $priceCmp = $priceA <=> $priceB;
            if ($priceCmp !== 0) {
                return $priceCmp;
            }

            // Secondary sort by ID for deterministic output on price ties
            $idA = is_array($offerA) ? $offerA['id'] : $offerA->id;
            $idB = is_array($offerB) ? $offerB['id'] : $offerB->id;
            return $idA <=> $idB;
        });

        return $offers;
    }

    /**
     * Sort rooms by their cheapest offer (cheapest first) with stable secondary sort by ID
     */
    protected function sortRoomsByCheapestOffer(array $rooms): array
    {
        usort($rooms, function (array $roomA, array $roomB): int {
            $minPriceA = $this->getRoomMinPrice($roomA);
            $minPriceB = $this->getRoomMinPrice($roomB);

            // Primary sort by minimum price
            $priceCmp = $minPriceA <=> $minPriceB;
            if ($priceCmp !== 0) {
                return $priceCmp;
            }

            // Secondary sort by room ID for deterministic output on price ties
            $idA = $roomA['id'];
            $idB = $roomB['id'];
            return $idA <=> $idB;
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

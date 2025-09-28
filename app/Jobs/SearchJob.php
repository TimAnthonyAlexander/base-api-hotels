<?php

namespace App\Jobs;

use Exception;
use App\Models\Hotel;
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

                $roomArray = $room->toArray();
                $offers = $room->offers()->get();
                $roomArray['offers'] = $offers;

                $roomData[] = $roomArray;
            }

            $hotelArray['rooms'] = $roomData;
            $hotelData[] = $hotelArray;
        }

        return $hotelData;
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
        // TODO: Implement filtering logic for star rating, amenities, price range, etc.
        return $hotels;
    }

    /**
     * Check availability for hotels (placeholder for future implementation)
     */
    protected function checkAvailability(array $hotels, array $searchCriteria = []): array
    {
        // TODO: Implement availability checking logic
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
            // TODO: Add more sorting options: star_rating, distance, popularity, etc.
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

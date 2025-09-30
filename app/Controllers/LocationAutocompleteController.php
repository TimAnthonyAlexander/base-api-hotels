<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\Location;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;
use BaseApi\Http\Attributes\ResponseType;
use BaseApi\Http\Attributes\Tag;

/**
 * Location autocomplete endpoint.
 * Provides search suggestions for locations.
 */
#[Tag('API')]
class LocationAutocompleteController extends Controller
{
    public string $query = '';

    /**
     * Search locations by name, city, or country
     */
    #[ResponseType(['locations' => 'array'])]
    public function get(): JsonResponse
    {
        // If no query, return empty results
        if ($this->query === '' || $this->query === '0' || strlen($this->query) < 2) {
            return JsonResponse::ok(['locations' => []]);
        }

        // Get all locations and filter in PHP for cross-database compatibility
        // This approach works with SQLite, MySQL, and PostgreSQL
        $allLocations = Location::query()->get();

        // Filter locations by searching name, city, or country (case-insensitive)
        $searchTerm = strtolower($this->query);
        $matchedLocations = array_filter($allLocations, fn(Location $location): bool => str_contains(strtolower($location->name), $searchTerm)
            || str_contains(strtolower($location->city), $searchTerm)
            || str_contains(strtolower($location->country), $searchTerm));

        // Limit to 10 results
        $matchedLocations = array_slice($matchedLocations, 0, 10);

        // Format the response
        $results = array_map(fn(Location $location): array => [
            'id' => $location->id,
            'name' => $location->name,
            'city' => $location->city,
            'country' => $location->country,
            'label' => sprintf('%s, %s', $location->city, $location->country),
        ], $matchedLocations);

        return JsonResponse::ok(['locations' => $results]);
    }
}

<?php

namespace App\Controllers;

use App\Jobs\SearchJob;
use App\Models\Location;
use App\Models\Search;
use App\Models\User;
use BaseApi\Cache\Cache;
use BaseApi\Controllers\Controller;
use BaseApi\Http\JsonResponse;

/**
 * SearchController
 * 
 * Add your controller description here.
 */
class SearchController extends Controller
{
    public string $search_id = '';

    public string $location_id = '';

    public string $starts_on = '';

    public string $ends_on = '';

    public int $capacity = 1;

    public function get(): JsonResponse
    {
        $search = Search::find($this->search_id);

        if (!$search instanceof Search) {
            return JsonResponse::error('Search not found', 404);
        }

        $hasCache = Cache::has($search->generateDeterministicHash());

        $cachedSearch = $hasCache ? Cache::get($search->generateDeterministicHash()) : null;

        return JsonResponse::ok([
            'search' => $cachedSearch['search'] ?? $search,
            'hotels' => $cachedSearch['hotels'] ?? [],
        ]);
    }

    public function post(): JsonResponse
    {
        $this->validate([
            'location_id' => 'required',
            'starts_on' => 'required|string',
            'ends_on' => 'required|string',
            'capacity' => 'required|integer|min:1',
        ]);

        $location = Location::find($this->location_id);

        if (!$location instanceof Location) {
            return JsonResponse::error('Location not found', 404);
        }

        $user = User::find($this->request->user['id'] ?? '');

        if (!$user instanceof User) {
            return JsonResponse::error('User not found', 404);
        }

        $search = new Search();
        $search->user_id = $user->id;
        $search->location_id = $location->id;
        $search->starts_on = $this->starts_on;
        $search->ends_on = $this->ends_on;
        $search->capacity = $this->capacity;

        $hash = $search->generateDeterministicHash();

        if (Cache::has($hash)) {
            $cached = Cache::get($hash);

            return JsonResponse::ok([
                'search_id' => $cached['search']->id,
            ]);
        }

        $search->save();

        dispatch(new SearchJob($search));

        return JsonResponse::ok([
            'search_id' => $search->id,
        ]);
    }
}

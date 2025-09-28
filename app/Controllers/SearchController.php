<?php

namespace App\Controllers;

use App\Jobs\SearchJob;
use App\Models\Location;
use App\Models\Search;
use App\Models\User;
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

    public function get(): JsonResponse
    {
        $search = Search::find($this->search_id);

        if (!$search instanceof Search) {
            return JsonResponse::error('Search not found', 404);
        }

        return JsonResponse::ok([
            'search' => $search,
        ]);
    }

    public function post(): JsonResponse
    {
        $this->validate([
            'location_id' => 'required',
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
        $search->user = $user;
        $search->location = $location;
        $search->save();

        dispatch(new SearchJob($search));

        return JsonResponse::ok([
            'search_id' => $search->id,
        ]);
    }
}

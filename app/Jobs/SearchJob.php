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

        $hotels = Hotel::where('location_id', '=', $this->search->location_id)->get();

        if ($hotels === []) {
            $this->search->status = 'no_results';
            $this->search->save();

            Cache::put($hash, ['search' => $this->search, 'hotels' => []], 3600); // Cache for 1 hour
            return;
        }

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

        $this->search->status = 'completed';
        $this->search->results = count($hotelData);
        $this->search->save();

        Cache::put(
            $hash,
            [
                'search' => $this->search,
                'hotels' => $hotelData,
            ],
            3600, // Cache for 1 hour
        );
    }

    #[Override]
    public function failed(Throwable $throwable): void
    {
        $this->search->status = 'failed';

        parent::failed($throwable);
    }
}

<?php

namespace App\Jobs;

use App\Models\Hotel;
use App\Models\Search;
use Override;
use Throwable;
use BaseApi\Queue\Job;

class SearchJob extends Job
{
    protected int $maxRetries = 1;

    protected int $retryDelay = 30; // seconds

    public function __construct(
        public Search $search,
    ) {
        // Initialize job data
    }

    #[Override]
    public function handle(): void
    {
        $this->search->status = 'started';
        $this->search->save();

        $hotels = Hotel::where('location_id', '=', $this->search->location->id)->get();

        if ($hotels === []) {
            $this->search->status = 'no_results';
            $this->search->save();
            return;
        }
    }

    #[Override]
    public function failed(Throwable $throwable): void
    {
        // Handle job failure (optional)
        // This method is called when the job fails permanently
        $this->search->status = 'failed';

        parent::failed($throwable);

        // Add custom failure handling:
        // - Send notification to administrators
        // - Log to external service
        // - Clean up resources
    }
}

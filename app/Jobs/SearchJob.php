<?php

namespace App\Jobs;

use Override;
use Throwable;
use BaseApi\Queue\Job;

class SearchJob extends Job
{
    protected int $maxRetries = 1;

    protected int $retryDelay = 30; // seconds

    public function __construct(
        // Add your job parameters here
    )
    {
        // Initialize job data
    }

    #[Override]
    public function handle(): void
    {
        // Implement your job logic here
        // This method will be called when the job is processed

        // Example:
        // $this->processData();
        // $this->sendNotification();
    }

    #[Override]
    public function failed(Throwable $throwable): void
    {
        // Handle job failure (optional)
        // This method is called when the job fails permanently

        parent::failed($throwable);

        // Add custom failure handling:
        // - Send notification to administrators
        // - Log to external service
        // - Clean up resources
    }
}


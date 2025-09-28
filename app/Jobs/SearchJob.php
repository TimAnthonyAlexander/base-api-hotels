<?php

namespace App\Jobs;

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

    public function handle(): void
    {
        // Implement your job logic here
        // This method will be called when the job is processed

        // Example:
        // $this->processData();
        // $this->sendNotification();
    }

    public function failed(\Throwable $exception): void
    {
        // Handle job failure (optional)
        // This method is called when the job fails permanently

        parent::failed($exception);

        // Add custom failure handling:
        // - Send notification to administrators
        // - Log to external service
        // - Clean up resources
    }
}


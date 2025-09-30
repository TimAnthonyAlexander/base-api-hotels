<?php

declare(strict_types=1);

namespace App\Providers;

use RuntimeException;

/**
 * Abstract base class for import providers
 * 
 * Providers can import hotel, location, room, and offer data from various sources
 * (CSV files, APIs, databases, etc.) and persist them to the application database.
 */
abstract class ImportProvider
{
    protected int $locationsImported = 0;

    protected int $hotelsImported = 0;

    protected int $roomsImported = 0;

    protected int $offersImported = 0;

    protected array $locationCache = [];

    protected array $hotelCache = [];

    protected array $roomCache = [];

    /**
     * Execute the full import process
     * 
     * @return array Statistics about the import (hotels, rooms, offers, locations)
     */
    abstract public function import(): array;

    /**
     * Get the name/identifier of this provider
     */
    abstract public function getName(): string;

    /**
     * Validate that the provider is properly configured and can execute
     *
     * @throws RuntimeException if validation fails
     */
    abstract public function validate(): void;

    /**
     * Reset import counters
     */
    protected function resetCounters(): void
    {
        $this->locationsImported = 0;
        $this->hotelsImported = 0;
        $this->roomsImported = 0;
        $this->offersImported = 0;
        $this->locationCache = [];
        $this->hotelCache = [];
        $this->roomCache = [];
    }

    /**
     * Get import statistics
     */
    protected function getStats(): array
    {
        return [
            'provider' => $this->getName(),
            'locations' => $this->locationsImported,
            'hotels' => $this->hotelsImported,
            'rooms' => $this->roomsImported,
            'offers' => $this->offersImported,
        ];
    }

    /**
     * Log a message during import
     */
    protected function log(string $message): void
    {
        fwrite(STDOUT, sprintf('[%s] %s', $this->getName(), $message) . PHP_EOL);
    }
}


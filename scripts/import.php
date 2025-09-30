<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Auth\SimpleUserProvider;
use App\Providers\CSVProvider;
use BaseApi\App;

/**
 * Import Script
 * 
 * Imports hotel data from various providers into the database.
 * 
 * Usage:
 *   php scripts/import.php csv /path/to/data/directory
 *   php scripts/import.php csv data/imports
 * 
 * CSV Provider expects:
 *   - locations.csv: name, city, country, latitude, longitude
 *   - hotels.csv: title, description, location_name, star_rating
 *   - rooms.csv: hotel_title, category, description, capacity
 *   - offers.csv: hotel_title, room_category, price, discount, availability, starts_on, ends_on
 */

// Bootstrap the application
App::boot(__DIR__ . '/..');
App::setUserProvider(new SimpleUserProvider());

// Parse command line arguments
$provider = $argv[1] ?? null;
$dataPath = $argv[2] ?? null;

if (!$provider) {
    fwrite(STDERR, "Error: Provider argument is required.\n");
    fwrite(STDERR, "Usage: php scripts/import.php <provider> <data_path>\n");
    fwrite(STDERR, "Example: php scripts/import.php csv data/imports\n");
    exit(1);
}

if (!$dataPath) {
    fwrite(STDERR, "Error: Data path argument is required.\n");
    fwrite(STDERR, "Usage: php scripts/import.php <provider> <data_path>\n");
    exit(1);
}

// Resolve relative paths
if (!str_starts_with($dataPath, '/')) {
    $dataPath = __DIR__ . '/../' . $dataPath;
}

try {
    // Initialize the appropriate provider
    $importProvider = match (strtolower($provider)) {
        'csv' => new CSVProvider($dataPath),
        default => throw new \InvalidArgumentException("Unknown provider: {$provider}. Available: csv")
    };

    // Validate and execute import
    $importProvider->validate();
    $stats = $importProvider->import();

    // Output results
    fwrite(STDOUT, "\n=== Import Complete ===\n");
    fwrite(STDOUT, json_encode($stats, JSON_PRETTY_PRINT) . PHP_EOL);

} catch (\Throwable $e) {
    fwrite(STDERR, "\nError: " . $e->getMessage() . "\n");
    fwrite(STDERR, "File: " . $e->getFile() . ":" . $e->getLine() . "\n");
    if (getenv('APP_DEBUG') === 'true') {
        fwrite(STDERR, "\nStack trace:\n" . $e->getTraceAsString() . "\n");
    }
    exit(1);
}


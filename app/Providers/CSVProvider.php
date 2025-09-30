<?php

declare(strict_types=1);

namespace App\Providers;

use Override;
use RuntimeException;
use BaseApi\Models\BaseModel;
use App\Models\Hotel;
use App\Models\Location;
use App\Models\Offer;
use App\Models\Room;

/**
 * CSV Import Provider
 * 
 * Imports hotels, rooms, and offers from CSV files.
 * Expected CSV files in the data directory:
 * - locations.csv: name, city, country, latitude, longitude
 * - hotels.csv: title, description, location_name, star_rating
 * - rooms.csv: hotel_title, category, description, capacity
 * - offers.csv: hotel_title, room_category, price, discount, availability, starts_on, ends_on
 */
class CSVProvider extends ImportProvider
{
    private readonly string $dataDirectory;

    public function __construct(string $dataDirectory)
    {
        $this->dataDirectory = rtrim($dataDirectory, '/');
    }

    #[Override]
    public function getName(): string
    {
        return 'CSV';
    }

    #[Override]
    public function validate(): void
    {
        if (!is_dir($this->dataDirectory)) {
            throw new RuntimeException('Data directory does not exist: ' . $this->dataDirectory);
        }

        $requiredFiles = ['locations.csv', 'hotels.csv', 'rooms.csv', 'offers.csv'];
        foreach ($requiredFiles as $requiredFile) {
            $path = $this->dataDirectory . '/' . $requiredFile;
            if (!file_exists($path)) {
                throw new RuntimeException('Required CSV file not found: ' . $path);
            }

            if (!is_readable($path)) {
                throw new RuntimeException('CSV file is not readable: ' . $path);
            }
        }
    }

    #[Override]
    public function import(): array
    {
        $this->resetCounters();
        $this->validate();

        $this->log('Starting CSV import...');

        // Import in order of dependencies: locations -> hotels -> rooms -> offers
        $this->importLocations();
        $this->importHotels();
        $this->importRooms();
        $this->importOffers();

        $this->log('Import completed successfully.');

        return $this->getStats();
    }

    private function importLocations(): void
    {
        $this->log('Importing locations...');
        $file = $this->dataDirectory . '/locations.csv';
        $rows = $this->readCsv($file);

        foreach ($rows as $row) {
            // Check if location already exists
            $existing = Location::where('name', '=', $row['name'])
                ->where('city', '=', $row['city'])
                ->where('country', '=', $row['country'])
                ->first();

            if ($existing instanceof BaseModel) {
                $this->locationCache[$row['name']] = $existing->id;
                continue;
            }

            $location = new Location();
            $location->name = $row['name'];
            $location->city = $row['city'];
            $location->country = $row['country'];
            $location->latitude = (float) $row['latitude'];
            $location->longitude = (float) $row['longitude'];
            $location->save();

            $this->locationCache[$row['name']] = $location->id;
            $this->locationsImported++;
        }

        $this->log(sprintf('Imported %d locations.', $this->locationsImported));
    }

    private function importHotels(): void
    {
        $this->log('Importing hotels...');
        $file = $this->dataDirectory . '/hotels.csv';
        $rows = $this->readCsv($file);

        foreach ($rows as $row) {
            $locationId = $this->locationCache[$row['location_name']] ?? null;
            if (!$locationId) {
                $this->log(sprintf("Warning: Location '%s' not found for hotel '%s'. Skipping.", $row['location_name'], $row['title']));
                continue;
            }

            // Check if hotel already exists
            $existing = Hotel::where('title', '=', $row['title'])
                ->where('location_id', '=', $locationId)
                ->first();

            if ($existing instanceof BaseModel) {
                $this->hotelCache[$row['title']] = $existing->id;
                continue;
            }

            $hotel = new Hotel();
            $hotel->title = $row['title'];
            $hotel->description = $row['description'];
            $hotel->location_id = $locationId;
            $hotel->star_rating = (int) $row['star_rating'];
            $hotel->save();

            $this->hotelCache[$row['title']] = $hotel->id;
            $this->hotelsImported++;
        }

        $this->log(sprintf('Imported %d hotels.', $this->hotelsImported));
    }

    private function importRooms(): void
    {
        $this->log('Importing rooms...');
        $file = $this->dataDirectory . '/rooms.csv';
        $rows = $this->readCsv($file);

        foreach ($rows as $row) {
            $hotelId = $this->hotelCache[$row['hotel_title']] ?? null;
            if (!$hotelId) {
                $this->log(sprintf("Warning: Hotel '%s' not found for room. Skipping.", $row['hotel_title']));
                continue;
            }

            // Check if room already exists (hotel + category combination)
            $existing = Room::where('hotel_id', '=', $hotelId)
                ->where('category', '=', $row['category'])
                ->where('description', '=', $row['description'])
                ->first();

            if ($existing instanceof BaseModel) {
                // Cache by hotel_title + category for offer matching
                $cacheKey = $row['hotel_title'] . '::' . $row['category'];
                $this->roomCache[$cacheKey] = $existing->id;
                continue;
            }

            $room = new Room();
            $room->hotel_id = $hotelId;
            $room->category = $row['category'];
            $room->description = $row['description'];
            $room->capacity = (int) $row['capacity'];
            $room->save();

            // Cache by hotel_title + category for offer matching
            $cacheKey = $row['hotel_title'] . '::' . $row['category'];
            $this->roomCache[$cacheKey] = $room->id;
            $this->roomsImported++;
        }

        $this->log(sprintf('Imported %d rooms.', $this->roomsImported));
    }

    private function importOffers(): void
    {
        $this->log('Importing offers...');
        $file = $this->dataDirectory . '/offers.csv';
        $rows = $this->readCsv($file);

        foreach ($rows as $row) {
            $cacheKey = $row['hotel_title'] . '::' . $row['room_category'];
            $roomId = $this->roomCache[$cacheKey] ?? null;

            if (!$roomId) {
                $this->log(sprintf("Warning: Room '%s' at hotel '%s' not found. Skipping offer.", $row['room_category'], $row['hotel_title']));
                continue;
            }

            $price = (float) $row['price'];
            $discount = (float) ($row['discount'] ?? 0);
            $effectivePrice = round($price - $discount, 2);

            // Check if offer already exists
            $existing = Offer::where('room_id', '=', $roomId)
                ->where('price', '=', $price)
                ->where('starts_on', '=', $row['starts_on'])
                ->where('ends_on', '=', $row['ends_on'])
                ->first();

            if ($existing instanceof BaseModel) {
                continue;
            }

            $offer = new Offer();
            $offer->room_id = $roomId;
            $offer->price = $price;
            $offer->discount = $discount;
            $offer->effective_price = $effectivePrice;
            $offer->availability = $this->parseBoolean($row['availability'] ?? 'true');
            $offer->starts_on = $row['starts_on'];
            $offer->ends_on = $row['ends_on'];
            $offer->save();

            $this->offersImported++;
        }

        $this->log(sprintf('Imported %d offers.', $this->offersImported));
    }

    /**
     * Read a CSV file and return rows as associative arrays
     */
    private function readCsv(string $file): array
    {
        $rows = [];
        $handle = fopen($file, 'r');
        
        if ($handle === false) {
            throw new RuntimeException('Failed to open CSV file: ' . $file);
        }

        $headers = fgetcsv($handle);
        if ($headers === false) {
            fclose($handle);
            throw new RuntimeException('CSV file is empty or invalid: ' . $file);
        }

        while (($data = fgetcsv($handle)) !== false) {
            if (count($data) === count($headers)) {
                $rows[] = array_combine($headers, $data);
            }
        }

        fclose($handle);
        return $rows;
    }

    /**
     * Parse boolean values from CSV strings
     */
    private function parseBoolean(string $value): bool
    {
        $value = strtolower(trim($value));
        return in_array($value, ['true', '1', 'yes', 'y'], true);
    }
}


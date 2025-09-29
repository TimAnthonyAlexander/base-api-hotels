<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Auth\SimpleUserProvider;
use BaseApi\App;
use App\Models\Hotel;
use App\Models\Location;
use App\Models\Offer;
use App\Models\Room;
use Faker\Factory as FakerFactory;

App::boot(__DIR__ . '/..');
App::setUserProvider(new SimpleUserProvider());

$faker = FakerFactory::create('en_US');

$countries = [
    'Germany' => ['Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt', 'Stuttgart', 'Dresden', 'Leipzig', 'Düsseldorf', 'Nuremberg'],
    'France' => ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Nice', 'Toulouse', 'Lille', 'Strasbourg', 'Nantes', 'Montpellier'],
    'Italy' => ['Rome', 'Milan', 'Florence', 'Venice', 'Naples', 'Turin', 'Bologna', 'Genoa', 'Verona', 'Palermo'],
    'Spain' => ['Madrid', 'Barcelona', 'Seville', 'Valencia', 'Bilbao', 'Malaga', 'Granada', 'Zaragoza', 'Cordoba', 'Alicante'],
    'United Kingdom' => ['London', 'Manchester', 'Edinburgh', 'Birmingham', 'Glasgow', 'Bristol', 'Leeds', 'Liverpool', 'Oxford', 'Cambridge'],
    'Netherlands' => ['Amsterdam', 'Rotterdam', 'Utrecht', 'The Hague', 'Eindhoven', 'Groningen', 'Maastricht', 'Leiden', 'Delft', 'Haarlem'],
    'Austria' => ['Vienna', 'Salzburg', 'Graz', 'Innsbruck', 'Linz', 'Klagenfurt', 'Hallstatt', 'Villach', 'Bregenz', 'Wels'],
    'Switzerland' => ['Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne', 'Lugano', 'Lucerne', 'St. Gallen', 'Interlaken', 'Zermatt'],
    'United States' => ['New York', 'San Francisco', 'Los Angeles', 'Chicago', 'Miami', 'Boston', 'Seattle', 'Austin', 'Denver', 'Atlanta'],
    'Portugal' => ['Lisbon', 'Porto', 'Faro', 'Coimbra', 'Braga', 'Aveiro', 'Evora', 'Setubal', 'Guimaraes', 'Sintra']
];

$locationQualifiers = [
    'City Center',
    'Old Town',
    'Riverside',
    'Harbor',
    'Business District',
    'University Quarter',
    'Central Station',
    'Lakeside',
    'Airport Area',
    'Historic Quarter',
    'Tech Park',
    'Market Square',
    'Theater District',
    'Expo Park',
    'Seaside',
    'Financial District',
    'Botanical Quarter',
    'Museum Mile',
    'Cathedral Quarter',
    'Canal District'
];

$hotelAdjectives = [
    'Grand',
    'Royal',
    'Urban',
    'Golden',
    'Emerald',
    'Ivory',
    'Azure',
    'Velvet',
    'Majestic',
    'Quiet',
    'Noble',
    'Modern',
    'Classic',
    'Boutique',
    'Panorama',
    'Skyline',
    'Central',
    'Opera',
    'Garden',
    'Park',
    'Regency',
    'Liberty',
    'Crown',
    'Alpine',
    'Atlantic',
    'Continental',
    'Summit',
    'Harbor',
    'Cathedral',
    'Riverview',
    'Sunset',
    'Silver',
    'Capital'
];

$hotelNouns = [
    'Hotel',
    'Residence',
    'Suites',
    'Inn',
    'Plaza',
    'Lodge',
    'House',
    'Collection',
    'Retreat',
    'Palace',
    'Resort',
    'Courtyard',
    'Terrace',
    'Villa',
    'Gallery',
    'Arcade',
    'Pavilion',
    'Exchange',
    'Hall',
    'Quarter',
    'Landing'
];

$roomCategories = [
    'Standard',
    'Standard Twin',
    'Deluxe',
    'Deluxe Twin',
    'Superior',
    'Superior King',
    'Queen',
    'King',
    'Family',
    'Junior Suite',
    'Suite',
    'Executive Suite',
    'Penthouse',
    'Studio',
    'Accessible'
];

$descOpeners = [
    'A curated stay steps from',
    'An elegant base near',
    'A contemporary space overlooking',
    'A calm retreat by',
    'A characterful property in',
    'Stylish rooms set within',
    'Light-filled suites facing',
    'Restful interiors near'
];
$descClosers = [
    'with effortless access to transit.',
    'designed for longer stays.',
    'with artisanal breakfast included.',
    'ideal for business and leisure.',
    'with quiet workspaces and fast Wi-Fi.',
    'moments from key sights.',
    'with views across the skyline.',
    'that balances comfort and utility.'
];

$hotelsTarget = 60;
$roomsPerHotelMin = 5;
$roomsPerHotelMax = 12;
$offersPerRoomMin = 1;
$offersPerRoomMax = 3;

$randCountry = static function (array $countries): array {
    $countryKeys = array_keys($countries);
    if (!$countryKeys) {
        throw new RuntimeException('No countries configured');
    }
    $country = $countryKeys[array_rand($countryKeys)];

    $cities = $countries[$country] ?? [];
    if (!$cities) {
        throw new RuntimeException("No cities configured for {$country}");
    }
    $city = $cities[array_rand($cities)];

    return [$country, $city];
};

$pick = static function (array $arr) use ($faker) {
    return $faker->randomElement($arr);
};

$mkTitle = static function (string $city) use ($pick, $hotelAdjectives, $hotelNouns) {
    $parts = [
        $pick($hotelAdjectives),
        $pick($hotelNouns)
    ];
    if (random_int(0, 1) === 1) {
        $parts[] = $city;
    }
    return implode(' ', array_unique($parts));
};

$mkDesc = static function (string $city) use ($pick, $descOpeners, $descClosers) {
    return $pick($descOpeners) . ' ' . $city . ', ' . $pick($descClosers);
};

$calcPrice = static function (int $stars, int $capacity, string $category): float {
    $base = 35.0 + ($stars * 30.0) + ($capacity * 12.0);
    $catBump = match (true) {
        str_contains($category, 'Suite') => 70.0,
        str_contains($category, 'Deluxe') => 40.0,
        str_contains($category, 'Superior') => 25.0,
        str_contains($category, 'Penthouse') => 120.0,
        default => 0.0
    };
    return round(max(25.0, $base + $catBump + random_int(-10, 20)), 2);
};

$hotelsCreated = 0;
$roomsCreated = 0;
$offersCreated = 0;

for ($i = 0; $i < $hotelsTarget; $i++) {
    [$country, $city] = $randCountry($countries);

    $location = new Location();
    $location->name = $pick($locationQualifiers);
    $location->city = $city;
    $location->country = $country;
    $location->latitude = (float)$faker->latitude();
    $location->longitude = (float)$faker->longitude();
    $location->save();

    $hotel = new Hotel();
    $hotel->title = $mkTitle($city);
    $hotel->description = $mkDesc($city);
    $hotel->location = $location;
    $hotel->star_rating = random_int(2, 5);
    $hotel->save();
    $hotelsCreated++;

    $roomsCount = random_int($roomsPerHotelMin, $roomsPerHotelMax);
    for ($r = 0; $r < $roomsCount; $r++) {
        $category = $pick($roomCategories);
        $capacity = random_int(1, 6);

        $room = new Room();
        $room->hotel = $hotel;
        $room->category = $category;
        $room->description = $faker->sentence(10);
        $room->capacity = $capacity;
        $room->save();
        $roomsCreated++;

        $offersCount = random_int($offersPerRoomMin, $offersPerRoomMax);
        for ($o = 0; $o < $offersCount; $o++) {
            $price = $calcPrice($hotel->star_rating, $capacity, $category);
            if ($o > 0) {
                $price = round($price + random_int(-15, 25), 2);
            }

            // Generate realistic date ranges
            $startDate = $faker->dateTimeBetween('now', '+6 months');
            $endDate = $faker->dateTimeBetween($startDate, $startDate->format('Y-m-d') . ' +3 months');

            $offer = new Offer();
            $offer->room = $room;
            $offer->price = (float)$price;
            $offer->discount = max(0.0, round($price * (random_int(0, 20) / 100.0), 2));
            $offer->effective_price = round($offer->price - $offer->discount, 2);
            $offer->availability = random_int(1, 10) > 2; // 80% availability rate
            $offer->starts_on = $startDate->format('Y-m-d');
            $offer->ends_on = $endDate->format('Y-m-d');
            $offer->save();
            $offersCreated++;
        }
    }
}

fwrite(STDOUT, json_encode([
    'hotels' => $hotelsCreated,
    'rooms' => $roomsCreated,
    'offers' => $offersCreated
], JSON_PRETTY_PRINT) . PHP_EOL);

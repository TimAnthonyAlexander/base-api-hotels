<?php

declare(strict_types=1);

namespace App\Models;

use BaseApi\Models\BaseModel;

final class Hotel extends BaseModel
{
    public string $title;
    public string $description;

    public string $address;
    public float $latitude;
    public float $longitude;

    public int $star_rating; // 1 to 5
}

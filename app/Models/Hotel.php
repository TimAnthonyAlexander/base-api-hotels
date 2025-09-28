<?php

declare(strict_types=1);

namespace App\Models;

use BaseApi\Database\Relations\HasMany;
use BaseApi\Models\BaseModel;

final class Hotel extends BaseModel
{
    public string $title;

    public string $description;

    public Location $location;

    public int $star_rating; // 1 to 5

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class);
    }
}

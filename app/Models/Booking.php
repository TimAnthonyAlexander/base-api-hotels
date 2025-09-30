<?php

namespace App\Models;

use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Models\BaseModel;

/**
 * Booking Model
 * 
 * Represents a hotel booking made by a user for a specific room and offer.
 */
class Booking extends BaseModel
{
    public string $user_id;

    public string $search_id;

    public string $hotel_id;

    public string $room_id;

    public string $offer_id;

    public string $status = 'pending'; // pending, confirmed, cancelled

    public string $starts_on = '';

    public string $ends_on = '';

    public int $capacity = 1;

    public float $total_price = 0.0;

    public static array $indexes = [
        'user_id' => 'index',
        'search_id' => 'index',
        'hotel_id' => 'index',
        'created_at' => 'index',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function search(): BelongsTo
    {
        return $this->belongsTo(Search::class);
    }

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function offer(): BelongsTo
    {
        return $this->belongsTo(Offer::class);
    }
}


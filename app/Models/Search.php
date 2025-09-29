<?php

namespace App\Models;

use BaseApi\Database\Relations\BelongsTo;
use BaseApi\Models\BaseModel;

/**
 * Search Model
 */
class Search extends BaseModel
{
    public string $status = 'pending';

    public string $user_id;

    public string $location_id;

    public int $results = 0;

    public string $starts_on;

    public string $ends_on;

    public int $capacity;

    public static array $indexes = [
        'user_id' => 'index',
        'location_id' => 'index',
        'created_at' => 'index'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function generateDeterministicHash(): string
    {
        $data = $this->user_id . '|' . $this->location_id . '|' . $this->starts_on . '|' . $this->ends_on . '|' . $this->capacity;
        return hash('sha256', $data);
    }
}

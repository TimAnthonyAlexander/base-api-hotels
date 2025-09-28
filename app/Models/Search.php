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
        $this->load(['user', 'location']);

        $data = $this->user_id . '|' . $this->location_id . '|' . $this->created_at;
        return hash('sha256', $data);
    }
}

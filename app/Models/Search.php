<?php

namespace App\Models;

use BaseApi\Models\BaseModel;

/**
 * Search Model
 */
class Search extends BaseModel
{
    public string $status = 'pending';

    public ?User $user = null;

    public ?Location $location = null;

    public static array $indexes = [
        'user_id' => 'index',
        'location_id' => 'index',
        'created_at' => 'index'
    ];

    public function generateDeterministicHash(): string
    {
        $data = $this->user->id . '|' . $this->location->id . '|' . $this->created_at;
        return hash('sha256', $data);
    }
}

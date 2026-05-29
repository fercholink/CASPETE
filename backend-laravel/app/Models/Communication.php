<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Communication extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'school_id',
        'sender_id',
        'receiver_id',
        'title',
        'body',
        'attachment_url',
        'is_read',
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }
}

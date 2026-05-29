<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'school_id',
        'parent_id',
        'national_id',
        'full_name',
        'grade',
        'photo_url',
        'balance',
        'active',
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function parent()
    {
        return $this->belongsTo(User::class, 'parent_id');
    }

    public function courses()
    {
        return $this->belongsToMany(Course::class, 'course_student');
    }

    public function grades()
    {
        return $this->hasMany(Grade::class);
    }
}

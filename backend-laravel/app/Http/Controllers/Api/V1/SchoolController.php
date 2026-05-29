<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\School;
use Illuminate\Http\Request;

class SchoolController extends Controller
{
    /**
     * Display a listing of the active schools.
     */
    public function index(Request $request)
    {
        $schools = School::where('active', true)->latest()->get();
        return response()->json(['success' => true, 'data' => $schools]);
    }
}

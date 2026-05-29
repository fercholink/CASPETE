<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = User::with(['teacher', 'school']);

        if ($request->has('role')) {
            $query->where('role', $request->query('role'));
        }

        if ($request->has('school_id')) {
            $query->where('school_id', $request->query('school_id'));
        }

        $users = $query->latest()->get();

        // Returns direct array or matches standard response
        return response()->json($users);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'full_name' => 'required|string|max:200',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'required|string|in:PARENT,VENDOR,SCHOOL_ADMIN,SUPER_ADMIN,TEACHER',
            'phone' => 'nullable|string|max:20',
            'school_id' => 'nullable|exists:schools,id',
            'specialty' => 'nullable|string|max:100', // for teacher profile
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        $user = User::create([
            'name' => $request->full_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'role' => $request->role,
            'school_id' => $request->school_id,
            'password' => Hash::make($request->password),
        ]);

        // If role is TEACHER, create Teacher profile automatically
        if ($user->role === 'TEACHER') {
            Teacher::create([
                'user_id' => $user->id,
                'school_id' => $user->school_id ?? $request->school_id,
                'specialty' => $request->specialty,
            ]);
        }

        return response()->json(['success' => true, 'data' => $user->load(['teacher', 'school'])], 201);
    }
}

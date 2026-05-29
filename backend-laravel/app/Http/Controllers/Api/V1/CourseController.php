<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CourseController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'TEACHER') {
            $teacher = $user->teacher;
            if (!$teacher) {
                return response()->json(['error' => 'Perfil de docente no encontrado.'], 404);
            }
            $courses = Course::withCount('students')
                ->where('teacher_id', $teacher->id)
                ->get();
        } elseif ($user->role === 'SCHOOL_ADMIN') {
            $courses = Course::withCount('students')
                ->where('school_id', $user->school_id)
                ->get();
        } elseif ($user->role === 'SUPER_ADMIN') {
            $courses = Course::withCount('students')->get();
        } else {
            return response()->json(['error' => 'No autorizado.'], 403);
        }

        return response()->json(['success' => true, 'data' => $courses]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (!in_array($user->role, ['SCHOOL_ADMIN', 'SUPER_ADMIN'])) {
            return response()->json(['error' => 'No autorizado.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'academic_period' => 'nullable|string|max:50',
            'teacher_id' => 'required|exists:teachers,id',
            'school_id' => 'nullable|exists:schools,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        $data = $request->all();
        // For school admins, force their own school_id
        if ($user->role === 'SCHOOL_ADMIN') {
            $data['school_id'] = $user->school_id;
        }

        $course = Course::create($data);

        if ($request->has('student_ids')) {
            $course->students()->sync($request->student_ids);
        }

        return response()->json(['success' => true, 'data' => $course->load('students'), 'message' => 'Curso creado exitosamente.'], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, string $id)
    {
        $user = $request->user();
        $course = Course::with(['teacher.user', 'students'])->find($id);

        if (!$course) {
            return response()->json(['error' => 'Curso no encontrado.'], 404);
        }

        // Authorization checks
        if ($user->role === 'TEACHER') {
            $teacher = $user->teacher;
            if (!$teacher || $course->teacher_id !== $teacher->id) {
                return response()->json(['error' => 'No autorizado para ver este curso.'], 403);
            }
        } elseif ($user->role === 'SCHOOL_ADMIN') {
            if ($course->school_id !== $user->school_id) {
                return response()->json(['error' => 'No autorizado.'], 403);
            }
        } elseif ($user->role !== 'SUPER_ADMIN') {
            // Check if user is parent and has a student in this course
            if ($user->role === 'PARENT') {
                $hasStudent = $course->students()->where('parent_id', $user->id)->exists();
                if (!$hasStudent) {
                    return response()->json(['error' => 'No autorizado.'], 403);
                }
            } else {
                return response()->json(['error' => 'No autorizado.'], 403);
            }
        }

        return response()->json(['success' => true, 'data' => $course]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = $request->user();
        if (!in_array($user->role, ['SCHOOL_ADMIN', 'SUPER_ADMIN'])) {
            return response()->json(['error' => 'No autorizado.'], 403);
        }

        $course = Course::find($id);
        if (!$course) {
            return response()->json(['error' => 'Curso no encontrado.'], 404);
        }

        if ($user->role === 'SCHOOL_ADMIN' && $course->school_id !== $user->school_id) {
            return response()->json(['error' => 'No autorizado.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:100',
            'academic_period' => 'nullable|string|max:50',
            'teacher_id' => 'sometimes|required|exists:teachers,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        $course->update($request->all());

        if ($request->has('student_ids')) {
            $course->students()->sync($request->student_ids);
        }

        return response()->json(['success' => true, 'data' => $course->load('students'), 'message' => 'Curso actualizado exitosamente.']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, string $id)
    {
        $user = $request->user();
        if (!in_array($user->role, ['SCHOOL_ADMIN', 'SUPER_ADMIN'])) {
            return response()->json(['error' => 'No autorizado.'], 403);
        }

        $course = Course::find($id);
        if (!$course) {
            return response()->json(['error' => 'Curso no encontrado.'], 404);
        }

        if ($user->role === 'SCHOOL_ADMIN' && $course->school_id !== $user->school_id) {
            return response()->json(['error' => 'No autorizado.'], 403);
        }

        $course->delete();

        return response()->json(['success' => true, 'message' => 'Curso eliminado exitosamente.']);
    }

    /**
     * Display students enrolled in a specific course.
     */
    public function students(Request $request, string $courseId)
    {
        $user = $request->user();
        $course = Course::find($courseId);

        if (!$course) {
            return response()->json(['error' => 'Curso no encontrado.'], 404);
        }

        // Authorization checks
        if ($user->role === 'TEACHER') {
            $teacher = $user->teacher;
            if (!$teacher || $course->teacher_id !== $teacher->id) {
                return response()->json(['error' => 'No autorizado.'], 403);
            }
        } elseif ($user->role === 'SCHOOL_ADMIN') {
            if ($course->school_id !== $user->school_id) {
                return response()->json(['error' => 'No autorizado.'], 403);
            }
        } elseif ($user->role !== 'SUPER_ADMIN') {
            return response()->json(['error' => 'No autorizado.'], 403);
        }

        $students = $course->students()->get();

        return response()->json(['success' => true, 'data' => $students]);
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Grade;
use App\Models\Course;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class GradeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Grade::with(['course', 'student', 'teacher.user']);

        // Filter based on role
        if ($user->role === 'TEACHER') {
            $teacher = $user->teacher;
            if (!$teacher) {
                return response()->json(['error' => 'Perfil de docente no encontrado.'], 404);
            }
            $query->where('teacher_id', $teacher->id);
        } elseif ($user->role === 'SCHOOL_ADMIN') {
            $query->whereHas('course', function ($q) use ($user) {
                $q->where('school_id', $user->school_id);
            });
        } elseif ($user->role === 'PARENT') {
            $query->whereHas('student', function ($q) use ($user) {
                $q->where('parent_id', $user->id);
            });
        } elseif ($user->role !== 'SUPER_ADMIN') {
            return response()->json(['error' => 'No autorizado.'], 403);
        }

        // Apply filters if provided
        if ($request->has('course_id')) {
            $query->where('course_id', $request->query('course_id'));
        }
        if ($request->has('student_id')) {
            $query->where('student_id', $request->query('student_id'));
        }

        $grades = $query->latest()->get();

        return response()->json(['success' => true, 'data' => $grades]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        
        $validator = Validator::make($request->all(), [
            'course_id' => 'required|exists:courses,id',
            'student_id' => 'required|exists:students,id',
            'score' => 'required|numeric|min:0|max:100',
            'evaluation_name' => 'required|string|max:100',
            'comments' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        $course = Course::find($request->course_id);
        $student = Student::find($request->student_id);

        // Security check
        if ($user->role === 'TEACHER') {
            $teacher = $user->teacher;
            if (!$teacher || $course->teacher_id !== $teacher->id) {
                return response()->json(['error' => 'No estás asignado a dictar este curso.'], 403);
            }
            $teacherId = $teacher->id;
        } elseif (in_array($user->role, ['SCHOOL_ADMIN', 'SUPER_ADMIN'])) {
            if ($user->role === 'SCHOOL_ADMIN' && $course->school_id !== $user->school_id) {
                return response()->json(['error' => 'El curso no pertenece a tu colegio.'], 403);
            }
            $teacherId = $course->teacher_id; // Default to the course's main teacher
        } else {
            return response()->json(['error' => 'No autorizado para registrar calificaciones.'], 403);
        }

        // Verify student is enrolled in course
        $isEnrolled = $course->students()->where('student_id', $student->id)->exists();
        if (!$isEnrolled) {
            return response()->json(['error' => 'El estudiante no está inscrito en este curso.'], 422);
        }

        $grade = Grade::create([
            'course_id' => $course->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherId,
            'score' => $request->score,
            'evaluation_name' => $request->evaluation_name,
            'comments' => $request->comments,
        ]);

        return response()->json([
            'success' => true, 
            'data' => $grade->load(['course', 'student', 'teacher.user']), 
            'message' => 'Calificación registrada exitosamente.'
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, string $id)
    {
        $user = $request->user();
        $grade = Grade::with(['course', 'student', 'teacher.user'])->find($id);

        if (!$grade) {
            return response()->json(['error' => 'Calificación no encontrada.'], 404);
        }

        // Authorization checks
        if ($user->role === 'TEACHER') {
            $teacher = $user->teacher;
            if (!$teacher || $grade->teacher_id !== $teacher->id) {
                return response()->json(['error' => 'No autorizado para ver esta calificación.'], 403);
            }
        } elseif ($user->role === 'SCHOOL_ADMIN') {
            if ($grade->course->school_id !== $user->school_id) {
                return response()->json(['error' => 'No autorizado.'], 403);
            }
        } elseif ($user->role === 'PARENT') {
            if ($grade->student->parent_id !== $user->id) {
                return response()->json(['error' => 'No autorizado.'], 403);
            }
        } elseif ($user->role !== 'SUPER_ADMIN') {
            return response()->json(['error' => 'No autorizado.'], 403);
        }

        return response()->json(['success' => true, 'data' => $grade]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = $request->user();
        $grade = Grade::find($id);

        if (!$grade) {
            return response()->json(['error' => 'Calificación no encontrada.'], 404);
        }

        // Authorization checks
        if ($user->role === 'TEACHER') {
            $teacher = $user->teacher;
            if (!$teacher || $grade->teacher_id !== $teacher->id) {
                return response()->json(['error' => 'No estás autorizado para modificar esta calificación.'], 403);
            }
        } elseif ($user->role === 'SCHOOL_ADMIN') {
            if ($grade->course->school_id !== $user->school_id) {
                return response()->json(['error' => 'No autorizado.'], 403);
            }
        } elseif ($user->role !== 'SUPER_ADMIN') {
            return response()->json(['error' => 'No autorizado.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'score' => 'sometimes|required|numeric|min:0|max:100',
            'evaluation_name' => 'sometimes|required|string|max:100',
            'comments' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        $grade->update($request->all());

        return response()->json([
            'success' => true, 
            'data' => $grade->load(['course', 'student', 'teacher.user']), 
            'message' => 'Calificación actualizada exitosamente.'
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, string $id)
    {
        $user = $request->user();
        $grade = Grade::find($id);

        if (!$grade) {
            return response()->json(['error' => 'Calificación no encontrada.'], 404);
        }

        // Authorization checks
        if ($user->role === 'TEACHER') {
            $teacher = $user->teacher;
            if (!$teacher || $grade->teacher_id !== $teacher->id) {
                return response()->json(['error' => 'No estás autorizado para eliminar esta calificación.'], 403);
            }
        } elseif ($user->role === 'SCHOOL_ADMIN') {
            if ($grade->course->school_id !== $user->school_id) {
                return response()->json(['error' => 'No autorizado.'], 403);
            }
        } elseif ($user->role !== 'SUPER_ADMIN') {
            return response()->json(['error' => 'No autorizado.'], 403);
        }

        $grade->delete();

        return response()->json(['success' => true, 'message' => 'Calificación eliminada exitosamente.']);
    }

    /**
     * Get all grades for a specific student.
     */
    public function studentGrades(Request $request, string $studentId)
    {
        $user = $request->user();
        $student = Student::find($studentId);

        if (!$student) {
            return response()->json(['error' => 'Estudiante no encontrado.'], 404);
        }

        // Authorization checks
        if ($user->role === 'PARENT') {
            if ($student->parent_id !== $user->id) {
                return response()->json(['error' => 'No estás autorizado para ver las notas de este estudiante.'], 403);
            }
        } elseif ($user->role === 'SCHOOL_ADMIN') {
            if ($student->school_id !== $user->school_id) {
                return response()->json(['error' => 'No autorizado.'], 403);
            }
        } elseif ($user->role === 'TEACHER') {
            $teacher = $user->teacher;
            if (!$teacher) {
                return response()->json(['error' => 'Perfil de docente no encontrado.'], 404);
            }
            // Verify teacher shares at least one course with the student
            $sharesCourse = $student->courses()->where('teacher_id', $teacher->id)->exists();
            if (!$sharesCourse) {
                return response()->json(['error' => 'No estás autorizado para ver las notas de este estudiante.'], 403);
            }
        } elseif ($user->role !== 'SUPER_ADMIN') {
            return response()->json(['error' => 'No autorizado.'], 403);
        }

        $grades = Grade::with(['course', 'teacher.user'])
            ->where('student_id', $studentId)
            ->latest()
            ->get();

        return response()->json(['success' => true, 'data' => $grades]);
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // TODO: Listar materias (filtradas por docente si el usuario es docente)
        return response()->json(['message' => 'Lista de cursos']);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // TODO: Crear una nueva materia
        return response()->json(['message' => 'Curso creado']);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        // TODO: Mostrar detalles de una materia específica
        return response()->json(['message' => 'Detalle del curso']);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        // TODO: Actualizar materia
        return response()->json(['message' => 'Curso actualizado']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        // TODO: Eliminar materia
        return response()->json(['message' => 'Curso eliminado']);
    }

    /**
     * Display students enrolled in a specific course.
     */
    public function students(string $course)
    {
        // TODO: Listar los estudiantes de esta clase
        return response()->json(['message' => 'Estudiantes del curso']);
    }
}

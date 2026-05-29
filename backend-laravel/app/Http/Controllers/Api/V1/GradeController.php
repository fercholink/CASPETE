<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class GradeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // TODO: Listar notas (dependiendo del rol del usuario)
        return response()->json(['message' => 'Lista de notas generales']);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // TODO: Profesor asigna una nota a un estudiante
        return response()->json(['message' => 'Nota registrada exitosamente']);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        // TODO: Ver detalle de una nota (incluyendo comentarios)
        return response()->json(['message' => 'Detalle de la nota']);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        // TODO: Profesor actualiza una nota existente
        return response()->json(['message' => 'Nota actualizada']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        // TODO: Eliminar nota (con permisos adecuados)
        return response()->json(['message' => 'Nota eliminada']);
    }

    /**
     * Get all grades for a specific student.
     */
    public function studentGrades(string $studentId)
    {
        // TODO: Listar todas las notas de un estudiante específico (para el padre o alumno)
        return response()->json(['message' => 'Notas del estudiante']);
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CommunicationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // TODO: Listar comunicaciones (bandeja de entrada / salida del usuario autenticado)
        return response()->json(['message' => 'Bandeja de comunicaciones']);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // TODO: Crear un nuevo comunicado o subir una excusa
        // Si el usuario es 'guardian', podría ser una excusa con archivo adjunto.
        return response()->json(['message' => 'Comunicación enviada']);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        // TODO: Leer el detalle de un comunicado y ver archivos adjuntos
        return response()->json(['message' => 'Detalle de la comunicación']);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        // TODO: Actualizar comunicado (si se permite)
        return response()->json(['message' => 'Comunicación actualizada']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        // TODO: Eliminar comunicado (soft delete)
        return response()->json(['message' => 'Comunicación eliminada']);
    }

    /**
     * Mark a communication as read.
     */
    public function markAsRead(string $id)
    {
        // TODO: Marcar el comunicado como leído por el receptor
        return response()->json(['message' => 'Marcado como leído']);
    }
}

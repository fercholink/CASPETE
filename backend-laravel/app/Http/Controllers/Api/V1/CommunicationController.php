<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Communication;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CommunicationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Get communications where the user is either the sender or receiver
        $query = Communication::with(['sender', 'receiver', 'school'])
            ->where(function ($q) use ($user) {
                $q->where('sender_id', $user->id)
                  ->orWhere('receiver_id', $user->id);
            });

        // Filter by school context for admins
        if ($user->role === 'SCHOOL_ADMIN') {
            $query->where('school_id', $user->school_id);
        }

        $communications = $query->latest()->get();

        return response()->json(['success' => true, 'data' => $communications]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'receiver_id' => 'required|exists:users,id',
            'attachment_url' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        $receiver = User::find($request->receiver_id);
        
        // Determine the school context
        $schoolId = $user->school_id ?? $receiver->school_id;

        if (!$schoolId) {
            return response()->json(['error' => 'No se pudo determinar el contexto del colegio para esta comunicación.'], 422);
        }

        // Establish the communication
        $communication = Communication::create([
            'school_id' => $schoolId,
            'sender_id' => $user->id,
            'receiver_id' => $receiver->id,
            'title' => $request->title,
            'body' => $request->body,
            'attachment_url' => $request->attachment_url,
            'is_read' => false,
        ]);

        return response()->json([
            'success' => true, 
            'data' => $communication->load(['sender', 'receiver', 'school']), 
            'message' => 'Comunicación enviada exitosamente.'
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, string $id)
    {
        $user = $request->user();
        $communication = Communication::with(['sender', 'receiver', 'school'])->find($id);

        if (!$communication) {
            return response()->json(['error' => 'Comunicación no encontrada.'], 404);
        }

        // Authorization checks: must be sender, receiver, school admin of that school, or super admin
        $isAuthorized = $communication->sender_id === $user->id || 
                        $communication->receiver_id === $user->id || 
                        $user->role === 'SUPER_ADMIN' ||
                        ($user->role === 'SCHOOL_ADMIN' && $communication->school_id === $user->school_id);

        if (!$isAuthorized) {
            return response()->json(['error' => 'No autorizado para ver esta comunicación.'], 403);
        }

        return response()->json(['success' => true, 'data' => $communication]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = $request->user();
        $communication = Communication::find($id);

        if (!$communication) {
            return response()->json(['error' => 'Comunicación no encontrada.'], 404);
        }

        // Only the sender can update a communication, and only if it hasn't been read yet
        if ($communication->sender_id !== $user->id) {
            return response()->json(['error' => 'No estás autorizado para modificar esta comunicación.'], 403);
        }

        if ($communication->is_read) {
            return response()->json(['error' => 'No se puede modificar una comunicación que ya ha sido leída por el destinatario.'], 422);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'body' => 'sometimes|required|string',
            'attachment_url' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        $communication->update($request->only(['title', 'body', 'attachment_url']));

        return response()->json([
            'success' => true, 
            'data' => $communication->load(['sender', 'receiver', 'school']), 
            'message' => 'Comunicación actualizada exitosamente.'
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, string $id)
    {
        $user = $request->user();
        $communication = Communication::find($id);

        if (!$communication) {
            return response()->json(['error' => 'Comunicación no encontrada.'], 404);
        }

        // Only the sender or an admin can delete a communication
        $isAuthorized = $communication->sender_id === $user->id || 
                        $user->role === 'SUPER_ADMIN' ||
                        ($user->role === 'SCHOOL_ADMIN' && $communication->school_id === $user->school_id);

        if (!$isAuthorized) {
            return response()->json(['error' => 'No estás autorizado para eliminar esta comunicación.'], 403);
        }

        $communication->delete();

        return response()->json(['success' => true, 'message' => 'Comunicación eliminada exitosamente.']);
    }

    /**
     * Mark a communication as read.
     */
    public function markAsRead(Request $request, string $id)
    {
        $user = $request->user();
        $communication = Communication::find($id);

        if (!$communication) {
            return response()->json(['error' => 'Comunicación no encontrada.'], 404);
        }

        // Only the receiver can mark a communication as read
        if ($communication->receiver_id !== $user->id) {
            return response()->json(['error' => 'No estás autorizado para realizar esta acción.'], 403);
        }

        $communication->update(['is_read' => true]);

        return response()->json([
            'success' => true, 
            'data' => $communication->load(['sender', 'receiver', 'school']),
            'message' => 'Comunicación marcada como leída.'
        ]);
    }
}

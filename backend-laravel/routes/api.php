<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

use App\Http\Controllers\Api\V1\CourseController;
use App\Http\Controllers\Api\V1\GradeController;
use App\Http\Controllers\Api\V1\CommunicationController;

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    // ACADÉMICO (NOTAS Y PROFESORES)
    Route::apiResource('courses', CourseController::class);
    Route::get('courses/{course}/students', [CourseController::class, 'students']);
    
    Route::apiResource('grades', GradeController::class);
    Route::get('grades/student/{studentId}', [GradeController::class, 'studentGrades']);

    // COMUNICACIONES (EXCUSAS Y AVISOS)
    Route::apiResource('communications', CommunicationController::class);
    Route::put('communications/{id}/read', [CommunicationController::class, 'markAsRead']);
});

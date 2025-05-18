<?php

use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\ProfileController;
use App\Http\Controllers\API\ProjectController;
use App\Http\Controllers\API\TaskController;
use App\Http\Controllers\API\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Profile routes
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::post('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/picture', [ProfileController::class, 'uploadPicture']);

    // Task routes
    Route::apiResource('tasks', TaskController::class);

    // Project routes
    Route::apiResource('projects', ProjectController::class);
    Route::get('/projects/{id}/tasks', [ProjectController::class, 'tasks']);

    // User routes for task assignment
    Route::get('/users', [UserController::class, 'index']);
});

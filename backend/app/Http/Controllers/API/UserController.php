<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Get a list of users for task assignment
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        $users = User::select('id', 'name', 'email', 'profile_picture')->get();
        
        // Fix profile picture URLs
        $users->transform(function ($user) {
            if ($user->profile_picture && !str_starts_with($user->profile_picture, 'http')) {
                $user->profile_picture = url($user->profile_picture);
            }
            return $user;
        });
        
        return response()->json($users);
    }
}

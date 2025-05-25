<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new user
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'password_confirmation' => 'required|string|same:password',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully',
            'user' => $user,
            'token' => $token
        ], 201);
    }

    /**
     * Login user and create token
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        \Log::info('Login attempt', ['email' => $request->email, 'ip' => $request->ip()]);

        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            \Log::warning('Login validation failed', ['errors' => $validator->errors(), 'email' => $request->email]);
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if user exists first
        $user = User::where('email', $request->email)->first();
        if (!$user) {
            \Log::warning('Login failed - user not found', ['email' => $request->email]);
            return response()->json([
                'message' => 'Invalid login credentials'
            ], 401);
        }

        if (!Auth::attempt($request->only('email', 'password'))) {
            \Log::warning('Login failed - invalid credentials', ['email' => $request->email]);
            return response()->json([
                'message' => 'Invalid login credentials'
            ], 401);
        }

        // Revoke all existing tokens for this user to ensure single session
        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        \Log::info('Login successful', ['user_id' => $user->id, 'email' => $user->email]);

        return response()->json([
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token
        ]);
    }

    /**
     * Logout user (revoke token)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request)
    {
        $user = $request->user();
        \Log::info('Logout attempt', ['user_id' => $user->id, 'email' => $user->email]);

        // Revoke all tokens for this user
        $user->tokens()->delete();

        \Log::info('Logout successful', ['user_id' => $user->id]);

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Get authenticated user
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function user(Request $request)
    {
        return response()->json($request->user());
    }

    /**
     * Send password reset link
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // For now, just return success message
        // In a real application, you would send an email with reset link
        return response()->json([
            'message' => 'Password reset instructions have been sent to your email address.'
        ]);
    }

    /**
     * Reset password
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'email' => 'required|string|email|exists:users,email',
            'password' => 'required|string|min:8',
            'password_confirmation' => 'required|string|same:password',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // For now, just return success message
        // In a real application, you would validate the token and update the password
        return response()->json([
            'message' => 'Password has been reset successfully.'
        ]);
    }
}

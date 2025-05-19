<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ProjectController extends Controller
{
    /**
     * Display a listing of the projects.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = Project::where('user_id', $user->id);

        // Apply filters if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by sales pipeline flag if provided
        if ($request->has('is_sales_pipeline')) {
            $isSalesPipeline = filter_var($request->is_sales_pipeline, FILTER_VALIDATE_BOOLEAN);
            $query->where('is_sales_pipeline', $isSalesPipeline);
        }

        // Filter by sales stage if provided
        if ($request->has('sales_stage')) {
            $query->where('sales_stage', $request->sales_stage);
        }

        $projects = $query->orderBy('created_at', 'desc')->get();

        return response()->json($projects);
    }

    /**
     * Store a newly created project in storage.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:active,on_hold,completed,cancelled',
            'is_sales_pipeline' => 'nullable|boolean',
            'sales_stage' => 'nullable|string|max:255',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'client_name' => 'nullable|string|max:255',
            'client_email' => 'nullable|email|max:255',
            'budget' => 'nullable|numeric|min:0',
            'deal_value' => 'nullable|numeric|min:0',
            'deal_owner' => 'nullable|string|max:255',
            'expected_close_date' => 'nullable|date',
            'custom_fields' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        $project = new Project($request->all());
        $project->user_id = $user->id;
        $project->save();

        return response()->json([
            'message' => 'Project created successfully',
            'project' => $project
        ], 201);
    }

    /**
     * Display the specified project.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $user = Auth::user();
        $project = Project::where('user_id', $user->id)->findOrFail($id);

        return response()->json($project);
    }

    /**
     * Update the specified project in storage.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'sometimes|required|in:active,on_hold,completed,cancelled',
            'is_sales_pipeline' => 'nullable|boolean',
            'sales_stage' => 'nullable|string|max:255',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'client_name' => 'nullable|string|max:255',
            'client_email' => 'nullable|email|max:255',
            'budget' => 'nullable|numeric|min:0',
            'deal_value' => 'nullable|numeric|min:0',
            'deal_owner' => 'nullable|string|max:255',
            'expected_close_date' => 'nullable|date',
            'custom_fields' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        $project = Project::where('user_id', $user->id)->findOrFail($id);
        $project->update($request->all());

        return response()->json([
            'message' => 'Project updated successfully',
            'project' => $project
        ]);
    }

    /**
     * Remove the specified project from storage.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $user = Auth::user();
        $project = Project::where('user_id', $user->id)->findOrFail($id);
        $project->delete();

        return response()->json([
            'message' => 'Project deleted successfully'
        ]);
    }

    /**
     * Get tasks for a specific project.
     *
     * @param int $id
     * @param Request $request
     * @return JsonResponse
     */
    public function tasks(int $id, Request $request): JsonResponse
    {
        $user = Auth::user();
        $project = Project::where('user_id', $user->id)->findOrFail($id);

        $query = Task::where('project_id', $project->id);

        // Apply filters if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->has('view') && $request->view === 'pipeline') {
            // For pipeline view, group tasks by status
            $tasks = $query->get()->groupBy('status');
        } else {
            // For list view, just return the tasks
            $tasks = $query->orderBy('created_at', 'desc')->get();
        }

        return response()->json($tasks);
    }
}

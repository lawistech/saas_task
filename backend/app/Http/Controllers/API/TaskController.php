<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TaskController extends Controller
{
    /**
     * Display a listing of the tasks.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status');
        $priority = $request->query('priority');
        $group = $request->query('group');
        $stage = $request->query('stage');
        $projectId = $request->query('project_id');

        $query = $request->user()->tasks();

        if ($status) {
            $query->where('status', $status);
        }

        if ($priority) {
            $query->where('priority', $priority);
        }

        if ($group) {
            $query->where('group', $group);
        }

        if ($stage) {
            $query->where('stage', $stage);
        }

        if ($projectId) {
            $query->where('project_id', $projectId);
        }

        $tasks = $query->with(['assignee:id,name,email,profile_picture', 'project:id,name'])
                       ->orderBy('due_date', 'asc')
                       ->get();

        // If group parameter is provided with value 'pipeline', group tasks by status
        if ($request->query('view') === 'pipeline') {
            $groupedTasks = $tasks->groupBy('status');
            return response()->json($groupedTasks);
        }

        return response()->json($tasks);
    }

    /**
     * Store a newly created task in storage.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:pending,in_progress,completed,not_started,in_review,done',
            'group' => 'nullable|string|max:255',
            'stage' => 'nullable|string|max:255',
            'priority' => 'required|in:low,medium,high',
            'due_date' => 'nullable|date',
            'project_id' => 'nullable|exists:projects,id',
            'assignee_id' => 'nullable|exists:users,id',
            'phone' => 'nullable|string|max:255',
            'country_code' => 'nullable|string|max:10',
            'progress' => 'nullable|integer|min:0|max:100',
            'budget' => 'nullable|numeric|min:0',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:255',
            'estimated_hours' => 'nullable|numeric|min:0',
            'actual_hours' => 'nullable|numeric|min:0',
            'custom_fields' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $task = $request->user()->tasks()->create($request->all());
        $task->load(['assignee:id,name,email,profile_picture', 'project:id,name']);

        return response()->json([
            'message' => 'Task created successfully',
            'task' => $task
        ], 201);
    }

    /**
     * Display the specified task.
     *
     * @param Task $task
     * @return JsonResponse
     */
    public function show(Task $task): JsonResponse
    {
        // Check if the task belongs to the authenticated user
        if ($task->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $task->load(['assignee:id,name,email,profile_picture', 'project:id,name']);

        return response()->json($task);
    }

    /**
     * Update the specified task in storage.
     *
     * @param Request $request
     * @param Task $task
     * @return JsonResponse
     */
    public function update(Request $request, Task $task): JsonResponse
    {
        // Check if the task belongs to the authenticated user
        if ($task->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'sometimes|required|in:pending,in_progress,completed,not_started,in_review,done',
            'group' => 'nullable|string|max:255',
            'stage' => 'nullable|string|max:255',
            'priority' => 'sometimes|required|in:low,medium,high',
            'due_date' => 'nullable|date',
            'project_id' => 'nullable|exists:projects,id',
            'assignee_id' => 'nullable|exists:users,id',
            'phone' => 'nullable|string|max:255',
            'country_code' => 'nullable|string|max:10',
            'progress' => 'nullable|integer|min:0|max:100',
            'budget' => 'nullable|numeric|min:0',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:255',
            'estimated_hours' => 'nullable|numeric|min:0',
            'actual_hours' => 'nullable|numeric|min:0',
            'custom_fields' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $task->update($request->all());
        $task->load(['assignee:id,name,email,profile_picture', 'project:id,name']);

        return response()->json([
            'message' => 'Task updated successfully',
            'task' => $task
        ]);
    }

    /**
     * Remove the specified task from storage.
     *
     * @param Task $task
     * @return JsonResponse
     */
    public function destroy(Task $task): JsonResponse
    {
        // Check if the task belongs to the authenticated user
        if ($task->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $task->delete();

        return response()->json([
            'message' => 'Task deleted successfully'
        ]);
    }
}

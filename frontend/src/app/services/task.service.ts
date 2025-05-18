import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Task } from '../models/task';
import { environment } from '../../environments/environment';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = `${environment.apiUrl}/tasks`;
  private usersUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) { }

  /**
   * Get all tasks for the authenticated user
   * @param status Optional status filter
   * @param priority Optional priority filter
   * @param group Optional group filter
   * @param stage Optional stage filter
   * @param view Optional view type (e.g., 'pipeline')
   * @param projectId Optional project filter
   */
  getTasks(status?: string, priority?: string, group?: string, stage?: string, view?: string, projectId?: number): Observable<Task[] | Record<string, Task[]>> {
    let url = this.apiUrl;
    const params: any = {};

    if (status) {
      params.status = status;
    }

    if (priority) {
      params.priority = priority;
    }

    if (group) {
      params.group = group;
    }

    if (stage) {
      params.stage = stage;
    }

    if (view) {
      params.view = view;
    }

    if (projectId) {
      params.project_id = projectId;
    }

    return this.http.get<Task[] | Record<string, Task[]>>(url, { params });
  }

  /**
   * Get tasks in pipeline view (grouped by status)
   * @param projectId Optional project filter
   */
  getPipelineTasks(projectId?: number): Observable<Record<string, Task[]>> {
    return this.getTasks(undefined, undefined, undefined, undefined, 'pipeline', projectId) as Observable<Record<string, Task[]>>;
  }

  /**
   * Get a specific task by ID
   * @param id Task ID
   */
  getTask(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new task
   * @param task Task data
   */
  createTask(task: Partial<Task>): Observable<{ message: string, task: Task }> {
    return this.http.post<{ message: string, task: Task }>(this.apiUrl, task);
  }

  /**
   * Update an existing task
   * @param id Task ID
   * @param task Updated task data
   */
  updateTask(id: number, task: Partial<Task>): Observable<{ message: string, task: Task }> {
    return this.http.put<{ message: string, task: Task }>(`${this.apiUrl}/${id}`, task);
  }

  /**
   * Delete a task
   * @param id Task ID
   */
  deleteTask(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get all users for task assignment
   */
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.usersUrl}`);
  }
}

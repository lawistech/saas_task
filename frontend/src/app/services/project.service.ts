import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Project } from '../models/project';
import { Task } from '../models/task';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = `${environment.apiUrl}/projects`;

  constructor(private http: HttpClient) { }

  /**
   * Get all projects for the authenticated user
   * @param status Optional status filter
   * @param isSalesPipeline Optional filter for sales pipeline projects
   */
  getProjects(status?: string, isSalesPipeline?: boolean): Observable<Project[]> {
    let params: any = {};

    if (status) {
      params.status = status;
    }

    if (isSalesPipeline !== undefined) {
      params.is_sales_pipeline = isSalesPipeline;
    }

    return this.http.get<Project[]>(this.apiUrl, { params });
  }

  /**
   * Get all sales pipeline projects
   * @param salesStage Optional sales stage filter
   */
  getSalesPipelineProjects(salesStage?: string): Observable<Project[]> {
    let params: any = {
      is_sales_pipeline: true
    };

    if (salesStage) {
      params.sales_stage = salesStage;
    }

    return this.http.get<Project[]>(this.apiUrl, { params });
  }

  /**
   * Get a specific project by ID
   * @param id Project ID
   */
  getProject(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new project
   * @param project Project data
   */
  createProject(project: Partial<Project>): Observable<{ message: string, project: Project }> {
    return this.http.post<{ message: string, project: Project }>(this.apiUrl, project);
  }

  /**
   * Update an existing project
   * @param id Project ID
   * @param project Updated project data
   */
  updateProject(id: number, project: Partial<Project>): Observable<{ message: string, project: Project }> {
    return this.http.put<{ message: string, project: Project }>(`${this.apiUrl}/${id}`, project);
  }

  /**
   * Delete a project
   * @param id Project ID
   */
  deleteProject(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get tasks for a specific project
   * @param projectId Project ID
   * @param status Optional status filter
   * @param priority Optional priority filter
   * @param view Optional view type (e.g., 'pipeline')
   */
  getProjectTasks(projectId: number, status?: string, priority?: string, view?: string): Observable<Task[] | Record<string, Task[]>> {
    let params: any = {};

    if (status) {
      params.status = status;
    }

    if (priority) {
      params.priority = priority;
    }

    if (view) {
      params.view = view;
    }

    return this.http.get<Task[] | Record<string, Task[]>>(`${this.apiUrl}/${projectId}/tasks`, { params });
  }
}

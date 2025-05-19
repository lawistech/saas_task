import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskListComponent } from './task-list/task-list.component';
import { TaskFormComponent } from './task-form/task-form.component';
import { TaskPipelineComponent } from './task-pipeline/task-pipeline.component';
import { Task } from '../models/task';
import { Project } from '../models/project';
import { TaskService } from '../services/task.service';
import { ProjectService } from '../services/project.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, TaskListComponent, TaskFormComponent, TaskPipelineComponent],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss'
})
export class TasksComponent implements OnInit {
  tasks: Task[] = [];
  projects: Project[] = [];
  projectTasks: Map<number, Task[]> = new Map();
  unassignedTasks: Task[] = [];
  isLoading = false;
  isLoadingProjects = false;
  showTaskForm = false;
  selectedTask: Task | null = null;
  activeFilter: string | null = null;
  viewMode: 'list' | 'pipeline' = 'list';

  constructor(
    private taskService: TaskService,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.loadProjectsAndTasks();
  }

  loadProjectsAndTasks(status?: string): void {
    this.isLoading = true;
    this.isLoadingProjects = true;
    this.activeFilter = status || null;
    this.projectTasks.clear();

    // First load all projects
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
        this.isLoadingProjects = false;

        // Then load all tasks
        this.loadAllTasks(status);
      },
      error: (error) => {
        console.error('Error loading projects', error);
        this.isLoadingProjects = false;
        this.isLoading = false;
      }
    });
  }

  loadAllTasks(status?: string): void {
    if (this.viewMode === 'pipeline') {
      this.taskService.getPipelineTasks().subscribe({
        next: (groupedTasks) => {
          // Flatten the grouped tasks into a single array
          this.tasks = Object.values(groupedTasks).flat();
          this.organizeTasksByProject(this.tasks);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading tasks', error);
          this.isLoading = false;
        }
      });
    } else {
      this.taskService.getTasks(status).subscribe({
        next: (tasks) => {
          this.tasks = tasks as Task[];
          this.organizeTasksByProject(this.tasks);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading tasks', error);
          this.isLoading = false;
        }
      });
    }
  }

  organizeTasksByProject(tasks: Task[]): void {
    // Clear existing data
    this.projectTasks.clear();
    this.unassignedTasks = [];

    // Group tasks by project
    tasks.forEach(task => {
      if (task.project_id) {
        if (!this.projectTasks.has(task.project_id)) {
          this.projectTasks.set(task.project_id, []);
        }
        this.projectTasks.get(task.project_id)?.push(task);
      } else {
        this.unassignedTasks.push(task);
      }
    });
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'list' ? 'pipeline' : 'list';
    this.loadProjectsAndTasks(this.activeFilter || undefined);
  }

  openTaskForm(task?: Task, projectId?: number): void {
    this.selectedTask = task || null;

    // If projectId is provided and no task is selected, create a task with this project
    if (!task && projectId) {
      this.selectedTask = {
        id: 0,
        user_id: 0,
        title: '',
        description: null,
        status: 'pending',
        priority: 'medium',
        due_date: null,
        created_at: '',
        updated_at: '',
        project_id: projectId,
        project: this.getProjectById(projectId) ? {
          id: projectId,
          name: this.getProjectById(projectId)!.name
        } : undefined
      };
    }

    this.showTaskForm = true;
  }

  closeTaskForm(): void {
    this.showTaskForm = false;
    this.selectedTask = null;
  }

  onTaskSaved(): void {
    this.closeTaskForm();
    this.loadProjectsAndTasks(this.activeFilter || undefined);
  }

  onTaskDeleted(taskId: number): void {
    this.taskService.deleteTask(taskId).subscribe({
      next: () => {
        this.loadProjectsAndTasks(this.activeFilter || undefined);
      },
      error: (error) => {
        console.error('Error deleting task', error);
      }
    });
  }

  onTaskStatusChanged(task: Task): void {
    // Refresh the task list
    this.loadProjectsAndTasks(this.activeFilter || undefined);
  }

  getProjectById(projectId: number): Project | undefined {
    return this.projects.find(project => project.id === projectId);
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskListComponent } from './task-list/task-list.component';
import { TaskFormComponent } from './task-form/task-form.component';
import { TaskPipelineComponent } from './task-pipeline/task-pipeline.component';
import { TaskTableComponent } from './task-table/task-table.component';
import { TaskDetailModalComponent } from './task-detail-modal/task-detail-modal.component';
import { Task } from '../models/task';
import { Project } from '../models/project';
import { TaskService } from '../services/task.service';
import { ProjectService } from '../services/project.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, TaskListComponent, TaskFormComponent, TaskPipelineComponent, TaskTableComponent, TaskDetailModalComponent],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss'
})
export class TasksComponent implements OnInit {
  tasks: Task[] = [];
  projects: Project[] = [];
  projectTasks: Map<number, Task[]> = new Map();
  unassignedTasks: Task[] = [];
  filteredTasks: Task[] = [];
  filteredProjectTasks: Map<number, Task[]> = new Map();
  filteredUnassignedTasks: Task[] = [];
  isLoading = false;
  isLoadingProjects = false;
  showTaskForm = false;
  showTaskDetailModal = false;
  selectedTask: Task | null = null;
  selectedTaskForDetail: Task | null = null;
  activeFilter: string | null = null;

  // Unified search and filter properties
  searchTerm: string = '';
  statusFilter: string = '';
  priorityFilter: string = '';

  viewMode: 'list' | 'table' | 'pipeline' = 'pipeline';

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
      // For list and table views, load regular tasks
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

    // Apply filters after organizing
    this.applyFilters();
  }

  applyFilters(): void {
    // Filter tasks based on search term and status filter
    this.filteredTasks = this.filterTasks(this.tasks);

    // Filter project tasks
    this.filteredProjectTasks.clear();
    this.projectTasks.forEach((tasks, projectId) => {
      const filtered = this.filterTasks(tasks);
      if (filtered.length > 0) {
        this.filteredProjectTasks.set(projectId, filtered);
      }
    });

    // Filter unassigned tasks
    this.filteredUnassignedTasks = this.filterTasks(this.unassignedTasks);
  }

  // Unified search and filter methods
  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.priorityFilter = '';
    this.applyFilters();
  }

  private filterTasks(tasks: Task[]): Task[] {
    return tasks.filter(task => {
      // Search filter
      const searchMatch = !this.searchTerm ||
        task.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (task.assignee?.name && task.assignee.name.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (task.project?.name && task.project.name.toLowerCase().includes(this.searchTerm.toLowerCase()));

      // Status filter (unified)
      const statusMatch = !this.statusFilter || task.status === this.statusFilter;

      // Priority filter
      const priorityMatch = !this.priorityFilter || task.priority === this.priorityFilter;

      // Legacy active filter (for backward compatibility)
      const activeFilterMatch = !this.activeFilter || task.status === this.activeFilter;

      return searchMatch && statusMatch && priorityMatch && activeFilterMatch;
    });
  }

  // Legacy method for backward compatibility with status filter
  onStatusFilterChange(status: string | null): void {
    this.activeFilter = status;
    this.loadProjectsAndTasks(status || undefined);
  }

  toggleViewMode(): void {
    // Cycle through view modes: list -> table -> pipeline -> list
    if (this.viewMode === 'list') {
      this.viewMode = 'table';
    } else if (this.viewMode === 'table') {
      this.viewMode = 'pipeline';
    } else {
      this.viewMode = 'list';
    }
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

  // Task Detail Modal Methods
  openTaskDetailModal(task: Task): void {
    this.selectedTaskForDetail = task;
    this.showTaskDetailModal = true;
  }

  closeTaskDetailModal(): void {
    this.showTaskDetailModal = false;
    this.selectedTaskForDetail = null;
  }

  onTaskDetailEdit(task: Task): void {
    this.closeTaskDetailModal();
    this.openTaskForm(task);
  }

  onTaskDetailDelete(taskId: number): void {
    this.closeTaskDetailModal();
    this.onTaskDeleted(taskId);
  }
}

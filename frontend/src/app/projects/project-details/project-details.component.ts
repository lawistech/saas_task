import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';
import { Project } from '../../models/project';
import { Task } from '../../models/task';
import { ProjectFormComponent } from '../project-form/project-form.component';
import { TaskFormComponent } from '../../tasks/task-form/task-form.component';
import { TaskListComponent } from '../../tasks/task-list/task-list.component';
import { TaskPipelineComponent } from '../../tasks/task-pipeline/task-pipeline.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ProjectFormComponent,
    TaskFormComponent,
    TaskListComponent,
    TaskPipelineComponent
  ],
  templateUrl: './project-details.component.html',
  styleUrl: './project-details.component.scss'
})
export class ProjectDetailsComponent implements OnInit {
  projectId: number = 0;
  project: Project | null = null;
  tasks: Task[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  viewMode: 'list' | 'pipeline' = 'pipeline';
  showTaskForm: boolean = false;
  selectedTask: Task | null = null;
  taskCounts: { pending: number; in_progress: number; completed: number; total: number } = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    total: 0
  };

  // Additional properties for template
  projectToEdit: Project | null = null;
  showEditModal: boolean = false;
  showDeleteConfirmation: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.projectId = +id;
        this.loadProject();
      } else {
        this.router.navigate(['/projects']);
      }
    });
  }

  loadProject(): void {
    this.isLoading = true;

    this.projectService.getProject(this.projectId).subscribe({
      next: (project) => {
        this.project = project;
        this.loadTasks();
      },
      error: (error) => {
        console.error('Error loading project', error);
        this.errorMessage = 'Failed to load project details. Please try again.';
        this.isLoading = false;
      }
    });
  }

  loadTasks(): void {
    this.projectService.getProjectTasks(this.projectId, undefined, undefined, this.viewMode === 'pipeline' ? 'pipeline' : undefined).subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.tasks = data;
          this.calculateTaskCounts(data);
        } else {
          // Handle pipeline view data (grouped by status)
          const allTasks: Task[] = [];
          Object.values(data).forEach(taskGroup => {
            allTasks.push(...taskGroup);
          });
          this.tasks = allTasks;
          this.calculateTaskCounts(allTasks);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading tasks', error);
        this.isLoading = false;
      }
    });
  }

  calculateTaskCounts(tasks: Task[]): void {
    this.taskCounts = {
      pending: tasks.filter(t => t.status === 'pending').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      total: tasks.length
    };
  }

  openTaskForm(task?: Task): void {
    if (task) {
      // Editing existing task
      this.selectedTask = task;
    } else {
      // Creating new task for this project
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
        project_id: this.projectId,
        project: this.project ? {
          id: this.project.id,
          name: this.project.name
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
    this.loadTasks();
  }

  onTaskDeleted(id: number): void {
    this.taskService.deleteTask(id).subscribe({
      next: () => {
        this.loadTasks();
      },
      error: (error) => {
        console.error('Error deleting task', error);
      }
    });
  }

  onTaskStatusChanged(task: Task): void {
    this.loadTasks();
  }

  switchView(mode: 'list' | 'pipeline'): void {
    this.viewMode = mode;
    this.loadTasks();
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  formatCurrency(amount: number | null): string {
    if (amount === null) return 'Not set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active': return 'status-active';
      case 'on_hold': return 'status-on-hold';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Active';
      case 'on_hold': return 'On Hold';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }

  getCompletionPercentage(): number {
    if (this.taskCounts.total === 0) return 0;
    return Math.round((this.taskCounts.completed / this.taskCounts.total) * 100);
  }

  get overallProgress(): number {
    return this.getCompletionPercentage() / 100;
  }

  handleCloseModal(): void {
    this.showEditModal = false;
    this.projectToEdit = null;
  }

  openEditModal(): void {
    this.projectToEdit = this.project;
    this.showEditModal = true;
  }

  confirmDeleteProject(): void {
    this.showDeleteConfirmation = true;
  }

  deleteProjectConfirmed(): void {
    if (this.project) {
      this.projectService.deleteProject(this.project.id).subscribe({
        next: () => {
          this.router.navigate(['/projects']);
        },
        error: (error) => {
          console.error('Error deleting project', error);
          this.errorMessage = 'Failed to delete project. Please try again.';
        }
      });
    }
    this.showDeleteConfirmation = false;
  }

  get completedTasksCount(): number {
    return this.taskCounts.completed;
  }


}

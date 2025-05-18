import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../models/project';
import { Task } from '../../models/task';
import { TaskListComponent } from '../../tasks/task-list/task-list.component';
import { TaskPipelineComponent } from '../../tasks/task-pipeline/task-pipeline.component';
import { TaskFormComponent } from '../../tasks/task-form/task-form.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TaskListComponent,
    TaskPipelineComponent,
    TaskFormComponent
  ],
  templateUrl: './project-details.component.html',
  styleUrl: './project-details.component.scss'
})
export class ProjectDetailsComponent implements OnInit {
  projectId: number = 0;
  project: Project | null = null;
  tasks: Task[] = [];
  isLoading: boolean = true;
  viewMode: 'list' | 'pipeline' = 'list';
  showTaskForm: boolean = false;
  selectedTask: Task | null = null;
  taskCounts: { pending: number; in_progress: number; completed: number; total: number } = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    total: 0
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService
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
        this.isLoading = false;
        this.router.navigate(['/projects']);
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
    this.selectedTask = task || null;
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
    this.loadTasks();
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
}

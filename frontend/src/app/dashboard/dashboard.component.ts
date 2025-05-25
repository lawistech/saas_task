import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ProjectService } from '../services/project.service';
import { TaskService } from '../services/task.service';
import { Project } from '../models/project';
import { Task } from '../models/task';
import { forkJoin } from 'rxjs';

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  user: any = null;
  isLoading = true;
  stats: DashboardStats = {
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0
  };
  recentProjects: Project[] = [];
  recentTasks: Task[] = [];
  upcomingTasks: Task[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private projectService: ProjectService,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      if (!user) {
        this.router.navigate(['/login']);
      } else {
        this.loadDashboardData();
      }
    });
  }

  loadDashboardData(): void {
    this.isLoading = true;

    forkJoin({
      projects: this.projectService.getProjects(),
      tasks: this.taskService.getTasks()
    }).subscribe({
      next: (data) => {
        this.processProjects(data.projects);
        this.processTasks(Array.isArray(data.tasks) ? data.tasks : []);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.isLoading = false;
      }
    });
  }

  processProjects(projects: Project[]): void {
    this.stats.totalProjects = projects.length;
    this.stats.activeProjects = projects.filter(p => p.status === 'active').length;
    this.stats.completedProjects = projects.filter(p => p.status === 'completed').length;

    // Get recent projects (last 5, sorted by creation date)
    this.recentProjects = projects
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }

  processTasks(tasks: Task[]): void {
    this.stats.totalTasks = tasks.length;
    this.stats.pendingTasks = tasks.filter(t => t.status === 'pending').length;
    this.stats.inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    this.stats.completedTasks = tasks.filter(t => t.status === 'completed').length;

    // Get recent tasks (last 5, sorted by creation date)
    this.recentTasks = tasks
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    // Get upcoming tasks (tasks with due dates in the next 7 days)
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    this.upcomingTasks = tasks
      .filter(t => t.due_date && new Date(t.due_date) >= now && new Date(t.due_date) <= nextWeek)
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
      .slice(0, 5);
  }

  navigateToProjects(): void {
    this.router.navigate(['/projects']);
  }

  navigateToTasks(): void {
    this.router.navigate(['/tasks']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'on_hold':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Project } from '../../models/project';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-project-grid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingSkeletonComponent,
    EmptyStateComponent,
    StatusBadgeComponent
  ],
  templateUrl: './project-grid.component.html',
  styleUrl: './project-grid.component.scss'
})
export class ProjectGridComponent implements OnInit {
  @Input() projects: Project[] = [];
  @Input() isLoading: boolean = false;
  @Input() searchTerm: string = '';
  @Output() editProject = new EventEmitter<Project>();
  @Output() deleteProject = new EventEmitter<number>();
  @Output() projectStatusChanged = new EventEmitter<Project>();

  constructor(private router: Router) {}

  ngOnInit(): void {}

  onEditProject(project: Project): void {
    this.editProject.emit(project);
  }

  onDeleteProject(projectId: number): void {
    if (confirm('Are you sure you want to delete this project?')) {
      this.deleteProject.emit(projectId);
    }
  }

  onStatusChange(project: Project, newStatus: string): void {
    const updatedProject = { ...project, status: newStatus as Project['status'] };
    this.projectStatusChanged.emit(updatedProject);
  }

  viewProjectDetails(project: Project): void {
    console.log('Navigating to project details:', project.id);
    this.router.navigate(['/projects', project.id]);
  }

  onCardKeydown(event: KeyboardEvent, project: Project): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.viewProjectDetails(project);
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'on_hold':
        return 'status-on-hold';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  }

  formatCurrency(amount: number | null): string {
    if (!amount) return 'Not set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  trackByProjectId(index: number, project: Project): number {
    return project.id;
  }

  openAddProjectModal(): void {
    // This method should be implemented in the parent component
    console.log('Open add project modal');
  }

  getProjectProgress(project: Project): number | null {
    // Calculate progress based on project status and dates
    if (project.status === 'completed') {
      return 100;
    }

    if (project.status === 'cancelled') {
      return 0;
    }

    if (project.start_date && project.end_date) {
      const startDate = new Date(project.start_date);
      const endDate = new Date(project.end_date);
      const currentDate = new Date();

      if (currentDate < startDate) {
        return 0;
      }

      if (currentDate > endDate) {
        return project.status === 'active' ? 90 : 100;
      }

      const totalDuration = endDate.getTime() - startDate.getTime();
      const elapsed = currentDate.getTime() - startDate.getTime();
      const progress = Math.round((elapsed / totalDuration) * 100);

      return Math.min(Math.max(progress, 0), 95); // Cap at 95% unless completed
    }

    // Default progress based on status
    switch (project.status) {
      case 'active':
        return 45;
      case 'on_hold':
        return 25;
      default:
        return null;
    }
  }
}

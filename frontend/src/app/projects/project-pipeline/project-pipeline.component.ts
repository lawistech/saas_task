import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../models/project';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-project-pipeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-pipeline.component.html',
  styleUrl: './project-pipeline.component.scss'
})
export class ProjectPipelineComponent implements OnInit, OnChanges {
  @Input() projects: Project[] = [];
  @Output() editProject = new EventEmitter<Project>();
  @Output() deleteProject = new EventEmitter<number>();
  @Output() projectStatusChanged = new EventEmitter<Project>();

  groupedProjects: Record<string, Project[]> = {};
  statusLabels: Record<string, string> = {
    'active': 'Active',
    'on_hold': 'On Hold',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  };

  statusOrder: string[] = ['active', 'on_hold', 'completed', 'cancelled'];
  draggedProject: Project | null = null;

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {
    this.groupProjectsByStatus();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projects']) {
      this.groupProjectsByStatus();
    }
  }

  groupProjectsByStatus(): void {
    this.groupedProjects = {};

    // Initialize all status groups even if empty
    this.statusOrder.forEach(status => {
      this.groupedProjects[status] = [];
    });

    // Group projects by status
    this.projects.forEach(project => {
      const status = project.status;
      if (!this.groupedProjects[status]) {
        this.groupedProjects[status] = [];
      }
      this.groupedProjects[status].push(project);
    });
  }

  onEditProject(project: Project): void {
    this.editProject.emit(project);
  }

  onDeleteProject(projectId: number): void {
    if (confirm('Are you sure you want to delete this project?')) {
      this.deleteProject.emit(projectId);
    }
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

  formatDate(dateString: string | null): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  formatCurrency(amount: number | null): string {
    if (amount === null) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  onDragStart(event: DragEvent, project: Project): void {
    this.draggedProject = project;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', project.id.toString());
    }
  }

  onDragOver(event: DragEvent, status: string): void {
    event.preventDefault();
    if (this.draggedProject && this.draggedProject.status !== status) {
      event.dataTransfer!.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent, status: string): void {
    event.preventDefault();
    if (this.draggedProject && this.draggedProject.status !== status) {
      // Validate the status is one of the allowed values
      const validStatus = this.statusOrder.includes(status) ?
        status as 'active' | 'on_hold' | 'completed' | 'cancelled' :
        this.draggedProject.status;

      // Update the project status
      const updatedProject = {
        ...this.draggedProject,
        status: validStatus
      };

      // Emit the event to update the project
      this.projectStatusChanged.emit(updatedProject);

      // Update the local state
      this.draggedProject.status = validStatus;
      this.groupProjectsByStatus();
    }
  }

  onDragEnd(): void {
    this.draggedProject = null;
  }
}

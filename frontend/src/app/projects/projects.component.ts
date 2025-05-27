import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectListComponent } from './project-list/project-list.component';
import { ProjectGridComponent } from './project-grid/project-grid.component';
import { ProjectFormComponent } from './project-form/project-form.component';
import { Project } from '../models/project';
import { ProjectService } from '../services/project.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, ProjectListComponent, ProjectGridComponent, ProjectFormComponent],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  isLoading: boolean = true;
  showProjectForm: boolean = false;
  showAddProjectModal: boolean = false;
  selectedProject: Project | null = null;
  viewMode: 'list' | 'pipeline' | 'grid' = 'grid';
  activeFilter: string | null = null;

  // Filter and search properties
  searchTerm: string = '';
  statusFilter: string = '';
  sortOption: string = 'name';
  availableStatuses: string[] = ['active', 'on_hold', 'completed', 'cancelled'];

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(status?: string): void {
    this.isLoading = true;
    this.activeFilter = status || null;

    this.projectService.getProjects(status || undefined).subscribe({
      next: (projects) => {
        this.projects = projects;
        this.filteredProjects = [...projects];
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading projects', error);
        this.isLoading = false;
      }
    });
  }

  openProjectForm(project?: Project): void {
    console.log('Opening project form', project ? 'for editing' : 'for new project');
    this.selectedProject = project || null;
    this.showProjectForm = true;
  }

  closeProjectForm(): void {
    console.log('Closing project form');
    this.showProjectForm = false;
    this.selectedProject = null;
  }

  onProjectSaved(): void {
    console.log('Project saved, closing form and reloading projects');
    this.closeProjectForm();
    this.loadProjects(this.activeFilter || undefined);
  }

  onProjectDeleted(id: number): void {
    this.projectService.deleteProject(id).subscribe({
      next: () => {
        this.loadProjects(this.activeFilter || undefined);
      },
      error: (error) => {
        console.error('Error deleting project', error);
      }
    });
  }

  onProjectStatusChanged(project: Project): void {
    this.projectService.updateProject(project.id, { status: project.status }).subscribe({
      next: () => {
        // If we're filtering by status, reload the projects
        if (this.activeFilter) {
          this.loadProjects(this.activeFilter);
        }
      },
      error: (error) => {
        console.error('Error updating project status', error);
      }
    });
  }

  // New methods for template functionality
  setViewMode(mode: 'list' | 'pipeline' | 'grid'): void {
    this.viewMode = mode;
  }

  applyFilters(): void {
    let filtered = [...this.projects];

    // Apply search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchLower) ||
        (project.description && project.description.toLowerCase().includes(searchLower)) ||
        (project.client_name && project.client_name.toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    if (this.statusFilter) {
      filtered = filtered.filter(project => project.status === this.statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (this.sortOption) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'dueDate':
          const dateA = a.end_date ? new Date(a.end_date).getTime() : 0;
          const dateB = b.end_date ? new Date(b.end_date).getTime() : 0;
          return dateA - dateB;
        case 'priority':
          // Assuming priority is a field, otherwise use status as fallback
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    this.filteredProjects = filtered;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.sortOption = 'name';
    this.applyFilters();
  }

  openAddProjectModal(): void {
    this.selectedProject = null;
    this.showProjectForm = true;
  }

  closeAddProjectModal(): void {
    this.showProjectForm = false;
    this.selectedProject = null;
  }
}

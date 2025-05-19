import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectListComponent } from './project-list/project-list.component';
import { ProjectFormComponent } from './project-form/project-form.component';
import { ProjectPipelineComponent } from './project-pipeline/project-pipeline.component';
import { Project } from '../models/project';
import { ProjectService } from '../services/project.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, ProjectListComponent, ProjectFormComponent, ProjectPipelineComponent],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];
  isLoading: boolean = true;
  showProjectForm: boolean = false;
  selectedProject: Project | null = null;
  viewMode: 'list' | 'pipeline' = 'list';
  activeFilter: string | null = null;

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
}

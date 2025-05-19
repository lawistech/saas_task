import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Project } from '../../models/project';
import { ProjectService } from '../../services/project.service';
import { FormsModule } from '@angular/forms';
import { ProjectFormComponent } from '../../projects/project-form/project-form.component';

@Component({
  selector: 'app-sales-pipeline',
  standalone: true,
  imports: [CommonModule, FormsModule, ProjectFormComponent],
  templateUrl: './sales-pipeline.component.html',
  styleUrl: './sales-pipeline.component.scss'
})
export class SalesPipelineComponent implements OnInit {
  projects: Project[] = [];
  isLoading: boolean = true;
  showProjectForm: boolean = false;
  selectedProject: Project | null = null;
  
  // Sales pipeline stages
  salesStages: string[] = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
  groupedProjects: Record<string, Project[]> = {};
  draggedProject: Project | null = null;

  constructor(
    private projectService: ProjectService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSalesPipelineProjects();
  }

  loadSalesPipelineProjects(): void {
    this.isLoading = true;
    this.projectService.getSalesPipelineProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
        this.groupProjectsByStage();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading sales pipeline projects', error);
        this.isLoading = false;
      }
    });
  }

  groupProjectsByStage(): void {
    this.groupedProjects = {};

    // Initialize all stage groups even if empty
    this.salesStages.forEach(stage => {
      this.groupedProjects[stage] = [];
    });

    // Group projects by sales stage
    this.projects.forEach(project => {
      const stage = project.sales_stage || 'Lead'; // Default to Lead if no stage is set
      if (!this.groupedProjects[stage]) {
        this.groupedProjects[stage] = [];
      }
      this.groupedProjects[stage].push(project);
    });
  }

  openProjectForm(project?: Project): void {
    this.selectedProject = project || null;
    this.showProjectForm = true;
  }

  closeProjectForm(): void {
    this.showProjectForm = false;
    this.selectedProject = null;
  }

  onProjectSaved(): void {
    this.closeProjectForm();
    this.loadSalesPipelineProjects();
  }

  onProjectDeleted(id: number): void {
    if (confirm('Are you sure you want to delete this project?')) {
      this.projectService.deleteProject(id).subscribe({
        next: () => {
          this.loadSalesPipelineProjects();
        },
        error: (error) => {
          console.error('Error deleting project', error);
        }
      });
    }
  }

  viewProjectDetails(project: Project): void {
    this.router.navigate(['/projects', project.id]);
  }

  // Drag and drop functionality
  onDragStart(event: DragEvent, project: Project): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', project.id.toString());
      event.dataTransfer.effectAllowed = 'move';
    }
    this.draggedProject = project;
  }

  onDragOver(event: DragEvent, stage: string): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent, stage: string): void {
    event.preventDefault();
    if (this.draggedProject && this.draggedProject.sales_stage !== stage) {
      const updatedProject: Partial<Project> = {
        ...this.draggedProject,
        sales_stage: stage
      };

      this.projectService.updateProject(this.draggedProject.id, updatedProject).subscribe({
        next: () => {
          this.loadSalesPipelineProjects();
        },
        error: (error) => {
          console.error('Error updating project stage', error);
        }
      });
    }
    this.draggedProject = null;
  }

  onDragEnd(): void {
    this.draggedProject = null;
  }

  getStageClass(stage: string): string {
    switch (stage) {
      case 'Lead': return 'stage-lead';
      case 'Qualified': return 'stage-qualified';
      case 'Proposal': return 'stage-proposal';
      case 'Negotiation': return 'stage-negotiation';
      case 'Closed Won': return 'stage-closed-won';
      case 'Closed Lost': return 'stage-closed-lost';
      default: return '';
    }
  }

  createNewSalesProject(): void {
    const newProject: Partial<Project> = {
      name: 'New Sales Opportunity',
      status: 'active',
      is_sales_pipeline: true,
      sales_stage: 'Lead'
    };
    this.openProjectForm(newProject as Project);
  }
}

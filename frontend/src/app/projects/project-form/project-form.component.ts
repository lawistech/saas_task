import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Project } from '../../models/project';
import { ProjectService } from '../../services/project.service';
import { ColumnConfig } from '../../models/column-config';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-form.component.html',
  styleUrl: './project-form.component.scss'
})
export class ProjectFormComponent implements OnInit {
  @Input() project: Project | null = null;
  @Input() isSalesPipeline: boolean = false;
  @Input() salesStages: string[] = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
  @Output() formCancelled = new EventEmitter<void>();
  @Output() projectSaved = new EventEmitter<void>();

  formData: Partial<Project> = {
    name: '',
    description: '',
    status: 'active',
    is_sales_pipeline: false,
    sales_stage: null,
    start_date: null,
    end_date: null,
    client_name: null,
    client_email: null,
    budget: null,
    deal_value: null,
    deal_owner: null,
    expected_close_date: null,
    custom_fields: {}
  };

  customFieldKeys: string[] = [];
  customColumns: ColumnConfig[] = [];
  newCustomFieldKey: string = '';
  newCustomFieldValue: string = '';

  isSubmitting = false;
  formTitle = 'Add New Project';

  private readonly STORAGE_KEY = 'project_table_columns';

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {
    this.loadCustomColumns();

    // Set form title based on whether it's a sales pipeline project
    if (this.isSalesPipeline) {
      this.formTitle = this.project?.id ? 'Edit Sales Opportunity' : 'Create Sales Opportunity';
      this.formData.is_sales_pipeline = true;

      // Set default sales stage if not set
      if (!this.formData.sales_stage) {
        this.formData.sales_stage = 'Lead';
      }
    }

    if (this.project) {
      this.formTitle = this.isSalesPipeline ? 'Edit Sales Opportunity' : 'Edit Project';
      this.formData = {
        name: this.project.name,
        description: this.project.description,
        status: this.project.status,
        is_sales_pipeline: this.project.is_sales_pipeline || this.isSalesPipeline,
        sales_stage: this.project.sales_stage,
        start_date: this.project.start_date,
        end_date: this.project.end_date,
        client_name: this.project.client_name,
        client_email: this.project.client_email,
        budget: this.project.budget,
        deal_value: this.project.deal_value,
        deal_owner: this.project.deal_owner,
        expected_close_date: this.project.expected_close_date,
        custom_fields: this.project.custom_fields || {}
      };

      // Extract custom field keys
      if (this.project.custom_fields) {
        this.customFieldKeys = Object.keys(this.project.custom_fields);
      }
    }
  }

  loadCustomColumns(): void {
    const savedColumns = localStorage.getItem(this.STORAGE_KEY);

    if (savedColumns) {
      try {
        const columns = JSON.parse(savedColumns);
        this.customColumns = columns.filter((col: ColumnConfig) =>
          col.id.startsWith('custom_') && col.visible
        );
      } catch (e) {
        console.error('Error parsing saved column settings', e);
      }
    }
  }

  addCustomField(): void {
    if (this.newCustomFieldKey && this.newCustomFieldKey.trim()) {
      const key = this.newCustomFieldKey.trim();
      if (!this.customFieldKeys.includes(key)) {
        this.customFieldKeys.push(key);
        if (!this.formData.custom_fields) {
          this.formData.custom_fields = {};
        }
        this.formData.custom_fields[key] = this.newCustomFieldValue;
      }
      this.newCustomFieldKey = '';
      this.newCustomFieldValue = '';
    }
  }

  removeCustomField(key: string): void {
    this.customFieldKeys = this.customFieldKeys.filter(k => k !== key);
    if (this.formData.custom_fields) {
      delete this.formData.custom_fields[key];
    }
  }

  onSubmit(): void {
    console.log('Form submitted with data:', this.formData);

    if (!this.formData.name) {
      alert('Project name is required');
      return;
    }

    this.isSubmitting = true;

    // Ensure sales pipeline fields are set correctly
    if (this.isSalesPipeline) {
      this.formData.is_sales_pipeline = true;
      if (!this.formData.sales_stage) {
        this.formData.sales_stage = 'Lead';
      }
    }

    if (this.project) {
      // Update existing project
      console.log('Updating existing project with ID:', this.project.id);
      this.projectService.updateProject(this.project.id, this.formData).subscribe({
        next: (response) => {
          console.log('Project updated successfully:', response);
          this.isSubmitting = false;
          this.projectSaved.emit();
        },
        error: (error) => {
          console.error('Error updating project:', error);
          if (error.error && error.error.errors) {
            console.error('Validation errors:', error.error.errors);
            alert('Error updating project: ' + this.formatValidationErrors(error.error.errors));
          } else {
            alert('Error updating project. Please try again.');
          }
          this.isSubmitting = false;
        }
      });
    } else {
      // Create new project
      console.log('Creating new project');
      this.projectService.createProject(this.formData).subscribe({
        next: (response) => {
          console.log('Project created successfully:', response);
          this.isSubmitting = false;
          this.projectSaved.emit();
        },
        error: (error) => {
          console.error('Error creating project:', error);
          if (error.error && error.error.errors) {
            console.error('Validation errors:', error.error.errors);
            alert('Error creating project: ' + this.formatValidationErrors(error.error.errors));
          } else {
            alert('Error creating project. Please try again.');
          }
          this.isSubmitting = false;
        }
      });
    }
  }

  private formatValidationErrors(errors: any): string {
    let errorMessage = '';
    for (const field in errors) {
      if (errors.hasOwnProperty(field)) {
        errorMessage += `${field}: ${errors[field].join(', ')}\n`;
      }
    }
    return errorMessage;
  }

  onCancel(): void {
    this.formCancelled.emit();
  }
}

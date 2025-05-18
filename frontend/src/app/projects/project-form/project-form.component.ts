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
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  formData: Partial<Project> = {
    name: '',
    description: '',
    status: 'active',
    start_date: null,
    end_date: null,
    client_name: null,
    client_email: null,
    budget: null,
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

    if (this.project) {
      this.formTitle = 'Edit Project';
      this.formData = {
        name: this.project.name,
        description: this.project.description,
        status: this.project.status,
        start_date: this.project.start_date,
        end_date: this.project.end_date,
        client_name: this.project.client_name,
        client_email: this.project.client_email,
        budget: this.project.budget,
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
    if (!this.formData.name) {
      alert('Project name is required');
      return;
    }

    this.isSubmitting = true;

    if (this.project) {
      // Update existing project
      this.projectService.updateProject(this.project.id, this.formData).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.saved.emit();
        },
        error: (error) => {
          console.error('Error updating project', error);
          this.isSubmitting = false;
        }
      });
    } else {
      // Create new project
      this.projectService.createProject(this.formData).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.saved.emit();
        },
        error: (error) => {
          console.error('Error creating project', error);
          this.isSubmitting = false;
        }
      });
    }
  }

  onCancel(): void {
    this.close.emit();
  }
}

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Project } from '../../models/project';
import { ProjectService } from '../../services/project.service';
import { ColumnConfig } from '../../models/column-config';

@Component({
  selector: 'app-project-form',
  standalone: true,
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class ProjectFormComponent implements OnInit {
  @Input() project: Project | null = null;
  @Input() showModal: boolean = false;
  @Input() isSalesPipeline: boolean = false;
  @Input() salesStages: string[] = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
  @Output() formCancelled = new EventEmitter<void>();
  @Output() projectSaved = new EventEmitter<void>();
  @Output() closeModal = new EventEmitter<void>();

  formData = {
    name: '',
    description: '',
    status: 'active' as 'active' | 'on_hold' | 'completed' | 'cancelled',
    is_sales_pipeline: false,
    sales_stage: null as string | null,
    start_date: null as string | null,
    end_date: null as string | null,
    client_name: null as string | null,
    client_email: null as string | null,
    budget: null as number | null,
    deal_value: null as number | null,
    deal_owner: null as string | null,
    expected_close_date: null as string | null,
    custom_fields: {} as { [key: string]: any }
  };

  customFieldKeys: string[] = [];
  customColumns: ColumnConfig[] = [];
  newCustomFieldKey: string = '';
  newCustomFieldValue: string = '';
  newCustomFieldName: string = '';

  // Form-related properties
  projectForm!: FormGroup;
  submitted: boolean = false;
  submitting: boolean = false;
  errorMessage: string = '';
  availableStatuses: string[] = ['active', 'on_hold', 'completed', 'cancelled'];

  isSubmitting = false;
  formTitle = 'Add New Project';

  private readonly STORAGE_KEY = 'project_table_columns';

  constructor(
    private projectService: ProjectService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initializeForm();
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
        description: this.project.description || '',
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
      this.updateFormWithData();
    }

    // Load existing custom field keys
    if (this.formData.custom_fields) {
      this.customFieldKeys = Object.keys(this.formData.custom_fields);
    }
  }

  private loadCustomColumns(): void {
    const savedColumns = localStorage.getItem(this.STORAGE_KEY);
    if (savedColumns) {
      this.customColumns = JSON.parse(savedColumns);
    }
  }

  onSubmit(): void {
    this.submitted = true;
    this.submitting = true;
    this.errorMessage = '';

    if (this.projectForm && this.projectForm.valid) {
      const formValue = this.projectForm.value;

      // Convert custom fields array to object
      const customFields: { [key: string]: any } = {};
      if (formValue.customFields) {
        formValue.customFields.forEach((field: any) => {
          if (field.key && field.value) {
            customFields[field.key] = field.value;
          }
        });
      }

      const projectData = {
        ...formValue,
        custom_fields: customFields
      };

      delete projectData.customFields;

      if (this.project?.id) {
        this.projectService.updateProject(this.project.id, projectData).subscribe({
          next: () => {
            this.projectSaved.emit();
            this.submitting = false;
          },
          error: (error) => {
            console.error('Error updating project:', error);
            this.errorMessage = this.formatValidationErrors(error.error);
            this.submitting = false;
          }
        });
      } else {
        this.projectService.createProject(projectData).subscribe({
          next: () => {
            this.projectSaved.emit();
            this.submitting = false;
          },
          error: (error) => {
            console.error('Error creating project:', error);
            this.errorMessage = this.formatValidationErrors(error.error);
            this.submitting = false;
          }
        });
      }
    } else {
      this.submitting = false;
    }
  }

  addCustomField(): void {
    if (this.newCustomFieldName.trim()) {
      this.formData.custom_fields[this.newCustomFieldName] = '';
      this.customFieldKeys.push(this.newCustomFieldName);

      // Add to form array
      const customFieldsArray = this.projectForm.get('customFields') as FormArray;
      customFieldsArray.push(this.fb.group({
        key: [this.newCustomFieldName],
        value: ['']
      }));

      this.newCustomFieldName = '';
    }
  }

  removeCustomField(index: number): void {
    const customFieldsArray = this.projectForm.get('customFields') as FormArray;
    if (index >= 0 && index < customFieldsArray.length) {
      const control = customFieldsArray.at(index);
      const key = control.get('key')?.value;

      if (key) {
        delete this.formData.custom_fields[key];
        this.customFieldKeys = this.customFieldKeys.filter(k => k !== key);
      }

      customFieldsArray.removeAt(index);
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

  private initializeForm(): void {
    this.projectForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      status: ['active'],
      is_sales_pipeline: [false],
      sales_stage: [null],
      start_date: [null],
      end_date: [null],
      client_name: [null],
      client_email: [null],
      budget: [null],
      deal_value: [null],
      deal_owner: [null],
      expected_close_date: [null],
      customFields: this.fb.array([])
    });
  }

  private updateFormWithData(): void {
    if (this.project) {
      this.projectForm.patchValue({
        name: this.project.name,
        description: this.project.description || '',
        status: this.project.status,
        is_sales_pipeline: this.project.is_sales_pipeline,
        sales_stage: this.project.sales_stage,
        start_date: this.project.start_date,
        end_date: this.project.end_date,
        client_name: this.project.client_name,
        client_email: this.project.client_email,
        budget: this.project.budget,
        deal_value: this.project.deal_value,
        deal_owner: this.project.deal_owner,
        expected_close_date: this.project.expected_close_date
      });

      // Handle custom fields
      if (this.project.custom_fields) {
        const customFieldsArray = this.projectForm.get('customFields') as FormArray;
        Object.entries(this.project.custom_fields).forEach(([key, value]) => {
          customFieldsArray.push(this.fb.group({
            key: [key],
            value: [value]
          }));
        });
      }
    }
  }

  get customFields(): FormArray {
    return this.projectForm.get('customFields') as FormArray;
  }
}

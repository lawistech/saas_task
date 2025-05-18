import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task } from '../../models/task';
import { User } from '../../models/user';
import { Project } from '../../models/project';
import { TaskService } from '../../services/task.service';
import { ProjectService } from '../../services/project.service';
import { ColumnConfig } from '../../models/column-config';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss'
})
export class TaskFormComponent implements OnInit {
  @Input() task: Task | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  formData: Partial<Task> = {
    title: '',
    description: '',
    status: 'pending',
    group: null,
    stage: 'Planning',
    priority: 'medium',
    due_date: null,
    project_id: null,
    assignee_id: null,
    custom_fields: {}
  };

  users: User[] = [];
  projects: Project[] = [];
  isLoadingProjects = false;
  customFieldKeys: string[] = [];
  customColumns: ColumnConfig[] = [];
  newCustomFieldKey: string = '';
  newCustomFieldValue: string = '';

  isSubmitting = false;
  isLoadingUsers = false;
  formTitle = 'Add New Task';

  private readonly STORAGE_KEY = 'task_table_columns';

  constructor(
    private taskService: TaskService,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadProjects();
    this.loadCustomColumns();

    if (this.task) {
      this.formTitle = 'Edit Task';
      this.formData = {
        title: this.task.title,
        description: this.task.description,
        status: this.task.status,
        group: this.task.group,
        stage: this.task.stage || 'Planning',
        priority: this.task.priority,
        due_date: this.task.due_date,
        project_id: this.task.project_id,
        assignee_id: this.task.assignee_id,
        custom_fields: this.task.custom_fields || {}
      };

      // Extract custom field keys
      if (this.task.custom_fields) {
        this.customFieldKeys = Object.keys(this.task.custom_fields);
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

  loadUsers(): void {
    this.isLoadingUsers = true;
    this.taskService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoadingUsers = false;
      },
      error: (error) => {
        console.error('Error loading users', error);
        this.isLoadingUsers = false;
      }
    });
  }

  loadProjects(): void {
    this.isLoadingProjects = true;
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
        this.isLoadingProjects = false;
      },
      error: (error) => {
        console.error('Error loading projects', error);
        this.isLoadingProjects = false;
      }
    });
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
    if (!this.formData.title) {
      alert('Title is required');
      return;
    }

    this.isSubmitting = true;

    if (this.task) {
      // Update existing task
      this.taskService.updateTask(this.task.id, this.formData).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.saved.emit();
        },
        error: (error) => {
          console.error('Error updating task', error);
          this.isSubmitting = false;
        }
      });
    } else {
      // Create new task
      this.taskService.createTask(this.formData).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.saved.emit();
        },
        error: (error) => {
          console.error('Error creating task', error);
          this.isSubmitting = false;
        }
      });
    }
  }

  onCancel(): void {
    this.close.emit();
  }
}

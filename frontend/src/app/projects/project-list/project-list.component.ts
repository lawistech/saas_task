import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Project } from '../../models/project';
import { ProjectService } from '../../services/project.service';
import { PROJECT_DEFAULT_COLUMNS } from '../../models/project-column-config';
import { ColumnConfig } from '../../models/column-config';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss'
})
export class ProjectListComponent implements OnInit, OnChanges {
  @Input() projects: Project[] = [];
  @Output() editProject = new EventEmitter<Project>();
  @Output() deleteProject = new EventEmitter<number>();
  @Output() projectStatusChanged = new EventEmitter<Project>();

  sortedProjects: Project[] = [];
  selectedProjects: number[] = [];
  selectedProject: Project | null = null;

  sortField: string = 'created_at';
  sortDirection: 'asc' | 'desc' = 'desc';

  columns: ColumnConfig[] = [];
  showColumnSettings: boolean = false;
  draggedColumn: ColumnConfig | null = null;
  showAddColumnForm: boolean = false;
  newColumnName: string = '';

  private readonly STORAGE_KEY = 'project_table_columns';

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {
    this.loadColumnSettings();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projects']) {
      this.sortProjectsData();
    }
  }

  loadColumnSettings(): void {
    const savedColumns = localStorage.getItem(this.STORAGE_KEY);

    if (savedColumns) {
      try {
        this.columns = JSON.parse(savedColumns);
      } catch (e) {
        console.error('Error parsing saved column settings', e);
        this.columns = [...PROJECT_DEFAULT_COLUMNS];
      }
    } else {
      this.columns = [...PROJECT_DEFAULT_COLUMNS];
    }

    this.sortProjectsData();
  }

  saveColumnSettings(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.columns));
  }

  sortProjectsData(): void {
    this.sortedProjects = [...this.projects].sort((a, b) => {
      let aValue: any = a[this.sortField as keyof Project];
      let bValue: any = b[this.sortField as keyof Project];

      // Handle null values
      if (aValue === null) return this.sortDirection === 'asc' ? -1 : 1;
      if (bValue === null) return this.sortDirection === 'asc' ? 1 : -1;

      // Handle dates
      if (this.sortField === 'start_date' || this.sortField === 'end_date' || this.sortField === 'created_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Handle strings
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return this.sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Handle numbers
      return this.sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }

  toggleColumnSettings(): void {
    this.showColumnSettings = !this.showColumnSettings;
  }

  toggleAddColumnForm(): void {
    this.showAddColumnForm = !this.showAddColumnForm;
    if (!this.showAddColumnForm) {
      this.newColumnName = '';
    }
  }

  addCustomColumn(): void {
    if (!this.newColumnName.trim()) {
      return;
    }

    // Create a unique ID from the name (lowercase, no spaces)
    const columnId = 'custom_' + this.newColumnName.toLowerCase().replace(/\s+/g, '_');

    // Check if a column with this ID already exists
    if (this.columns.some(col => col.id === columnId)) {
      alert('A column with this name already exists.');
      return;
    }

    // Create the new column
    const newColumn: ColumnConfig = {
      id: columnId,
      name: this.newColumnName,
      visible: true,
      order: this.columns.length, // Add it at the end (before actions column)
      width: '150px'
    };

    // Add the new column and reorder
    this.columns.push(newColumn);
    this.columns = this.columns.sort((a, b) => a.order - b.order);

    // Save the updated columns
    this.saveColumnSettings();

    // Close the form
    this.toggleAddColumnForm();
  }

  toggleColumnVisibility(column: ColumnConfig): void {
    column.visible = !column.visible;
    this.saveColumnSettings();
  }

  onDragStart(event: DragEvent, column: ColumnConfig): void {
    this.draggedColumn = column;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent, column: ColumnConfig): void {
    event.preventDefault();
    if (this.draggedColumn && this.draggedColumn !== column) {
      // Get the current order of both columns
      const draggedOrder = this.draggedColumn.order;
      const targetOrder = column.order;

      // Update the order of all affected columns
      this.columns.forEach(col => {
        if (draggedOrder < targetOrder) {
          // Moving right
          if (col.order > draggedOrder && col.order <= targetOrder) {
            col.order--;
          }
        } else {
          // Moving left
          if (col.order < draggedOrder && col.order >= targetOrder) {
            col.order++;
          }
        }
      });

      // Set the dragged column's new order
      this.draggedColumn.order = targetOrder;

      // Sort the columns by order
      this.columns = this.columns.sort((a, b) => a.order - b.order);
    }
  }

  onDragEnd(): void {
    if (this.draggedColumn) {
      this.saveColumnSettings();
      this.draggedColumn = null;
    }
  }

  isColumnVisible(columnId: string): boolean {
    const column = this.columns.find(col => col.id === columnId);
    return column ? column.visible : false;
  }

  getVisibleColumns(): ColumnConfig[] {
    return this.columns
      .filter(col => col.visible)
      .sort((a, b) => a.order - b.order);
  }

  getVisibleColumnsCount(): number {
    return this.getVisibleColumns().length;
  }

  getProjectsByStatus(status: string): Project[] {
    return this.sortedProjects.filter(project => project.status === status);
  }

  toggleProjectSelection(project: Project, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const index = this.selectedProjects.indexOf(project.id);
    if (index === -1) {
      this.selectedProjects.push(project.id);
    } else {
      this.selectedProjects.splice(index, 1);
    }
  }

  toggleSelectAll(event: Event): void {
    const checkbox = event.target as HTMLInputElement;

    if (checkbox.checked) {
      this.selectedProjects = this.sortedProjects.map(project => project.id);
    } else {
      this.selectedProjects = [];
    }
  }

  toggleProjectDetails(project: Project): void {
    if (this.selectedProject && this.selectedProject.id === project.id) {
      this.selectedProject = null;
    } else {
      this.selectedProject = project;
    }
  }

  onEditProject(project: Project, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.editProject.emit(project);
  }

  onDeleteProject(projectId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

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

  sortProjects(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.sortProjectsData();
  }
}

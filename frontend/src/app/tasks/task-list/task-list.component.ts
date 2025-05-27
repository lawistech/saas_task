import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task } from '../../models/task';
import { Project } from '../../models/project';
import { TaskService } from '../../services/task.service';
import { ColumnConfig } from '../../models/column-config';
import { TaskColumnConfig, TASK_DEFAULT_COLUMNS } from '../../models/task-column-config';
import { Router } from '@angular/router';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss'
})
export class TaskListComponent implements OnInit, OnChanges {
  @Input() tasks: Task[] = [];
  @Input() projectContext: boolean = false; // Flag to indicate if component is used within a project
  @Input() projectId?: number; // Optional project ID when in project context
  @Input() multiProjectMode: boolean = false; // Flag to indicate if we should display multiple project tables
  @Input() projectTasks: Map<number, Task[]> = new Map(); // Map of project ID to tasks for multi-project mode
  @Input() projects: Project[] = []; // List of projects for multi-project mode
  @Input() unassignedTasks: Task[] = []; // Unassigned tasks for unified interface
  @Input() hideSearchControls: boolean = false; // Hide search controls when parent handles filtering
  @Output() editTask = new EventEmitter<Task>();
  @Output() deleteTask = new EventEmitter<number>();
  @Output() taskStatusChanged = new EventEmitter<Task>();
  @Output() viewTaskDetails = new EventEmitter<Task>();

  sortedTasks: Task[] = [];
  filteredTasks: Task[] = [];
  selectedTasks: number[] = [];
  selectedTask: Task | null = null;

  // Search and filter properties
  searchTerm: string = '';
  statusFilter: string = '';
  priorityFilter: string = '';

  sortField: string = 'due_date';
  sortDirection: 'asc' | 'desc' = 'asc';

  columns: TaskColumnConfig[] = [];
  showColumnSettings: boolean = false;
  draggedColumn: TaskColumnConfig | null = null;
  showAddColumnForm: boolean = false;
  newColumnName: string = '';
  newColumnDataType: 'text' | 'number' | 'date' | 'select' | 'boolean' = 'text';
  newColumnSelectOptions: string = '';

  private readonly STORAGE_KEY = 'task_table_columns';

  constructor(
    private taskService: TaskService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadColumnSettings();
    this.applyFiltersAndSort();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tasks']) {
      this.applyFiltersAndSort();
    }

    // If projectContext changes, update column visibility
    if (changes['projectContext'] && !changes['projectContext'].firstChange) {
      this.updateProjectColumnVisibility();
    }

    // If projectTasks changes, update our sorted tasks for each project
    if (changes['projectTasks'] && this.multiProjectMode) {
      this.updateSortedProjectTasks();
    }
  }

  // Map to store sorted tasks for each project
  sortedProjectTasks: Map<number, Task[]> = new Map();

  updateProjectColumnVisibility(): void {
    const projectColumn = this.columns.find(col => col.id === 'project');
    if (projectColumn) {
      projectColumn.visible = !this.projectContext;
      this.saveColumnSettings();
    }
  }

  loadColumnSettings(): void {
    const savedColumns = localStorage.getItem(this.STORAGE_KEY);

    if (savedColumns) {
      try {
        this.columns = JSON.parse(savedColumns);
      } catch (e) {
        console.error('Error parsing saved column settings', e);
        this.resetToDefaultColumns();
      }
    } else {
      this.resetToDefaultColumns();
    }
  }

  resetToDefaultColumns(): void {
    this.columns = [...TASK_DEFAULT_COLUMNS];

    // If in project context, hide the project column
    if (this.projectContext) {
      const projectColumn = this.columns.find(col => col.id === 'project');
      if (projectColumn) {
        projectColumn.visible = false;
      }
    }

    this.saveColumnSettings();
  }

  saveColumnSettings(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.columns));
  }

  toggleColumnVisibility(column: TaskColumnConfig): void {
    column.visible = !column.visible;
    this.saveColumnSettings();
  }

  toggleColumnSettings(): void {
    this.showColumnSettings = !this.showColumnSettings;
  }

  isColumnVisible(columnId: string): boolean {
    const column = this.columns.find(col => col.id === columnId);
    return column ? column.visible : false;
  }

  getVisibleColumns(): TaskColumnConfig[] {
    return this.columns
      .filter(column => column.visible)
      .sort((a, b) => a.order - b.order);
  }

  getCustomColumns(): TaskColumnConfig[] {
    return this.columns
      .filter(column => column.id.startsWith('custom_'))
      .sort((a, b) => a.order - b.order);
  }

  getCoreColumns(): TaskColumnConfig[] {
    return this.columns
      .filter(column => !column.id.startsWith('custom_'))
      .sort((a, b) => a.order - b.order);
  }

  onDragStart(event: DragEvent, column: TaskColumnConfig): void {
    this.draggedColumn = column;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', column.id);
    }
  }

  onDragOver(event: DragEvent, column: TaskColumnConfig): void {
    event.preventDefault();
    if (this.draggedColumn && this.draggedColumn.id !== column.id) {
      event.dataTransfer!.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent, targetColumn: TaskColumnConfig): void {
    event.preventDefault();
    if (this.draggedColumn && this.draggedColumn.id !== targetColumn.id) {
      // Reorder columns
      const draggedOrder = this.draggedColumn.order;
      const targetOrder = targetColumn.order;

      if (draggedOrder < targetOrder) {
        // Moving forward
        this.columns.forEach(col => {
          if (col.id === this.draggedColumn!.id) {
            col.order = targetOrder;
          } else if (col.order > draggedOrder && col.order <= targetOrder) {
            col.order--;
          }
        });
      } else {
        // Moving backward
        this.columns.forEach(col => {
          if (col.id === this.draggedColumn!.id) {
            col.order = targetOrder;
          } else if (col.order >= targetOrder && col.order < draggedOrder) {
            col.order++;
          }
        });
      }

      this.saveColumnSettings();
    }
    this.draggedColumn = null;
  }

  onDragEnd(): void {
    this.draggedColumn = null;
  }

  // Search and filter methods
  onSearchChange(): void {
    this.applyFiltersAndSort();
  }

  onFilterChange(): void {
    this.applyFiltersAndSort();
  }

  applyFiltersAndSort(): void {
    // First apply filters to regular tasks
    this.filteredTasks = this.tasks.filter(task => {
      // Search filter
      const searchMatch = !this.searchTerm ||
        task.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (task.assignee?.name && task.assignee.name.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (task.project?.name && task.project.name.toLowerCase().includes(this.searchTerm.toLowerCase()));

      // Status filter
      const statusMatch = !this.statusFilter || task.status === this.statusFilter;

      // Priority filter
      const priorityMatch = !this.priorityFilter || task.priority === this.priorityFilter;

      return searchMatch && statusMatch && priorityMatch;
    });

    // Then sort the filtered results
    this.sortTasks(this.sortField);

    // Also apply filters to multi-project mode if applicable
    if (this.multiProjectMode) {
      this.updateSortedProjectTasks();
    }
  }

  sortTasks(field: string): void {
    // If clicking the same field, toggle direction
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.sortedTasks = this.sortTasksArray([...this.filteredTasks], field, this.sortDirection);

    // If in multi-project mode, also update sorted tasks for each project
    if (this.multiProjectMode) {
      this.updateSortedProjectTasks();
    }
  }

  // Helper method to sort an array of tasks
  sortTasksArray(tasks: Task[], field: string, direction: 'asc' | 'desc'): Task[] {
    return tasks.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      // Handle special cases
      if (field === 'assignee') {
        valueA = a.assignee?.name || '';
        valueB = b.assignee?.name || '';
      } else if (field === 'due_date') {
        valueA = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
        valueB = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;
      } else if (field === 'project') {
        valueA = a.project?.name || '';
        valueB = b.project?.name || '';
      } else {
        valueA = (a as any)[field] || '';
        valueB = (b as any)[field] || '';
      }

      // Compare values
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return direction === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      } else {
        return direction === 'asc'
          ? (valueA > valueB ? 1 : -1)
          : (valueA < valueB ? 1 : -1);
      }
    });
  }

  toggleSelectAll(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedTasks = this.tasks.map(task => task.id);
    } else {
      this.selectedTasks = [];
    }
  }

  toggleTaskSelection(task: Task): void {
    const index = this.selectedTasks.indexOf(task.id);
    if (index === -1) {
      this.selectedTasks.push(task.id);
    } else {
      this.selectedTasks.splice(index, 1);
    }
  }

  toggleTaskDetails(task: Task): void {
    // Emit event to parent component to handle unified modal
    this.viewTaskDetails.emit(task);
  }

  closeTaskDetails(): void {
    this.selectedTask = null;
  }

  onEditTask(task: Task): void {
    this.editTask.emit(task);
  }

  onDeleteTask(taskId: number): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.deleteTask.emit(taskId);
    }
  }

  updateTaskStatus(task: Task, status: 'pending' | 'in_progress' | 'completed'): void {
    this.taskService.updateTask(task.id, { status }).subscribe({
      next: (response) => {
        // Update the task in the list
        const index = this.tasks.findIndex(t => t.id === task.id);
        if (index !== -1) {
          this.tasks[index] = response.task;
          this.selectedTask = response.task;
          this.applyFiltersAndSort();
          this.taskStatusChanged.emit(response.task);
        }
      },
      error: (error) => {
        console.error('Error updating task status', error);
      }
    });
  }

  getStatusClass(task: Task): string {
    switch (task.status) {
      case 'pending':
        return 'status-pending';
      case 'in_progress':
        return 'status-in-progress';
      case 'completed':
        return 'status-completed';
      default:
        return '';
    }
  }

  getPriorityClass(task: Task): string {
    switch (task.priority) {
      case 'low':
        return 'priority-low';
      case 'medium':
        return 'priority-medium';
      case 'high':
        return 'priority-high';
      default:
        return '';
    }
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  getCustomFieldsKeys(task: Task): string[] {
    if (!task.custom_fields) return [];
    return Object.keys(task.custom_fields);
  }

  getTasksByStatus(status: string): Task[] {
    return this.sortedTasks.filter(task => task.status === status);
  }

  // Get tasks by status for a specific project
  getProjectTasksByStatus(projectId: number, status: string): Task[] {
    const projectSortedTasks = this.sortedProjectTasks.get(projectId) || [];
    return projectSortedTasks.filter(task => task.status === status);
  }

  // Get all tasks for a specific project (for minimal multi-project view)
  getProjectTasks(projectId: number): Task[] {
    return this.sortedProjectTasks.get(projectId) || [];
  }

  // Update sorted tasks for each project
  updateSortedProjectTasks(): void {
    this.sortedProjectTasks.clear();

    // For each project, filter and sort its tasks
    this.projectTasks.forEach((tasks, projectId) => {
      // Apply filters to project tasks
      const filteredProjectTasks = tasks.filter(task => {
        // Search filter
        const searchMatch = !this.searchTerm ||
          task.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
          (task.assignee?.name && task.assignee.name.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
          (task.project?.name && task.project.name.toLowerCase().includes(this.searchTerm.toLowerCase()));

        // Status filter
        const statusMatch = !this.statusFilter || task.status === this.statusFilter;

        // Priority filter
        const priorityMatch = !this.priorityFilter || task.priority === this.priorityFilter;

        return searchMatch && statusMatch && priorityMatch;
      });

      const sortedTasks = this.sortTasksArray([...filteredProjectTasks], this.sortField, this.sortDirection);
      this.sortedProjectTasks.set(projectId, sortedTasks);
    });
  }

  // Get project name by ID
  getProjectName(projectId: number): string {
    const project = this.projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  }

  // Get project IDs as an array for template iteration
  getProjectIds(): number[] {
    return Array.from(this.projectTasks.keys());
  }

  getVisibleColumnsCount(): number {
    return this.columns.filter(col => col.visible).length;
  }

  getStageClass(task: Task): string {
    if (!task.stage) return 'stage-lead';

    switch (task.stage.toLowerCase()) {
      case 'lead':
        return 'stage-lead';
      case 'negotiation':
        return 'stage-negotiation';
      case 'planning':
        return 'stage-planning';
      case 'development':
        return 'stage-development';
      case 'testing':
        return 'stage-testing';
      case 'review':
        return 'stage-review';
      case 'deployed':
      case 'won':
        return 'stage-won';
      default:
        return 'stage-lead';
    }
  }



  getCountryFlag(countryCode: string): string {
    // Simple mapping of country codes to flag emojis
    const flagMap: Record<string, string> = {
      'US': '🇺🇸',
      'GB': '🇬🇧',
      'CA': '🇨🇦',
      'FR': '🇫🇷',
      'DE': '🇩🇪',
      'IT': '🇮🇹',
      'ES': '🇪🇸',
      'JP': '🇯🇵',
      'CN': '🇨🇳',
      'RU': '🇷🇺',
      'SG': '🇸🇬',
      'CH': '🇨🇭'
    };

    return flagMap[countryCode] || '🌐';
  }

  navigateToProject(projectId: number): void {
    if (projectId) {
      this.router.navigate(['/projects', projectId]);
    }
  }

  toggleAddColumnForm(): void {
    this.showAddColumnForm = !this.showAddColumnForm;
    if (this.showAddColumnForm) {
      this.newColumnName = '';
      this.newColumnDataType = 'text';
      this.newColumnSelectOptions = '';
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

    // Parse select options if data type is select
    let selectOptions: string[] | undefined;
    if (this.newColumnDataType === 'select' && this.newColumnSelectOptions.trim()) {
      selectOptions = this.newColumnSelectOptions.split(',').map(option => option.trim()).filter(option => option);
    }

    // Find the actions column to insert before it
    const actionsColumn = this.columns.find(col => col.id === 'actions');
    const newOrder = actionsColumn ? actionsColumn.order : this.columns.length;

    // Create the new column
    const newColumn: TaskColumnConfig = {
      id: columnId,
      name: this.newColumnName,
      visible: true,
      order: newOrder,
      width: '150px',
      sortable: true,
      dataType: this.newColumnDataType,
      selectOptions: selectOptions
    };

    // Update order of actions column if it exists
    if (actionsColumn) {
      actionsColumn.order = newOrder + 1;
    }

    // Add the new column to the array
    this.columns.push(newColumn);

    // Save the updated columns
    this.saveColumnSettings();

    // Close the form
    this.showAddColumnForm = false;
    this.newColumnName = '';
    this.newColumnDataType = 'text';
    this.newColumnSelectOptions = '';
  }

  deleteColumn(column: TaskColumnConfig): void {
    if (!column.id.startsWith('custom_')) {
      alert('Default columns cannot be deleted.');
      return;
    }

    if (confirm(`Are you sure you want to delete the "${column.name}" column?`)) {
      // Remove the column from the array
      this.columns = this.columns.filter(col => col.id !== column.id);

      // Reorder remaining columns
      this.columns.sort((a, b) => a.order - b.order);
      this.columns.forEach((col, index) => {
        col.order = index;
      });

      // Save the updated columns
      this.saveColumnSettings();
    }
  }

  // Helper method to get custom field value with proper formatting
  getCustomFieldValue(task: Task, column: TaskColumnConfig): string {
    if (!task.custom_fields || !column.id.startsWith('custom_')) {
      return '-';
    }

    const fieldKey = column.id.replace('custom_', '');
    const value = task.custom_fields[fieldKey];

    if (value === null || value === undefined || value === '') {
      return '-';
    }

    // Format based on data type
    switch (column.dataType) {
      case 'date':
        return value ? new Date(value).toLocaleDateString() : '-';
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'number':
        return typeof value === 'number' ? value.toString() : value;
      default:
        return value.toString();
    }
  }
}

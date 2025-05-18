import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task } from '../../models/task';
import { TaskService } from '../../services/task.service';
import { ColumnConfig, DEFAULT_COLUMNS } from '../../models/column-config';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss'
})
export class TaskListComponent implements OnInit, OnChanges {
  @Input() tasks: Task[] = [];
  @Output() editTask = new EventEmitter<Task>();
  @Output() deleteTask = new EventEmitter<number>();
  @Output() taskStatusChanged = new EventEmitter<Task>();

  sortedTasks: Task[] = [];
  selectedTasks: number[] = [];
  selectedTask: Task | null = null;

  sortField: string = 'due_date';
  sortDirection: 'asc' | 'desc' = 'asc';

  columns: ColumnConfig[] = [];
  showColumnSettings: boolean = false;
  draggedColumn: ColumnConfig | null = null;
  showAddColumnForm: boolean = false;
  newColumnName: string = '';

  private readonly STORAGE_KEY = 'task_table_columns';

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.loadColumnSettings();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tasks']) {
      this.sortTasks(this.sortField);
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
    this.columns = [...DEFAULT_COLUMNS];
    this.saveColumnSettings();
  }

  saveColumnSettings(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.columns));
  }

  toggleColumnVisibility(column: ColumnConfig): void {
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

  getVisibleColumns(): ColumnConfig[] {
    return this.columns
      .filter(column => column.visible)
      .sort((a, b) => a.order - b.order);
  }

  getCustomColumns(): ColumnConfig[] {
    return this.columns
      .filter(column => column.id.startsWith('custom_'))
      .sort((a, b) => a.order - b.order);
  }

  onDragStart(event: DragEvent, column: ColumnConfig): void {
    this.draggedColumn = column;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', column.id);
    }
  }

  onDragOver(event: DragEvent, column: ColumnConfig): void {
    event.preventDefault();
    if (this.draggedColumn && this.draggedColumn.id !== column.id) {
      event.dataTransfer!.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent, targetColumn: ColumnConfig): void {
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

  sortTasks(field: string): void {
    // If clicking the same field, toggle direction
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.sortedTasks = [...this.tasks].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      // Handle special case for assignee
      if (field === 'assignee') {
        valueA = a.assignee?.name || '';
        valueB = b.assignee?.name || '';
      } else if (field === 'due_date') {
        valueA = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
        valueB = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;
      } else {
        valueA = (a as any)[field] || '';
        valueB = (b as any)[field] || '';
      }

      // Compare values
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return this.sortDirection === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      } else {
        return this.sortDirection === 'asc'
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
    if (this.selectedTask && this.selectedTask.id === task.id) {
      this.selectedTask = null;
    } else {
      this.selectedTask = task;
    }
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
          this.sortTasks(this.sortField);
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

  toggleAddColumnForm(): void {
    this.showAddColumnForm = !this.showAddColumnForm;
    if (this.showAddColumnForm) {
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

    // Find the actions column
    const actionsColumn = this.columns.find(col => col.id === 'actions');

    if (actionsColumn) {
      // Insert the new column before the actions column
      this.columns.forEach(col => {
        if (col.id === 'actions') {
          col.order = col.order + 1;
        }
      });
    }

    // Add the new column to the array
    this.columns.push(newColumn);

    // Save the updated columns
    this.saveColumnSettings();

    // Close the form
    this.showAddColumnForm = false;
    this.newColumnName = '';
  }

  deleteColumn(column: ColumnConfig): void {
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
}

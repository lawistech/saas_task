import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task } from '../../models/task';
import { Project } from '../../models/project';
import { TaskService } from '../../services/task.service';
import { Router } from '@angular/router';
import { TaskColumnConfig, TASK_DEFAULT_COLUMNS } from '../../models/task-column-config';

@Component({
  selector: 'app-task-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-table.component.html'
})
export class TaskTableComponent implements OnInit, OnChanges {
  @Input() tasks: Task[] = [];
  @Input() projects: Project[] = [];
  @Output() editTask = new EventEmitter<Task>();
  @Output() deleteTask = new EventEmitter<number>();
  @Output() taskStatusChanged = new EventEmitter<Task>();
  @Output() viewTaskDetails = new EventEmitter<Task>();

  sortedTasks: Task[] = [];
  selectedTasks: number[] = [];
  activeActionMenu: number | null = null;

  sortField: string = 'due_date';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Column management properties
  columns: TaskColumnConfig[] = [];
  showColumnSettings: boolean = false;
  showAddColumnModal: boolean = false;
  draggedColumn: TaskColumnConfig | null = null;
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
    this.sortTasks();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tasks']) {
      this.sortTasks();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.action-menu-container')) {
      this.activeActionMenu = null;
    }
  }



  sortTasks(field?: string): void {
    if (field) {
      if (this.sortField === field) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = field;
        this.sortDirection = 'asc';
      }
    }

    this.sortedTasks = [...this.tasks].sort((a, b) => {
      let aValue = this.getSortValue(a, this.sortField);
      let bValue = this.getSortValue(b, this.sortField);

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return this.sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return this.sortDirection === 'asc' ? -1 : 1;

      // Convert to comparable values
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  getSortValue(task: Task, field: string): any {
    switch (field) {
      case 'title': return task.title;
      case 'description': return task.description;
      case 'status': return task.status;
      case 'priority': return task.priority;
      case 'due_date': return task.due_date;
      case 'created_at': return task.created_at;
      case 'assignee': return task.assignee?.name || '';
      case 'project': return task.project?.name || '';
      case 'progress': return task.progress || 0;
      case 'budget': return task.budget || 0;
      default: return '';
    }
  }

  toggleTaskSelection(task: Task): void {
    const index = this.selectedTasks.indexOf(task.id);
    if (index > -1) {
      this.selectedTasks.splice(index, 1);
    } else {
      this.selectedTasks.push(task.id);
    }
  }

  toggleSelectAll(event: any): void {
    if (event.target.checked) {
      this.selectedTasks = this.sortedTasks.map(task => task.id);
    } else {
      this.selectedTasks = [];
    }
  }

  onEditTask(task: Task): void {
    this.editTask.emit(task);
  }

  onDeleteTask(taskId: number): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.deleteTask.emit(taskId);
    }
  }

  onViewTaskDetails(task: Task): void {
    this.viewTaskDetails.emit(task);
  }

  formatDate(date: string | null): string {
    if (!date) return 'No date';
    return new Date(date).toLocaleDateString();
  }

  getStatusClass(task: Task): string {
    return `status-${task.status.replace('_', '-')}`;
  }

  getPriorityClass(task: Task): string {
    return `priority-${task.priority}`;
  }

  // New methods for the redesigned table
  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Done';
      case 'not_started': return 'Not Started';
      case 'in_review': return 'In Review';
      case 'done': return 'Done';
      default: return status.replace('_', ' ');
    }
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().substring(0, 2);
  }

  getAssigneeColor(name: string): string {
    const colors = [
      'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-amber-500', 'bg-red-500', 'bg-teal-500',
      'bg-cyan-500', 'bg-violet-500', 'bg-rose-500', 'bg-orange-500'
    ];
    // Create a more consistent hash based on the name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      const char = name.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  isOverdue(dueDate: string | null): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }

  getCompletedCount(): number {
    return this.sortedTasks.filter(task => task.status === 'completed' || task.status === 'done').length;
  }

  getInProgressCount(): number {
    return this.sortedTasks.filter(task => task.status === 'in_progress' || task.status === 'in_review').length;
  }

  getNotStartedCount(): number {
    return this.sortedTasks.filter(task => task.status === 'pending' || task.status === 'not_started').length;
  }

  getProjectName(projectId: number): string {
    const project = this.projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  }

  navigateToProject(projectId: number): void {
    this.router.navigate(['/projects', projectId]);
  }

  trackByTaskId(index: number, task: Task): number {
    return task.id;
  }

  trackByColumnId(index: number, column: TaskColumnConfig): string {
    return column.id;
  }

  // New Airtable-inspired functionality
  isDueSoon(dueDate: string | null): boolean {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
  }

  onStatusChange(task: Task, event: any): void {
    const newStatus = event.target.value;
    const updatedTask = { ...task, status: newStatus };
    this.taskStatusChanged.emit(updatedTask);
  }

  onPriorityChange(task: Task, event: any): void {
    const newPriority = event.target.value;
    const updatedTask = { ...task, priority: newPriority };
    this.taskStatusChanged.emit(updatedTask);
  }

  editProgress(task: Task): void {
    const newProgress = prompt('Enter progress percentage (0-100):', (task.progress || 0).toString());
    if (newProgress !== null) {
      const progress = Math.max(0, Math.min(100, parseInt(newProgress) || 0));
      const updatedTask = { ...task, progress };
      this.taskStatusChanged.emit(updatedTask);
    }
  }

  editBudget(task: Task): void {
    const newBudget = prompt('Enter budget amount:', (task.budget || 0).toString());
    if (newBudget !== null) {
      const budget = parseFloat(newBudget) || 0;
      const updatedTask = { ...task, budget };
      this.taskStatusChanged.emit(updatedTask);
    }
  }

  toggleActionMenu(taskId: number): void {
    this.activeActionMenu = this.activeActionMenu === taskId ? null : taskId;
  }

  closeActionMenu(): void {
    this.activeActionMenu = null;
  }

  duplicateTask(task: Task): void {
    const duplicatedTask = {
      ...task,
      id: 0, // Will be assigned by backend
      title: `${task.title} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.editTask.emit(duplicatedTask);
  }

  bulkUpdateStatus(): void {
    if (this.selectedTasks.length === 0) return;

    const newStatus = prompt('Enter new status for selected tasks:', 'in_progress');
    if (newStatus) {
      // Emit bulk update event - this would need to be handled by parent component
      console.log('Bulk updating tasks:', this.selectedTasks, 'to status:', newStatus);
    }
  }

  exportTasks(): void {
    // Simple CSV export functionality
    const csvContent = this.generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tasks.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private generateCSV(): string {
    const headers = ['Title', 'Description', 'Status', 'Priority', 'Assignee', 'Due Date', 'Progress', 'Budget'];
    const rows = this.sortedTasks.map(task => [
      task.title,
      task.description || '',
      task.status,
      task.priority,
      task.assignee?.name || 'Unassigned',
      task.due_date || '',
      (task.progress || 0).toString(),
      (task.budget || 0).toString()
    ]);

    return [headers, ...rows].map(row =>
      row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  }

  createNewTask(): void {
    this.editTask.emit({
      id: 0,
      user_id: 0,
      title: '',
      description: '',
      status: 'not_started',
      priority: 'medium',
      due_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as Task);
  }

  // Column Management Methods
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
    this.saveColumnSettings();
  }

  saveColumnSettings(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.columns));
  }

  getVisibleColumns(): TaskColumnConfig[] {
    return this.columns
      .filter(column => column.visible)
      .sort((a, b) => a.order - b.order);
  }

  toggleColumnVisibility(column: TaskColumnConfig): void {
    column.visible = !column.visible;
    this.saveColumnSettings();
  }

  toggleColumnSettings(): void {
    this.showColumnSettings = !this.showColumnSettings;
  }

  openAddColumnModal(): void {
    this.showAddColumnModal = true;
    this.newColumnName = '';
    this.newColumnDataType = 'text';
    this.newColumnSelectOptions = '';
  }

  closeAddColumnModal(): void {
    this.showAddColumnModal = false;
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
      key: columnId,
      label: this.newColumnName,
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

    // Add the new column
    this.columns.push(newColumn);

    // Save the updated columns
    this.saveColumnSettings();

    // Close the modal
    this.closeAddColumnModal();
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

  getCustomFieldValue(task: Task, columnId: string): any {
    if (!task.custom_fields) return '';
    return task.custom_fields[columnId] || '';
  }

  updateCustomField(task: Task, columnId: string, value: any): void {
    if (!task.custom_fields) {
      task.custom_fields = {};
    }
    task.custom_fields[columnId] = value;

    // Update the task via the service
    this.taskService.updateTask(task.id, { custom_fields: task.custom_fields }).subscribe({
      next: (response) => {
        console.log('Custom field updated successfully');
      },
      error: (error) => {
        console.error('Error updating custom field:', error);
      }
    });
  }

  onCustomFieldChange(task: Task, columnId: string, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    this.updateCustomField(task, columnId, target.value);
  }

  onCustomFieldCheckboxChange(task: Task, columnId: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.updateCustomField(task, columnId, target.checked);
  }

  // Drag and drop for column reordering
  onDragStart(event: DragEvent, column: TaskColumnConfig): void {
    this.draggedColumn = column;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', column.id);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent, targetColumn: TaskColumnConfig): void {
    event.preventDefault();

    if (this.draggedColumn && this.draggedColumn.id !== targetColumn.id) {
      const draggedIndex = this.columns.findIndex(col => col.id === this.draggedColumn!.id);
      const targetIndex = this.columns.findIndex(col => col.id === targetColumn.id);

      // Remove dragged column and insert at target position
      const [draggedCol] = this.columns.splice(draggedIndex, 1);
      this.columns.splice(targetIndex, 0, draggedCol);

      // Update order values
      this.columns.forEach((col, index) => {
        col.order = index;
      });

      this.saveColumnSettings();
    }

    this.draggedColumn = null;
  }
}

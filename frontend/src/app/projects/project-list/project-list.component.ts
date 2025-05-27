import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Project } from '../../models/project';
import { ProjectService } from '../../services/project.service';
import { PROJECT_DEFAULT_COLUMNS } from '../../models/project-column-config';
import { ColumnConfig } from '../../models/column-config';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    LoadingSkeletonComponent,
    EmptyStateComponent,
    StatusBadgeComponent
  ],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss'
})
export class ProjectListComponent implements OnInit, OnChanges {
  @Input() projects: Project[] = [];
  @Input() isLoading: boolean = false;
  @Input() searchTerm: string = '';
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
  showColumnSettingsPanel: boolean = false;
  draggedColumn: ColumnConfig | null = null;
  showAddColumnForm: boolean = false;
  showAddColumnModal: boolean = false;
  newColumnName: string = '';
  newColumn = { name: '', type: 'text' };
  displayedColumnsConfig: ColumnConfig[] = [];
  allSelected: boolean = false;
  sortKey: string = '';

  // UI state properties
  hoveredRowId: number | null = null;
  actionLoading: { [key: string]: boolean } = {};

  private readonly STORAGE_KEY = 'project_table_columns';

  constructor(
    private projectService: ProjectService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadColumnSettings();
    this.displayedColumnsConfig = [...this.columns];
    this.sortedProjects = [...this.projects];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projects']) {
      this.sortProjectsData();
      this.updateSelectAllState();
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

    this.displayedColumnsConfig = [...this.columns];
    this.sortProjectsData();
  }

  saveColumnSettings(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.columns));
  }

  sortProjectsData(): void {
    if (!this.projects || this.projects.length === 0) {
      this.sortedProjects = [];
      return;
    }

    this.sortedProjects = [...this.projects].sort((a, b) => {
      let aValue: any = a[this.sortField as keyof Project];
      let bValue: any = b[this.sortField as keyof Project];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return this.sortDirection === 'asc' ? 1 : -1;
      if (bValue === null || bValue === undefined) return this.sortDirection === 'asc' ? -1 : 1;

      // Handle dates
      if (this.sortField === 'start_date' || this.sortField === 'end_date' || this.sortField === 'created_at' || this.sortField === 'updated_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();

        // Handle invalid dates
        if (isNaN(aValue)) return this.sortDirection === 'asc' ? 1 : -1;
        if (isNaN(bValue)) return this.sortDirection === 'asc' ? -1 : 1;
      }

      // Handle strings
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return this.sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Handle numbers
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return this.sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Fallback for mixed types - convert to string
      const aStr = String(aValue);
      const bStr = String(bValue);
      return this.sortDirection === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
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
    // Navigate to project details page
    this.router.navigate(['/projects', project.id]);
  }

  viewProjectDetails(project: Project, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['/projects', project.id]);
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

  // Additional methods for template compatibility
  toggleColumnSettingsPanel(): void {
    this.showColumnSettingsPanel = !this.showColumnSettingsPanel;
  }

  closeColumnSettingsPanel(): void {
    this.showColumnSettingsPanel = false;
  }

  openAddColumnModal(): void {
    this.showAddColumnModal = true;
    this.newColumn = { name: '', type: 'text' };
  }

  closeAddColumnModal(): void {
    this.showAddColumnModal = false;
    this.newColumn = { name: '', type: 'text' };
  }

  addColumn(): void {
    if (!this.newColumn.name.trim()) {
      return;
    }

    const columnId = 'custom_' + this.newColumn.name.toLowerCase().replace(/\s+/g, '_');

    if (this.columns.some(col => col.id === columnId)) {
      alert('A column with this name already exists.');
      return;
    }

    const newColumn: ColumnConfig = {
      id: columnId,
      name: this.newColumn.name,
      visible: true,
      order: this.columns.length,
      width: '150px'
    };

    this.columns.push(newColumn);
    this.columns = this.columns.sort((a, b) => a.order - b.order);
    this.saveColumnSettings();
    this.closeAddColumnModal();
  }

  onColumnDrop(event: any): void {
    // Handle column reordering via drag and drop
    const previousIndex = event.previousIndex;
    const currentIndex = event.currentIndex;

    if (previousIndex !== currentIndex) {
      const movedColumn = this.displayedColumnsConfig[previousIndex];
      this.displayedColumnsConfig.splice(previousIndex, 1);
      this.displayedColumnsConfig.splice(currentIndex, 0, movedColumn);

      // Update order values
      this.displayedColumnsConfig.forEach((col, index) => {
        col.order = index;
      });

      this.saveColumnSettings();
    }
  }

  onRowSelect(project: Project): void {
    // Handle individual row selection
    this.updateSelectAllState();
  }

  private updateSelectAllState(): void {
    const selectedCount = this.projects.filter(p => p.selected).length;
    this.allSelected = selectedCount === this.projects.length && this.projects.length > 0;
  }

  sortData(key: string): void {
    if (this.sortKey === key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDirection = 'asc';
    }

    this.sortField = key;
    this.sortProjectsData();
  }

  onEditProjectClick(projectId: number): void {
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
      this.editProject.emit(project);
    }
  }

  onDeleteProjectClick(projectId: number): void {
    if (confirm('Are you sure you want to delete this project?')) {
      this.deleteProject.emit(projectId);
    }
  }

  // Enhanced UI interaction methods
  onRowHover(projectId: number | null): void {
    this.hoveredRowId = projectId;
  }

  setActionLoading(action: string, projectId: number, loading: boolean): void {
    const key = `${action}_${projectId}`;
    if (loading) {
      this.actionLoading[key] = true;
    } else {
      delete this.actionLoading[key];
    }
  }

  isActionLoading(action: string, projectId: number): boolean {
    const key = `${action}_${projectId}`;
    return !!this.actionLoading[key];
  }

  onStatusChanged(project: Project, newStatus: string): void {
    this.setActionLoading('status', project.id, true);
    const updatedProject = { ...project, status: newStatus as Project['status'] };
    this.projectStatusChanged.emit(updatedProject);

    // Simulate API call delay for better UX
    setTimeout(() => {
      this.setActionLoading('status', project.id, false);
    }, 500);
  }

  onEditProjectWithLoading(project: Project): void {
    this.setActionLoading('edit', project.id, true);
    this.editProject.emit(project);

    // Reset loading state after a short delay
    setTimeout(() => {
      this.setActionLoading('edit', project.id, false);
    }, 300);
  }

  onDeleteProjectWithLoading(projectId: number): void {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      this.setActionLoading('delete', projectId, true);
      this.deleteProject.emit(projectId);
    }
  }

  getProjectProgress(project: Project): number {
    // Calculate project progress based on tasks or other metrics
    // This is a placeholder - you can implement actual logic based on your needs
    if (project.status === 'completed') return 100;
    if (project.status === 'cancelled') return 0;
    if (project.status === 'active') return Math.floor(Math.random() * 80) + 10; // 10-90%
    if (project.status === 'on_hold') return Math.floor(Math.random() * 50) + 10; // 10-60%
    return 0;
  }

  getProjectPriority(project: Project): 'low' | 'medium' | 'high' {
    // Determine priority based on project data
    // This is a placeholder - implement actual logic based on your needs
    const priorities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
    return priorities[Math.floor(Math.random() * priorities.length)];
  }

  highlightSearchTerm(text: string): string {
    if (!this.searchTerm || !text) return text;

    const regex = new RegExp(`(${this.searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
  }

  getRelativeTime(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  }

  trackByProjectId(index: number, project: Project): number {
    return project.id;
  }

  clearSelection(): void {
    this.projects.forEach(project => project.selected = false);
    this.selectedProjects = [];
    this.allSelected = false;
  }

  openAddProjectModal(): void {
    // This method should be implemented in the parent component
    // For now, we'll emit an event or navigate
    console.log('Open add project modal');
  }

  getColumnClass(col: ColumnConfig): string {
    const classes = ['table-cell'];

    if (col.id === 'name') classes.push('col-name');
    if (col.id === 'status') classes.push('col-status');
    if (col.id === 'budget') classes.push('col-budget');
    if (col.id === 'actions') classes.push('col-actions');

    return classes.join(' ');
  }

  getProjectValue(project: Project, col: ColumnConfig): any {
    const key = col.key || col.id;

    // Handle custom fields
    if (key.startsWith('custom_')) {
      const customFieldKey = key.replace('custom_', '');
      return project.custom_fields?.[customFieldKey] || null;
    }

    // Handle standard fields
    const value = (project as any)[key];

    // Return null for undefined values to ensure consistent display
    return value !== undefined ? value : null;
  }
}

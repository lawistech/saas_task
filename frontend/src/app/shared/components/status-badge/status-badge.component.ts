import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface StatusOption {
  value: string;
  label: string;
  color: string;
  icon?: string;
}

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="status-badge-container" [ngClass]="containerClass">
      <!-- Display Mode -->
      <div *ngIf="!editable" class="status-badge" [ngClass]="getBadgeClass(currentStatus)">
        <i [class]="getStatusIcon(currentStatus)" *ngIf="showIcon"></i>
        <span>{{ getStatusLabel(currentStatus) }}</span>
      </div>

      <!-- Editable Mode -->
      <div *ngIf="editable" class="status-badge-editable">
        <div class="status-badge" [ngClass]="getBadgeClass(currentStatus)" (click)="toggleDropdown()">
          <i [class]="getStatusIcon(currentStatus)" *ngIf="showIcon"></i>
          <span>{{ getStatusLabel(currentStatus) }}</span>
          <i class="fas fa-chevron-down ml-1 text-xs transition-transform duration-200"
             [ngClass]="{'rotate-180': showDropdown}"></i>
        </div>

        <!-- Dropdown -->
        <div *ngIf="showDropdown" class="status-dropdown" (clickOutside)="closeDropdown()">
          <div class="dropdown-content">
            <button
              *ngFor="let option of statusOptions"
              (click)="selectStatus(option.value)"
              class="dropdown-item"
              [ngClass]="{'selected': option.value === currentStatus}">
              <i [class]="getStatusIcon(option.value)" *ngIf="showIcon"></i>
              <span>{{ option.label }}</span>
              <i class="fas fa-check ml-auto text-xs" *ngIf="option.value === currentStatus"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .status-badge-container {
      @apply relative inline-block;
    }

    .status-badge {
      @apply inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium;
      @apply transition-all duration-200 cursor-default;
    }

    .status-badge-editable .status-badge {
      @apply cursor-pointer hover:shadow-sm;
    }

    .status-dropdown {
      @apply absolute top-full left-0 mt-1 z-50;
      @apply min-w-full w-max;
    }

    .dropdown-content {
      @apply bg-white border border-gray-200 rounded-lg shadow-lg py-1;
      @apply max-h-60 overflow-y-auto;
    }

    .dropdown-item {
      @apply w-full px-3 py-2 text-left text-sm flex items-center gap-2;
      @apply hover:bg-gray-50 transition-colors duration-150;
      @apply border-none bg-transparent cursor-pointer;
    }

    .dropdown-item.selected {
      @apply bg-indigo-50 text-indigo-700;
    }

    /* Status-specific styles */
    .status-active {
      @apply bg-green-100 text-green-800 border border-green-200;
    }

    .status-on-hold {
      @apply bg-yellow-100 text-yellow-800 border border-yellow-200;
    }

    .status-completed {
      @apply bg-blue-100 text-blue-800 border border-blue-200;
    }

    .status-cancelled {
      @apply bg-red-100 text-red-800 border border-red-200;
    }

    .status-pending {
      @apply bg-gray-100 text-gray-800 border border-gray-200;
    }

    .status-in-progress {
      @apply bg-indigo-100 text-indigo-800 border border-indigo-200;
    }

    /* Size variants */
    .size-small .status-badge {
      @apply px-2 py-1 text-xs;
    }

    .size-large .status-badge {
      @apply px-4 py-2 text-sm;
    }

    /* Animation for dropdown */
    .status-dropdown {
      animation: fadeInDown 0.2s ease-out;
    }

    @keyframes fadeInDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .rotate-180 {
      transform: rotate(180deg);
    }
  `],
  host: {
    '(document:click)': 'onDocumentClick($event)'
  }
})
export class StatusBadgeComponent {
  @Input() status: string = '';
  @Input() editable: boolean = false;
  @Input() showIcon: boolean = true;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() loading: boolean = false;
  @Input() statusOptions: StatusOption[] = [
    { value: 'active', label: 'Active', color: 'green', icon: 'fas fa-play-circle' },
    { value: 'on_hold', label: 'On Hold', color: 'yellow', icon: 'fas fa-pause-circle' },
    { value: 'completed', label: 'Completed', color: 'blue', icon: 'fas fa-check-circle' },
    { value: 'cancelled', label: 'Cancelled', color: 'red', icon: 'fas fa-times-circle' }
  ];

  @Output() statusChange = new EventEmitter<string>();

  showDropdown: boolean = false;
  currentStatus: string = '';

  ngOnInit(): void {
    this.currentStatus = this.status;
  }

  ngOnChanges(): void {
    this.currentStatus = this.status;
  }

  get containerClass(): string {
    const classes = [];

    if (this.size !== 'medium') {
      classes.push(`size-${this.size}`);
    }

    return classes.join(' ');
  }

  getBadgeClass(status: string): string {
    return `status-${status.replace('_', '-')}`;
  }

  getStatusLabel(status: string): string {
    const option = this.statusOptions.find(opt => opt.value === status);
    return option ? option.label : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getStatusIcon(status: string): string {
    const option = this.statusOptions.find(opt => opt.value === status);
    return option?.icon || 'fas fa-circle';
  }

  toggleDropdown(): void {
    if (this.editable) {
      this.showDropdown = !this.showDropdown;
    }
  }

  closeDropdown(): void {
    this.showDropdown = false;
  }

  selectStatus(status: string): void {
    if (status !== this.currentStatus) {
      this.currentStatus = status;
      this.statusChange.emit(status);
    }
    this.closeDropdown();
  }

  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.status-badge-container')) {
      this.closeDropdown();
    }
  }
}

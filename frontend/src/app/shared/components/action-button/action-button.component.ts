import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-action-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      (click)="onClick($event)"
      [ngClass]="buttonClasses"
      [attr.aria-label]="ariaLabel"
      [title]="tooltip">

      <!-- Loading spinner -->
      <i *ngIf="loading" class="fas fa-spinner fa-spin" [ngClass]="iconSizeClass"></i>

      <!-- Icon -->
      <i *ngIf="!loading && icon" [class]="icon" [ngClass]="iconSizeClass"></i>

      <!-- Text -->
      <span *ngIf="text && !iconOnly" [ngClass]="textClass">{{ text }}</span>

      <!-- Badge -->
      <span *ngIf="badge" class="action-button-badge" [ngClass]="badgeClass">{{ badge }}</span>
    </button>
  `,
  styles: [`
    .action-button {
      @apply inline-flex items-center justify-center gap-2 font-medium rounded-lg;
      @apply transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
      @apply disabled:opacity-50 disabled:cursor-not-allowed;
    }

    /* Size variants */
    .size-xs {
      @apply px-2 py-1 text-xs;
    }

    .size-sm {
      @apply px-3 py-1.5 text-sm;
    }

    .size-md {
      @apply px-4 py-2 text-sm;
    }

    .size-lg {
      @apply px-6 py-3 text-base;
    }

    .size-xl {
      @apply px-8 py-4 text-lg;
    }

    /* Icon-only variants */
    .icon-only.size-xs {
      @apply p-1;
    }

    .icon-only.size-sm {
      @apply p-1.5;
    }

    .icon-only.size-md {
      @apply p-2;
    }

    .icon-only.size-lg {
      @apply p-3;
    }

    .icon-only.size-xl {
      @apply p-4;
    }

    /* Variant styles */
    .variant-primary {
      @apply bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500;
    }

    .variant-secondary {
      @apply bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500;
    }

    .variant-success {
      @apply bg-green-600 text-white hover:bg-green-700 focus:ring-green-500;
    }

    .variant-danger {
      @apply bg-red-600 text-white hover:bg-red-700 focus:ring-red-500;
    }

    .variant-warning {
      @apply bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500;
    }

    .variant-info {
      @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
    }

    .variant-outline {
      @apply border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500;
    }

    .variant-ghost {
      @apply bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-500;
    }

    .variant-link {
      @apply bg-transparent text-indigo-600 hover:text-indigo-700 focus:ring-indigo-500 underline;
    }

    /* Icon sizes */
    .icon-xs {
      @apply text-xs;
    }

    .icon-sm {
      @apply text-sm;
    }

    .icon-md {
      @apply text-base;
    }

    .icon-lg {
      @apply text-lg;
    }

    .icon-xl {
      @apply text-xl;
    }

    /* Badge */
    .action-button-badge {
      @apply inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium rounded-full;
      @apply bg-red-500 text-white ml-1;
      min-width: 1.25rem;
      height: 1.25rem;
    }

    .badge-primary {
      @apply bg-indigo-500 text-white;
    }

    .badge-secondary {
      @apply bg-gray-500 text-white;
    }

    .badge-success {
      @apply bg-green-500 text-white;
    }

    .badge-danger {
      @apply bg-red-500 text-white;
    }

    .badge-warning {
      @apply bg-yellow-500 text-white;
    }

    .badge-info {
      @apply bg-blue-500 text-white;
    }

    /* Disabled state */
    .action-button:disabled {
      @apply transform-none;
    }

    /* Hover effects */
    .action-button:not(:disabled):hover {
      @apply transform -translate-y-0.5 shadow-md;
    }

    .action-button:not(:disabled):active {
      @apply transform translate-y-0;
    }

    /* Focus styles */
    .action-button:focus {
      @apply ring-2 ring-offset-2;
    }

    /* Loading state */
    .action-button:disabled .fa-spinner {
      @apply animate-spin;
    }
  `]
})
export class ActionButtonComponent {
  @Input() text?: string;
  @Input() icon?: string;
  @Input() variant: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'outline' | 'ghost' | 'link' = 'primary';
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() iconOnly: boolean = false;
  @Input() badge?: string | number;
  @Input() badgeVariant: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' = 'danger';
  @Input() tooltip?: string;
  @Input() ariaLabel?: string;

  @Output() buttonClick = new EventEmitter<Event>();

  get buttonClasses(): string {
    const classes = ['action-button'];

    classes.push(`variant-${this.variant}`);
    classes.push(`size-${this.size}`);

    if (this.iconOnly) {
      classes.push('icon-only');
    }

    return classes.join(' ');
  }

  get iconSizeClass(): string {
    return `icon-${this.size}`;
  }

  get textClass(): string {
    return '';
  }

  get badgeClass(): string {
    return `badge-${this.badgeVariant}`;
  }

  onClick(event: Event): void {
    if (!this.disabled && !this.loading) {
      this.buttonClick.emit(event);
    }
  }
}

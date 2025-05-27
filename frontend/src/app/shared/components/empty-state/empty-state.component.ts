import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state-container" [ngClass]="containerClass">
      <div class="empty-state-content">
        <!-- Icon -->
        <div class="empty-state-icon" [ngClass]="iconClass">
          <i [class]="icon" *ngIf="icon"></i>
          <ng-content select="[slot=icon]"></ng-content>
        </div>

        <!-- Title -->
        <h3 class="empty-state-title" [ngClass]="titleClass">
          {{ title }}
        </h3>

        <!-- Description -->
        <p class="empty-state-description" [ngClass]="descriptionClass" *ngIf="description">
          {{ description }}
        </p>

        <!-- Action Button -->
        <div class="empty-state-actions" *ngIf="actionText">
          <button 
            (click)="onActionClick()"
            class="empty-state-button"
            [ngClass]="buttonClass"
            [disabled]="actionDisabled">
            <i [class]="actionIcon" *ngIf="actionIcon"></i>
            {{ actionText }}
          </button>
        </div>

        <!-- Custom content slot -->
        <div class="empty-state-custom" *ngIf="hasCustomContent">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .empty-state-container {
      @apply flex items-center justify-center min-h-64 p-8;
    }

    .empty-state-content {
      @apply text-center max-w-md mx-auto;
    }

    .empty-state-icon {
      @apply mx-auto mb-6 flex items-center justify-center;
      @apply w-16 h-16 rounded-full bg-gray-100;
    }

    .empty-state-icon i {
      @apply text-2xl text-gray-400;
    }

    .empty-state-title {
      @apply text-xl font-semibold text-gray-900 mb-3;
    }

    .empty-state-description {
      @apply text-gray-600 mb-6 leading-relaxed;
    }

    .empty-state-button {
      @apply inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200;
      @apply bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2;
      @apply disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600;
    }

    .empty-state-custom {
      @apply mt-6;
    }

    /* Variants */
    .variant-projects .empty-state-icon {
      @apply bg-blue-50;
    }

    .variant-projects .empty-state-icon i {
      @apply text-blue-500;
    }

    .variant-tasks .empty-state-icon {
      @apply bg-green-50;
    }

    .variant-tasks .empty-state-icon i {
      @apply text-green-500;
    }

    .variant-error .empty-state-icon {
      @apply bg-red-50;
    }

    .variant-error .empty-state-icon i {
      @apply text-red-500;
    }

    .variant-search .empty-state-icon {
      @apply bg-yellow-50;
    }

    .variant-search .empty-state-icon i {
      @apply text-yellow-500;
    }

    /* Size variants */
    .size-small {
      @apply min-h-48 p-6;
    }

    .size-small .empty-state-icon {
      @apply w-12 h-12 mb-4;
    }

    .size-small .empty-state-icon i {
      @apply text-xl;
    }

    .size-small .empty-state-title {
      @apply text-lg mb-2;
    }

    .size-large {
      @apply min-h-80 p-12;
    }

    .size-large .empty-state-icon {
      @apply w-20 h-20 mb-8;
    }

    .size-large .empty-state-icon i {
      @apply text-3xl;
    }

    .size-large .empty-state-title {
      @apply text-2xl mb-4;
    }
  `]
})
export class EmptyStateComponent {
  @Input() title: string = 'No items found';
  @Input() description?: string;
  @Input() icon: string = 'fas fa-inbox';
  @Input() actionText?: string;
  @Input() actionIcon?: string;
  @Input() actionDisabled: boolean = false;
  @Input() variant: 'default' | 'projects' | 'tasks' | 'error' | 'search' = 'default';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() hasCustomContent: boolean = false;

  @Output() actionClick = new EventEmitter<void>();

  get containerClass(): string {
    const classes = [];
    
    if (this.variant !== 'default') {
      classes.push(`variant-${this.variant}`);
    }
    
    if (this.size !== 'medium') {
      classes.push(`size-${this.size}`);
    }
    
    return classes.join(' ');
  }

  get iconClass(): string {
    return '';
  }

  get titleClass(): string {
    return '';
  }

  get descriptionClass(): string {
    return '';
  }

  get buttonClass(): string {
    return '';
  }

  onActionClick(): void {
    if (!this.actionDisabled) {
      this.actionClick.emit();
    }
  }
}

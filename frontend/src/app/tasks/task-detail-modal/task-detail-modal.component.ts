import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task';

@Component({
  selector: 'app-task-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-detail-modal.component.html',
  styleUrl: './task-detail-modal.component.scss'
})
export class TaskDetailModalComponent {
  @Input() task: Task | null = null;
  @Input() showModal: boolean = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() editTask = new EventEmitter<Task>();
  @Output() deleteTask = new EventEmitter<number>();

  onClose(): void {
    this.closeModal.emit();
  }

  onEdit(): void {
    if (this.task) {
      this.editTask.emit(this.task);
    }
  }

  onDelete(): void {
    if (this.task && confirm('Are you sure you want to delete this task?')) {
      this.deleteTask.emit(this.task.id);
    }
  }

  getStatusClass(status: string): string {
    const statusClasses: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'not_started': 'bg-gray-100 text-gray-800',
      'in_review': 'bg-purple-100 text-purple-800',
      'done': 'bg-green-100 text-green-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  getPriorityClass(priority: string): string {
    const priorityClasses: Record<string, string> = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-red-100 text-red-800'
    };
    return priorityClasses[priority] || 'bg-gray-100 text-gray-800';
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString();
  }

  getProgressColor(progress: number | null): string {
    if (!progress) return 'bg-gray-200';
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  formatCurrency(amount: number | null): string {
    if (!amount) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getCustomFieldKeys(): string[] {
    if (!this.task?.custom_fields) return [];
    return Object.keys(this.task.custom_fields);
  }

  getCustomFieldValue(key: string): any {
    return this.task?.custom_fields?.[key] || '—';
  }
}

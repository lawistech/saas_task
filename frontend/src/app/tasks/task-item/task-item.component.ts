import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-item.component.html',
  styleUrl: './task-item.component.scss'
})
export class TaskItemComponent {
  @Input() task!: Task;
  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();

  isExpanded = false;
  isDeleting = false;

  constructor(private taskService: TaskService) {}

  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
  }

  onEdit(): void {
    this.edit.emit();
  }

  onDelete(): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.isDeleting = true;
      this.taskService.deleteTask(this.task.id).subscribe({
        next: () => {
          this.isDeleting = false;
          this.delete.emit();
        },
        error: (error) => {
          console.error('Error deleting task', error);
          this.isDeleting = false;
        }
      });
    }
  }

  updateStatus(status: 'pending' | 'in_progress' | 'completed'): void {
    this.taskService.updateTask(this.task.id, { status }).subscribe({
      next: (response) => {
        this.task = response.task;
      },
      error: (error) => {
        console.error('Error updating task status', error);
      }
    });
  }

  getStatusClass(): string {
    switch (this.task.status) {
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

  getPriorityClass(): string {
    switch (this.task.priority) {
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

  getCustomFieldsKeys(): string[] {
    if (!this.task.custom_fields) return [];
    return Object.keys(this.task.custom_fields);
  }
}

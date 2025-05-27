import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task';
import { TaskService } from '../../services/task.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-task-pipeline',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-pipeline.component.html',
  styleUrl: './task-pipeline.component.scss'
})
export class TaskPipelineComponent implements OnInit, OnChanges {
  @Input() tasks: Task[] = [];
  @Output() editTask = new EventEmitter<Task>();
  @Output() deleteTask = new EventEmitter<number>();
  @Output() taskStatusChanged = new EventEmitter<Task>();
  @Output() viewTaskDetails = new EventEmitter<Task>();

  groupedTasks: Record<string, Task[]> = {};
  statusLabels: Record<string, string> = {
    'not_started': 'Not Started',
    'pending': 'To Do',
    'in_progress': 'In Progress',
    'in_review': 'In Review',
    'completed': 'Completed',
    'done': 'Done'
  };

  statusOrder: string[] = ['not_started', 'pending', 'in_progress', 'in_review', 'completed', 'done'];
  draggedTask: Task | null = null;
  selectedTask: Task | null = null;

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.groupTasksByStatus();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tasks']) {
      this.groupTasksByStatus();
    }
  }

  groupTasksByStatus(): void {
    this.groupedTasks = {};

    // Initialize all status groups even if empty
    this.statusOrder.forEach(status => {
      this.groupedTasks[status] = [];
    });

    // Group tasks by status
    this.tasks.forEach(task => {
      const status = task.status;
      if (!this.groupedTasks[status]) {
        this.groupedTasks[status] = [];
      }
      this.groupedTasks[status].push(task);
    });
  }

  onEditTask(task: Task): void {
    this.editTask.emit(task);
  }

  onDeleteTask(taskId: number): void {
    this.deleteTask.emit(taskId);
  }

  onViewTaskDetails(task: Task): void {
    // Emit event to parent component to handle unified modal
    this.viewTaskDetails.emit(task);
  }

  closeTaskDetails(): void {
    this.selectedTask = null;
  }

  getCustomFields(task: Task): { label: string; value: any }[] {
    if (!task.custom_fields) return [];

    return Object.entries(task.custom_fields).map(([key, value]) => ({
      label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: value
    }));
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'not_started': return 'status-not-started';
      case 'pending': return 'status-pending';
      case 'in_progress': return 'status-in-progress';
      case 'in_review': return 'status-in-review';
      case 'completed': return 'status-completed';
      case 'done': return 'status-done';
      default: return '';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'low': return 'priority-low';
      case 'medium': return 'priority-medium';
      case 'high': return 'priority-high';
      default: return '';
    }
  }

  getStageClass(stage: string): string {
    switch (stage) {
      case 'Planning': return 'stage-planning';
      case 'Development': return 'stage-development';
      case 'Testing': return 'stage-testing';
      case 'Review': return 'stage-review';
      case 'Deployed': return 'stage-deployed';
      default: return '';
    }
  }



  // Drag and drop functionality
  onDragStart(event: DragEvent, task: Task): void {
    this.draggedTask = task;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', task.id.toString());
    }
  }

  onDragOver(event: DragEvent, status: string): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent, status: string): void {
    event.preventDefault();
    if (this.draggedTask && this.draggedTask.status !== status) {
      const updatedTask: Partial<Task> = {
        ...this.draggedTask,
        status: status as 'pending' | 'in_progress' | 'completed' | 'not_started' | 'in_review' | 'done'
      };

      // Update stage based on status
      if (status === 'completed' || status === 'done') {
        updatedTask.stage = 'Deployed';
      } else if (status === 'in_progress') {
        updatedTask.stage = 'Development';
      } else if (status === 'in_review') {
        updatedTask.stage = 'Review';
      } else if (status === 'pending') {
        updatedTask.stage = 'Planning';
      } else if (status === 'not_started') {
        updatedTask.stage = 'Lead';
      }

      this.taskService.updateTask(this.draggedTask.id, updatedTask).subscribe({
        next: () => {
          this.taskStatusChanged.emit(updatedTask as Task);
        },
        error: (error) => {
          console.error('Error updating task status', error);
        }
      });
    }
    this.draggedTask = null;
  }

  onDragEnd(): void {
    this.draggedTask = null;
  }

  // Helper methods for template
  getInitials(name: string): string {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().substring(0, 2);
  }

  getAssigneeColor(name: string): string {
    const colors = [
      'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-amber-500', 'bg-red-500', 'bg-teal-500',
      'bg-cyan-500', 'bg-violet-500', 'bg-rose-500', 'bg-orange-500'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      const char = name.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  formatDate(date: string | null): string {
    if (!date) return 'No date';
    return new Date(date).toLocaleDateString();
  }

  isOverdue(dueDate: string | null): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }

  isDueSoon(dueDate: string | null): boolean {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
  }
}

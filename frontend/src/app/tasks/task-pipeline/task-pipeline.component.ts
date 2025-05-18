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

  groupedTasks: Record<string, Task[]> = {};
  statusLabels: Record<string, string> = {
    'pending': 'To Do',
    'in_progress': 'In Progress',
    'completed': 'Completed'
  };

  statusOrder: string[] = ['pending', 'in_progress', 'completed'];
  draggedTask: Task | null = null;

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

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'in_progress': return 'status-in-progress';
      case 'completed': return 'status-completed';
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
        status: status as 'pending' | 'in_progress' | 'completed'
      };

      // If status is completed and stage is not set to Deployed, update it
      if (status === 'completed' && updatedTask.stage !== 'Deployed') {
        updatedTask.stage = 'Deployed';
      }

      // If status is in_progress and stage is not set to Development, update it
      if (status === 'in_progress' && updatedTask.stage !== 'Development') {
        updatedTask.stage = 'Development';
      }

      // If status is pending and stage is not set to Planning, update it
      if (status === 'pending' && updatedTask.stage !== 'Planning') {
        updatedTask.stage = 'Planning';
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
}

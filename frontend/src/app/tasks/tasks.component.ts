import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskListComponent } from './task-list/task-list.component';
import { TaskFormComponent } from './task-form/task-form.component';
import { TaskPipelineComponent } from './task-pipeline/task-pipeline.component';
import { Task } from '../models/task';
import { TaskService } from '../services/task.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, TaskListComponent, TaskFormComponent, TaskPipelineComponent],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss'
})
export class TasksComponent implements OnInit {
  tasks: Task[] = [];
  isLoading = false;
  showTaskForm = false;
  selectedTask: Task | null = null;
  activeFilter: string | null = null;
  viewMode: 'list' | 'pipeline' = 'list';

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(status?: string): void {
    this.isLoading = true;
    this.activeFilter = status || null;

    if (this.viewMode === 'pipeline') {
      this.taskService.getPipelineTasks().subscribe({
        next: (groupedTasks) => {
          // Flatten the grouped tasks into a single array
          this.tasks = Object.values(groupedTasks).flat();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading tasks', error);
          this.isLoading = false;
        }
      });
    } else {
      this.taskService.getTasks(status).subscribe({
        next: (tasks) => {
          this.tasks = tasks as Task[];
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading tasks', error);
          this.isLoading = false;
        }
      });
    }
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'list' ? 'pipeline' : 'list';
    this.loadTasks(this.activeFilter || undefined);
  }

  openTaskForm(task?: Task): void {
    this.selectedTask = task || null;
    this.showTaskForm = true;
  }

  closeTaskForm(): void {
    this.showTaskForm = false;
    this.selectedTask = null;
  }

  onTaskSaved(): void {
    this.closeTaskForm();
    this.loadTasks(this.activeFilter || undefined);
  }

  onTaskDeleted(taskId: number): void {
    this.taskService.deleteTask(taskId).subscribe({
      next: () => {
        this.loadTasks(this.activeFilter || undefined);
      },
      error: (error) => {
        console.error('Error deleting task', error);
      }
    });
  }

  onTaskStatusChanged(task: Task): void {
    // Refresh the task list
    this.loadTasks(this.activeFilter || undefined);
  }
}

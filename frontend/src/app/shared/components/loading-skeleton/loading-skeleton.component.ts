import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="animate-pulse">
      <!-- Table Header Skeleton -->
      <div *ngIf="type === 'table'" class="mb-4">
        <div class="flex justify-between items-center mb-4">
          <div class="h-8 bg-gray-200 rounded w-48"></div>
          <div class="h-8 bg-gray-200 rounded w-32"></div>
        </div>
        
        <!-- Table skeleton -->
        <div class="border border-gray-200 rounded-lg overflow-hidden">
          <!-- Header row -->
          <div class="bg-gray-50 border-b border-gray-200 p-4">
            <div class="flex gap-4">
              <div class="h-4 bg-gray-200 rounded w-8"></div>
              <div class="h-4 bg-gray-200 rounded w-32"></div>
              <div class="h-4 bg-gray-200 rounded w-24"></div>
              <div class="h-4 bg-gray-200 rounded w-20"></div>
              <div class="h-4 bg-gray-200 rounded w-28"></div>
              <div class="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
          
          <!-- Data rows -->
          <div *ngFor="let item of skeletonRows" class="border-b border-gray-200 p-4 last:border-b-0">
            <div class="flex gap-4 items-center">
              <div class="h-4 w-4 bg-gray-200 rounded"></div>
              <div class="h-4 bg-gray-200 rounded w-32"></div>
              <div class="h-3 bg-gray-200 rounded w-20"></div>
              <div class="h-3 bg-gray-200 rounded w-16"></div>
              <div class="h-3 bg-gray-200 rounded w-24"></div>
              <div class="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Grid Skeleton -->
      <div *ngIf="type === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div *ngFor="let item of skeletonRows" class="bg-white border border-gray-200 rounded-lg p-6">
          <div class="flex justify-between items-start mb-4">
            <div class="h-6 bg-gray-200 rounded w-3/4"></div>
            <div class="flex gap-2">
              <div class="h-4 w-4 bg-gray-200 rounded"></div>
              <div class="h-4 w-4 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div class="h-4 bg-gray-200 rounded w-16 mb-4"></div>
          <div class="space-y-2 mb-4">
            <div class="h-3 bg-gray-200 rounded w-full"></div>
            <div class="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
          <div class="space-y-2">
            <div class="h-3 bg-gray-200 rounded w-1/2"></div>
            <div class="h-3 bg-gray-200 rounded w-1/3"></div>
            <div class="h-3 bg-gray-200 rounded w-2/5"></div>
          </div>
        </div>
      </div>

      <!-- Simple skeleton for other components -->
      <div *ngIf="type === 'simple'" class="space-y-3">
        <div *ngFor="let item of skeletonRows" class="h-4 bg-gray-200 rounded" [style.width.%]="getRandomWidth()"></div>
      </div>
    </div>
  `,
  styles: [`
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: .5;
      }
    }
  `]
})
export class LoadingSkeletonComponent {
  @Input() type: 'table' | 'grid' | 'simple' = 'simple';
  @Input() rows: number = 5;

  get skeletonRows(): number[] {
    return Array(this.rows).fill(0).map((_, i) => i);
  }

  getRandomWidth(): number {
    const widths = [60, 70, 80, 90, 100];
    return widths[Math.floor(Math.random() * widths.length)];
  }
}

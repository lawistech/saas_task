import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SalesPipelineComponent } from './sales-pipeline/sales-pipeline.component';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, RouterModule, SalesPipelineComponent],
  template: `
    <div class="sales-container">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .sales-container {
      padding: 20px;
      height: 100%;
    }
  `]
})
export class SalesComponent {
  
}

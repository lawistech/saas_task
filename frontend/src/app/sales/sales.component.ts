import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, RouterModule],
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

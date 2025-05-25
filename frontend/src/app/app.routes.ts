import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProfileComponent } from './profile/profile.component';
import { LayoutComponent } from './layout/layout.component';
import { TasksComponent } from './tasks/tasks.component';
import { ProjectsComponent } from './projects/projects.component';
import { ProjectDetailsComponent } from './projects/project-details/project-details.component';
import { SalesComponent } from './sales/sales.component';
import { SalesPipelineComponent } from './sales/sales-pipeline/sales-pipeline.component';

import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },

  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'tasks', component: TasksComponent },
      { path: 'projects', component: ProjectsComponent },
      { path: 'projects/:id', component: ProjectDetailsComponent },
      {
        path: 'sales',
        component: SalesComponent,
        children: [
          { path: '', redirectTo: 'pipeline', pathMatch: 'full' },
          { path: 'pipeline', component: SalesPipelineComponent }
        ]
      }
    ]
  },
  { path: '**', redirectTo: '/login' }
];

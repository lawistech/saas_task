import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  submitted = false;
  errorMessage = '';
  successMessage = '';
  isLoading = false;
  showPassword = false;
  returnUrl = '/dashboard';
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check for success message from registration and store return URL first
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['registered']) {
          this.successMessage = 'Registration successful! Please sign in to continue.';
        }
        if (params['reset']) {
          this.successMessage = 'Password reset successful! Please sign in with your new password.';
        }
        // Store return URL for redirect after login
        this.returnUrl = params['returnUrl'] || '/dashboard';
        console.log('LoginComponent: Return URL set to:', this.returnUrl);
      });

    // Check if user is already authenticated
    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuthenticated => {
        if (isAuthenticated) {
          console.log('LoginComponent: User already authenticated, redirecting to:', this.returnUrl);
          this.router.navigate([this.returnUrl]);
        }
      });

    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;

    const loginData = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
      remember: this.loginForm.value.rememberMe
    };

    this.authService.login(loginData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Login successful! Redirecting...';
          console.log('LoginComponent: Login successful, redirecting to:', this.returnUrl);

          // Navigate immediately after successful login
          this.router.navigate([this.returnUrl]).then((navigationSuccess) => {
            if (navigationSuccess) {
              console.log('LoginComponent: Navigation successful to:', this.returnUrl);
            } else {
              console.warn('LoginComponent: Navigation failed, trying fallback');
              // Fallback navigation to dashboard
              this.router.navigate(['/dashboard']).then(() => {
                console.log('LoginComponent: Fallback navigation to dashboard successful');
              }).catch(fallbackError => {
                console.error('LoginComponent: Fallback navigation also failed:', fallbackError);
              });
            }
          }).catch(error => {
            console.error('LoginComponent: Navigation error:', error);
            // Fallback navigation
            this.router.navigate(['/dashboard']).then(() => {
              console.log('LoginComponent: Fallback navigation to dashboard successful');
            }).catch(fallbackError => {
              console.error('LoginComponent: Fallback navigation also failed:', fallbackError);
            });
          });
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = this.getErrorMessage(error);
          console.error('LoginComponent: Login error:', error);
        }
      });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  private getErrorMessage(error: any): string {
    console.error('Login error details:', error);

    if (error.error?.message) {
      return error.error.message;
    }

    if (error.status === 401) {
      return 'Invalid email or password. Please try again.';
    }

    if (error.status === 422 && error.error?.errors) {
      const errors = error.error.errors;
      const firstError = Object.values(errors)[0] as string[];
      return firstError[0] || 'Validation error occurred.';
    }

    if (error.status === 0) {
      return 'Unable to connect to server. Please check your internet connection and ensure the backend is running.';
    }

    if (error.status === 500) {
      return 'Server error occurred. Please try again later.';
    }

    return `Login failed: ${error.message || 'Unknown error'}. Please try again.`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

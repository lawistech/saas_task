import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  submitted = false;
  errorMessage = '';
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if user is already authenticated
    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.router.navigate(['/dashboard']);
      }
    });

    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  // Custom validator for password confirmation
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    } else {
      // Clear the mismatch error if passwords match
      const errors = confirmPassword.errors;
      if (errors) {
        delete errors['mismatch'];
        confirmPassword.setErrors(Object.keys(errors).length ? errors : null);
      }
    }

    return null;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  getPasswordStrengthWidth(): number {
    const password = this.registerForm.get('password')?.value || '';
    let strength = 0;

    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^A-Za-z0-9]/.test(password)) strength += 12.5;

    return Math.min(strength, 100);
  }

  getPasswordStrengthClass(): string {
    const width = this.getPasswordStrengthWidth();
    if (width < 25) return 'bg-red-500';
    if (width < 50) return 'bg-orange-500';
    if (width < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  getPasswordStrengthText(): string {
    const width = this.getPasswordStrengthWidth();
    if (width < 25) return 'Weak password';
    if (width < 50) return 'Fair password';
    if (width < 75) return 'Good password';
    return 'Strong password';
  }

  getPasswordStrengthTextClass(): string {
    const width = this.getPasswordStrengthWidth();
    if (width < 25) return 'text-red-600';
    if (width < 50) return 'text-orange-600';
    if (width < 75) return 'text-yellow-600';
    return 'text-green-600';
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.registerForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;

    const registerData = {
      name: this.registerForm.value.name,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      password_confirmation: this.registerForm.value.confirmPassword
    };

    this.authService.register(registerData).subscribe({
      next: () => {
        this.isLoading = false;
        // Redirect to login with success message
        this.router.navigate(['/login'], {
          queryParams: { registered: 'true' }
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(error);
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  private getErrorMessage(error: any): string {
    if (error.error?.message) {
      return error.error.message;
    }

    if (error.status === 422 && error.error?.errors) {
      const errors = error.error.errors;

      // Handle specific validation errors
      if (errors.email) {
        return errors.email[0];
      }
      if (errors.password) {
        return errors.password[0];
      }
      if (errors.name) {
        return errors.name[0];
      }

      // Return first error if no specific field error found
      const firstError = Object.values(errors)[0] as string[];
      return firstError[0] || 'Validation error occurred.';
    }

    if (error.status === 0) {
      return 'Unable to connect to server. Please check your internet connection.';
    }

    return 'Registration failed. Please try again.';
  }
}

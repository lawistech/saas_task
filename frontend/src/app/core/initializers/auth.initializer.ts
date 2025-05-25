import { inject } from '@angular/core';
import { AuthService } from '../../auth/auth.service';

export function initializeAuth() {
  return () => {
    const authService = inject(AuthService);
    
    // Initialize authentication state
    authService.initializeAuth();
    
    return Promise.resolve();
  };
}

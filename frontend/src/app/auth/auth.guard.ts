import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { of } from 'rxjs';
import { map, take, switchMap, catchError } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('AuthGuard: Checking authentication for route:', state.url);

  // First check if we have a token
  if (!authService.getToken()) {
    console.log('AuthGuard: No token found, redirecting to login');
    // No token, redirect to login
    const returnUrl = state.url;
    router.navigate(['/login'], {
      queryParams: { returnUrl: returnUrl !== '/' ? returnUrl : '/dashboard' }
    });
    return false;
  }

  // Check if user is already authenticated (avoid unnecessary server calls)
  return authService.isAuthenticated$.pipe(
    take(1),
    switchMap(isAuthenticated => {
      if (isAuthenticated) {
        console.log('AuthGuard: User already authenticated, allowing access');
        return of(true);
      }

      console.log('AuthGuard: Validating token with server');
      // We have a token but auth state is false, validate it with the server
      return authService.validateToken().pipe(
        map(() => {
          console.log('AuthGuard: Token validation successful');
          return true;
        }),
        catchError((error) => {
          console.log('AuthGuard: Token validation failed:', error);
          // Token is invalid, redirect to login
          const returnUrl = state.url;
          router.navigate(['/login'], {
            queryParams: { returnUrl: returnUrl !== '/' ? returnUrl : '/dashboard' }
          });
          return of(false);
        })
      );
    })
  );
};

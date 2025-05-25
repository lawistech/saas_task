import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { of } from 'rxjs';
import { map, take, switchMap, catchError } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // First check if we have a token
  if (!authService.getToken()) {
    // No token, redirect to login
    const returnUrl = state.url;
    router.navigate(['/login'], {
      queryParams: { returnUrl: returnUrl !== '/' ? returnUrl : '/dashboard' }
    });
    return false;
  }

  // We have a token, validate it with the server
  return authService.validateToken().pipe(
    map(() => {
      // Token is valid
      return true;
    }),
    catchError(() => {
      // Token is invalid, redirect to login
      const returnUrl = state.url;
      router.navigate(['/login'], {
        queryParams: { returnUrl: returnUrl !== '/' ? returnUrl : '/dashboard' }
      });
      return of(false);
    }),
    take(1)
  );
};

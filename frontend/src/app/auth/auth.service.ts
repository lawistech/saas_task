import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private baseUrl = environment.apiUrl.replace('/api', '');
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';
  private isBrowser: boolean;

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    // Initialize the subjects only if in browser environment
    if (this.isBrowser) {
      // Initialize authentication state immediately
      const hasToken = this.hasToken();
      const user = this.getUser();

      this.isAuthenticatedSubject.next(hasToken && !!user);
      this.currentUserSubject.next(user);

      console.log('AuthService: Initial auth state:', { hasToken, hasUser: !!user });
    }
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData).pipe(
      tap((response: any) => {
        if (response.user && response.user.profile_picture && response.user.profile_picture.startsWith('/storage/')) {
          response.user.profile_picture = this.baseUrl + response.user.profile_picture;
        }

        this.setToken(response.token);
        this.setUser(response.user);
        this.isAuthenticatedSubject.next(true);
        this.currentUserSubject.next(response.user);
      })
    );
  }

  login(credentials: any): Observable<any> {
    console.log('AuthService: Attempting login with:', { email: credentials.email });
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        console.log('AuthService: Login successful, response:', response);

        // Validate response structure
        if (!response.token || !response.user) {
          throw new Error('Invalid response structure from server');
        }

        // Fix profile picture URL if it's relative
        if (response.user && response.user.profile_picture && response.user.profile_picture.startsWith('/storage/')) {
          response.user.profile_picture = this.baseUrl + response.user.profile_picture;
        }

        // Set authentication data immediately
        this.setToken(response.token);
        this.setUser(response.user);

        // Update authentication state immediately for faster redirect
        this.isAuthenticatedSubject.next(true);
        this.currentUserSubject.next(response.user);
        console.log('AuthService: Authentication state updated successfully');
      }),
      tap({
        error: (error) => {
          console.error('AuthService: Login failed with error:', error);
          // Clear any existing auth data on login failure
          this.clearAuth();
        }
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        console.log('AuthService: Logout successful');
        this.clearAuth();
      }),
      tap({
        error: (error) => {
          console.error('AuthService: Logout failed, clearing auth anyway:', error);
          // Clear auth even if logout request fails
          this.clearAuth();
        }
      })
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, email: string, password: string, passwordConfirmation: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, {
      token,
      email,
      password,
      password_confirmation: passwordConfirmation
    });
  }

  clearAuth(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    }
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }
    return localStorage.getItem(this.tokenKey);
  }

  private setToken(token: string): void {
    if (this.isBrowser) {
      localStorage.setItem(this.tokenKey, token);
    }
  }

  private getUser(): any {
    if (!this.isBrowser) {
      return null;
    }
    const user = localStorage.getItem(this.userKey);
    if (!user) return null;

    const parsedUser = JSON.parse(user);

    // Fix profile picture URL if it's relative
    if (parsedUser && parsedUser.profile_picture && parsedUser.profile_picture.startsWith('/storage/')) {
      parsedUser.profile_picture = this.baseUrl + parsedUser.profile_picture;
    }

    return parsedUser;
  }

  private setUser(user: any): void {
    if (this.isBrowser) {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    }
  }

  private hasToken(): boolean {
    return !!this.getToken();
  }

  updateCurrentUser(user: any): void {
    // Fix profile picture URL if it's relative
    if (user && user.profile_picture && user.profile_picture.startsWith('/storage/')) {
      user.profile_picture = this.baseUrl + user.profile_picture;
    }

    this.setUser(user);
    this.currentUserSubject.next(user);
  }

  /**
   * Validate current token by making a request to get user info
   */
  validateToken(): Observable<any> {
    if (!this.hasToken()) {
      return new Observable(observer => {
        observer.error('No token available');
      });
    }

    return this.http.get(`${this.apiUrl}/user`).pipe(
      tap((user: any) => {
        console.log('AuthService: Token validation successful');
        this.updateCurrentUser(user);
        this.isAuthenticatedSubject.next(true);
      }),
      tap({
        error: (error) => {
          console.error('AuthService: Token validation failed:', error);
          this.clearAuth();
        }
      })
    );
  }

  /**
   * Check if user is authenticated and token is valid
   */
  checkAuthStatus(): void {
    if (this.isBrowser && this.hasToken()) {
      this.validateToken().subscribe({
        next: () => {
          // Token is valid, user is authenticated
        },
        error: () => {
          // Token is invalid, clear auth
          this.clearAuth();
        }
      });
    } else if (this.isBrowser) {
      // No token, ensure auth state is cleared
      this.clearAuth();
    }
  }

  /**
   * Initialize authentication state on app startup
   */
  initializeAuth(): void {
    if (this.isBrowser) {
      const token = this.getToken();
      const user = this.getUser();

      console.log('AuthService: Initializing auth state', { hasToken: !!token, hasUser: !!user });

      if (token && user) {
        // We have stored auth data, validate it
        this.validateToken().subscribe({
          next: () => {
            console.log('AuthService: Existing session validated successfully');
          },
          error: () => {
            console.log('AuthService: Existing session invalid, clearing auth data');
            this.clearAuth();
          }
        });
      } else {
        // No stored auth data, ensure clean state
        console.log('AuthService: No existing session, clearing auth state');
        this.clearAuth();
      }
    }
  }
}

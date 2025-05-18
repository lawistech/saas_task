import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api';
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
      this.isAuthenticatedSubject.next(this.hasToken());
      this.currentUserSubject.next(this.getUser());
    }
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData).pipe(
      tap((response: any) => {
        if (response.user && response.user.profile_picture && response.user.profile_picture.startsWith('/storage/')) {
          response.user.profile_picture = 'http://localhost:8000' + response.user.profile_picture;
        }

        this.setToken(response.token);
        this.setUser(response.user);
        this.isAuthenticatedSubject.next(true);
        this.currentUserSubject.next(response.user);
      })
    );
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        if (response.user && response.user.profile_picture && response.user.profile_picture.startsWith('/storage/')) {
          response.user.profile_picture = 'http://localhost:8000' + response.user.profile_picture;
        }

        this.setToken(response.token);
        this.setUser(response.user);
        this.isAuthenticatedSubject.next(true);
        this.currentUserSubject.next(response.user);
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.clearAuth();
      })
    );
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
      parsedUser.profile_picture = 'http://localhost:8000' + parsedUser.profile_picture;
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
      user.profile_picture = 'http://localhost:8000' + user.profile_picture;
    }

    this.setUser(user);
    this.currentUserSubject.next(user);
  }
}

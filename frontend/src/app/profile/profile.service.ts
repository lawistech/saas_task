import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = environment.apiUrl;
  private baseUrl = environment.apiUrl.replace('/api', '');

  private profileSubject = new BehaviorSubject<any>(null);
  public profile$ = this.profileSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Initialize profile from current user if available
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.profileSubject.next(user);
      }
    });
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`).pipe(
      tap((profile: any) => {
        // Check if profile picture path is relative and convert to absolute URL if needed
        if (profile && profile.profile_picture && profile.profile_picture.startsWith('/storage/')) {
          profile.profile_picture = this.baseUrl + profile.profile_picture;
          console.log('Converted profile picture path to absolute URL:', profile.profile_picture);
        }

        this.profileSubject.next(profile);
      })
    );
  }

  updateProfile(profileData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/profile`, profileData).pipe(
      tap((response: any) => {
        if (response.user) {
          // Check if profile picture path is relative and convert to absolute URL if needed
          if (response.user.profile_picture && response.user.profile_picture.startsWith('/storage/')) {
            response.user.profile_picture = this.baseUrl + response.user.profile_picture;
            console.log('Converted profile picture path to absolute URL:', response.user.profile_picture);
          }

          this.profileSubject.next(response.user);
          // Also update the user in auth service
          this.authService.updateCurrentUser(response.user);
        }
      })
    );
  }

  uploadProfilePicture(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('profile_picture', file);

    return this.http.post(`${this.apiUrl}/profile/picture`, formData).pipe(
      tap((response: any) => {
        if (response && response.path) {
          let profilePicturePath = response.path;

          // If the path is relative (starts with /storage), make it absolute
          if (profilePicturePath.startsWith('/storage/')) {
            profilePicturePath = this.baseUrl + profilePicturePath;
            console.log('Converted relative path to absolute URL:', profilePicturePath);
          }

          const updatedUser = { ...this.profileSubject.value, profile_picture: profilePicturePath };
          this.profileSubject.next(updatedUser);
          // Also update the user in auth service
          this.authService.updateCurrentUser(updatedUser);

          // Log successful update for debugging
          console.log('Profile picture updated:', profilePicturePath);
        } else {
          console.error('Invalid response from server:', response);
        }
      })
    );
  }
}

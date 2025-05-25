import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProfileService } from './profile.service';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  user: any = null;
  isEditing = false;
  isSaving = false;
  isUploading = false;
  errorMessage = '';
  successMessage = '';
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  profileForm!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private profileService: ProfileService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();

    this.authService.currentUser$.subscribe(user => {
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }

      this.user = user;
      this.resetForm();

      // Load the full profile from the API
      this.profileService.getProfile().subscribe({
        error: (error) => {
          this.errorMessage = error.error.message || 'Failed to load profile';
        }
      });
    });

    this.profileService.profile$.subscribe(profile => {
      if (profile) {
        this.user = profile;
        this.resetForm();
      }
    });
  }

  initializeForm(): void {
    this.profileForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      bio: [''],
      phone: [''],
      address: ['']
    });
  }

  resetForm(): void {
    if (this.user) {
      this.profileForm.patchValue({
        name: this.user.name || '',
        email: this.user.email || '',
        bio: this.user.bio || '',
        phone: this.user.phone || '',
        address: this.user.address || ''
      });
    }
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.resetForm();
    }
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Alias for template compatibility
  toggleEditMode(): void {
    this.toggleEdit();
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.profileService.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.isSaving = false;
        this.isEditing = false;
        this.successMessage = 'Profile updated successfully';
      },
      error: (error) => {
        this.isSaving = false;
        this.errorMessage = error.error.message || 'Failed to update profile';
      }
    });
  }

  // Alias for template compatibility
  onSubmit(): void {
    this.saveProfile();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      // Create a preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  uploadImage(): void {
    if (!this.selectedFile) {
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.profileService.uploadProfilePicture(this.selectedFile).subscribe({
      next: (response) => {
        this.isUploading = false;
        this.selectedFile = null;
        this.imagePreview = null;
        this.successMessage = 'Profile picture updated successfully';

        // Make sure the user object is updated with the new profile picture path
        if (response && response.path) {
          this.user = { ...this.user, profile_picture: response.path };
        }
      },
      error: (error) => {
        this.isUploading = false;
        this.errorMessage = error.error.message || 'Failed to upload profile picture';
      }
    });
  }

  // Alias for template compatibility
  uploadProfilePicture(): void {
    this.uploadImage();
  }

  // Property aliases for template compatibility
  get imagePreviewUrl(): string | null {
    return this.imagePreview;
  }

  get uploading(): boolean {
    return this.isUploading;
  }

  get saving(): boolean {
    return this.isSaving;
  }

  cancelUpload(): void {
    this.selectedFile = null;
    this.imagePreview = null;
  }

  handleImageError(event: Event): void {
    // If the profile picture fails to load, set to default avatar
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/default-avatar.svg';

    // If this is happening because the path is wrong, we can log an error
    console.error('Failed to load profile picture:', this.user.profile_picture);

    // If the profile picture URL is relative (starts with /storage),
    // it might be because the backend URL is not accessible from the frontend
    if (this.user.profile_picture && this.user.profile_picture.startsWith('/storage/')) {
      // Try to fix it by prepending the backend URL
      const baseUrl = environment.apiUrl.replace('/api', '');
      const fixedUrl = baseUrl + this.user.profile_picture;
      console.log('Attempting to fix profile picture URL:', fixedUrl);

      // Update the user object with the fixed URL
      this.user = { ...this.user, profile_picture: fixedUrl };

      // Don't update the image element directly as it will trigger another error event
      // The binding will update it automatically
    }
  }
}

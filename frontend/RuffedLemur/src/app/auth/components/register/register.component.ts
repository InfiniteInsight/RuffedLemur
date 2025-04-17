// src/app/auth/components/register/register.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { passwordStrengthValidator } from '../../validators/password-strength.validator';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatProgressBarModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  error = '';
  passwordVisible = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    // Redirect if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
    }

    this.registerForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        passwordStrengthValidator()
      ]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {}

  // Custom validator to check if password and confirm password match
  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      formGroup.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      return null;
    }
  }

  getPasswordStrength(): number {
    const password = this.registerForm.get('password')?.value;

    if (!password) {
      return 0;
    }

    // Check length
    const hasMinLength = password.length >= 8;

    // Check for uppercase letter
    const hasUppercase = /[A-Z]/.test(password);

    // Check for lowercase letter
    const hasLowercase = /[a-z]/.test(password);

    // Check for number
    const hasNumber = /[0-9]/.test(password);

    // Check for special character
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    // Calculate strength score (0-5)
    return [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecialChar]
      .filter(Boolean).length;
  }

  getPasswordStrengthColor(): string {
    const strength = this.getPasswordStrength();

    if (strength <= 1) return 'warn'; // Red
    if (strength <= 3) return 'accent'; // Orange/Yellow
    return 'primary'; // Green/Blue
  }

  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();

    if (strength <= 1) return 'Weak';
    if (strength <= 3) return 'Medium';
    return 'Strong';
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    // Extract form values
    const { username, email, password } = this.registerForm.value;

    // Call registration service
    this.authService.register({ username, email, password })
      .subscribe({
        next: () => {
          this.router.navigate(['/auth/login'], {
            queryParams: { registered: 'true' }
          });
        },
        error: err => {
          this.error = err.message || 'Registration failed';
          this.loading = false;
        }
      });
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }
}

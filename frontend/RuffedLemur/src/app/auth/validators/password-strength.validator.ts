// src/app/auth/validators/password-strength.validator.ts

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    // Check length
    const hasMinLength = value.length >= 8;

    // Check for uppercase letter
    const hasUppercase = /[A-Z]/.test(value);

    // Check for lowercase letter
    const hasLowercase = /[a-z]/.test(value);

    // Check for number
    const hasNumber = /[0-9]/.test(value);

    // Check for special character
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    // Calculate strength score
    const strengthScore = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecialChar]
      .filter(Boolean).length;

    // Return validation errors based on score
    if (strengthScore < 3) {
      return {
        passwordStrength: {
          required: 3,
          current: strengthScore,
          hasMinLength,
          hasUppercase,
          hasLowercase,
          hasNumber,
          hasSpecialChar
        }
      };
    }

    return null;
  };
}

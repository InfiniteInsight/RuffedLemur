import { Injectable } from '@angular/core';
import { AbstractControl, FormGroup, FormArray, ValidationErrors } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class FormValidationService {

  /**
   * Marks all controls in a form group as touched
   */
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }

      if (control instanceof FormArray) {
        for (let i = 0; i < control.length; i++) {
          if (control.at(i) instanceof FormGroup) {
            this.markFormGroupTouched(control.at(i) as FormGroup);
          } else {
            control.at(i).markAsTouched();
          }
        }
      }
    });
  }

  /**
   * Get all validation errors from a form group
   */
  getFormValidationErrors(formGroup: FormGroup): { [key: string]: string } {
    const result: { [key: string]: string } = {};

    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);

      if (control instanceof FormGroup) {
        const nestedErrors = this.getFormValidationErrors(control);
        Object.keys(nestedErrors).forEach(nestedKey => {
          result[`${key}.${nestedKey}`] = nestedErrors[nestedKey];
        });
      } else if (control && control.errors) {
        Object.keys(control.errors).forEach(errorKey => {
          result[key] = this.getValidationErrorMessage(errorKey, control.errors?.[errorKey]);
        });
      }
    });

    return result;
  }

  /**
   * Get user-friendly error message for validation errors
   */
  getValidationErrorMessage(validatorName: string, validatorValue?: any): string {
    const messages: { [key: string]: string } = {
      required: 'This field is required',
      email: 'Please enter a valid email address',
      minlength: `Minimum length ${validatorValue?.requiredLength}`,
      maxlength: `Maximum length ${validatorValue?.requiredLength}`,
      min: `Minimum value ${validatorValue?.min}`,
      max: `Maximum value ${validatorValue?.max}`,
      pattern: 'Invalid format',
      whitespace: 'This field cannot be empty',
      mustMatch: 'Fields do not match',
      invalidUrl: 'Please enter a valid URL',
      invalidDate: 'Please enter a valid date',
      passwordMismatch: 'Passwords do not match',
      duplicateValue: 'This value already exists'
    };

    return messages[validatorName] || `Validation failed: ${validatorName}`;
  }

  /**
   * Get error message for a specific form control
   */
  getErrorMessage(control: AbstractControl): string {
    if (!control || !control.errors) {
      return '';
    }

    const firstError = Object.keys(control.errors)[0];
    return this.getValidationErrorMessage(firstError, control.errors[firstError]);
  }
}

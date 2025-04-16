// src/app/core/services/error/global-error-handler.service.ts

import { Injectable, ErrorHandler, Injector } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ErrorService } from './error.service';
import { NotificationService } from '../../../notifications/services/notification.service'
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: Error | HttpErrorResponse): void {
    const errorService = this.injector.get(ErrorService);
    const notifier = this.injector.get(NotificationService);
    const router = this.injector.get(Router);
    const authService = this.injector.get(AuthService);

    let message: string;
    let stackTrace: string;
    let errorType: string;

    if (error instanceof HttpErrorResponse) {
      // Server error
      errorType = 'Server Error';

      // Handle different HTTP status codes
      switch (error.status) {
        case 401:
          message = 'You are not authorized to access this resource. Please log in again.';
          // Log user out and redirect to login page
          authService.logout();
          router.navigate(['/auth/login']);
          break;
        case 403:
          message = 'You do not have permission to perform this action.';
          break;
        case 404:
          message = 'The requested resource was not found.';
          break;
        case 422:
          // Validation errors from backend
          if (error.error && error.error.errors) {
            message = this.formatValidationErrors(error.error.errors);
          } else {
            message = 'Validation error occurred.';
          }
          break;
        case 500:
          message = 'A server error occurred. Please try again later.';
          break;
        case 0:
          message = 'Server is unavailable. Please check your connection.';
          break;
        default:
          // Try to extract error message from backend
          if (error.error && error.error.message) {
            message = error.error.message;
          } else {
            message = `${error.status}: ${error.statusText || 'Unknown server error'}`;
          }
      }

      stackTrace = error.message;
    } else {
      // Client error
      errorType = 'Client Error';
      message = error.message || 'Unknown client error';
      stackTrace = error.stack || '';
    }

    // Log error to service for potential server-side logging
    errorService.logError({
      type: errorType,
      message: message,
      stackTrace: stackTrace,
      timestamp: new Date()
    });

    // Show user-friendly notification
    notifier.showError(message);
  }

  private formatValidationErrors(errors: any): string {
    if (typeof errors === 'string') {
      return errors;
    }

    if (Array.isArray(errors)) {
      return errors.join(', ');
    }

    if (typeof errors === 'object') {
      const errorMessages = [];
      for (const key in errors) {
        if (errors.hasOwnProperty(key)) {
          errorMessages.push(`${key}: ${errors[key]}`);
        }
      }
      return errorMessages.join(', ');
    }

    return 'Validation error occurred.';
  }
}

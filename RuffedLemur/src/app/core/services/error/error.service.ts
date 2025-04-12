import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, throwError } from 'rxjs';

export interface ErrorDetails {
  message: string;
  technical?: string;
  timestamp: Date;
  path?: string;
  statusCode?: number;
  handled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  private errors: ErrorDetails[] = [];

  constructor(private snackBar: MatSnackBar) { }

   /**
   * Handle and log an error with detailed information
   */
  handleError(error: Error | HttpErrorResponse, context?: string): Observable<never> {
    const errorDetails = this.processError(error, context);

    // Always log to console for debugging
    this.logToConsole(errorDetails);

    // Show user-friendly message in UI
    this.showErrorNotification(errorDetails);

    // Store in error log for potential reporting to backend
    this.errors.push(errorDetails);

    // If there are too many errors, remove older ones
    if (this.errors.length > 1000) {
      this.errors.shift();
    }

    // Return an observable that errors out for proper error propagation
    return throwError(() => errorDetails);
  }

  /**
   * Process different error types to extract useful information
   */
  private processError(error: Error | HttpErrorResponse, context?: string): ErrorDetails {
    const timestamp = new Date();
    let message = 'An unexpected error occurred';
    let technical = '';
    let statusCode: number | undefined;
    let path: string | undefined;

    if (error instanceof HttpErrorResponse) {
      // Handle HTTP errors
      statusCode = error.status;
      path = error.url || undefined;

      // Get appropriate message based on status code
      message = this.getMessageForStatusCode(error.status);

      // Extract technical details
      if (error.error && typeof error.error === 'object') {
        technical = error.error.message || error.message || JSON.stringify(error.error);
      } else {
        technical = error.message;
      }

      // Customize the message if context provided
      if (context) {
        message = `Error ${context}: ${message}`;
      }
    } else {
      // Handle client-side errors
      technical = error.message || String(error);
      if (error.stack) {
        technical += `\nStack: ${error.stack}`;
      }

      if (context) {
        message = `Error in ${context}`;
      }
    }

    return {
      message,
      technical,
      timestamp,
      path,
      statusCode,
      handled: false
    };
  }

  /**
   * Get user-friendly error message based on HTTP status code
   */
  private getMessageForStatusCode(status: number): string {
    switch (status) {
      case 400: return 'The request was invalid or cannot be processed';
      case 401: return 'You need to be logged in to access this resource';
      case 403: return 'You don\'t have permission to access this resource';
      case 404: return 'The requested resource was not found';
      case 409: return 'This request conflicts with the current state';
      case 422: return 'The submitted data failed validation';
      case 429: return 'Too many requests. Please try again later';
      case 500: return 'The server encountered an error. Please try again later';
      case 502:
      case 503:
      case 504: return 'The service is temporarily unavailable. Please try again later';
      default: return 'An unexpected error occurred';
    }
  }

  /**
   * Log error details to console
   */
  private logToConsole(error: ErrorDetails): void {
    console.error('[Error]', error.message);
    if (error.technical) {
      console.error('Technical details:', error.technical);
    }
    if (error.statusCode) {
      console.error(`Status: ${error.statusCode}, Path: ${error.path}`);
    }
  }

  /**
   * Show user-friendly error notification
   */
  private showErrorNotification(error: ErrorDetails): void {
    this.snackBar.open(error.message, 'Dismiss', {
      duration: 5000,
      panelClass: 'error-snackbar'
    });
  }

  /**
   * Get all logged errors
   */
  getErrors(): ErrorDetails[] {
    return [...this.errors];
  }

  /**
   * Clear all logged errors
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Send error logs to backend
   */
  sendErrorsToServer(): Observable<any> {
    const unhandledErrors = this.errors.filter(e => !e.handled);

    // Mark errors as handled
    this.errors.forEach(e => e.handled = true);

    // TO DO: send these to the backend
    console.log('Sending errors to server:', unhandledErrors);

    // TEMPORARY: Return mock response
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({ success: true, count: unhandledErrors.length });
        observer.complete();
      }, 500);
    });
  }
}

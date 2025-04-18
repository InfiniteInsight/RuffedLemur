// src/app/core/services/error/error.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface ErrorEvent {
  operation?: string;
  message: string;
  status?: number;
  url?: string;
  timestamp: string;
  stack?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  private errors = new BehaviorSubject<ErrorEvent[]>([]);
  public errors$ = this.errors.asObservable();

  private maxErrors = 1000; // Maximum number of errors to store in memory

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  /**
   * Log an error and send to the server if configured
   */
  logError(error: ErrorEvent | Error | HttpErrorResponse): void {
    let errorEvent: ErrorEvent;

    // Format error based on type
    if (error instanceof HttpErrorResponse) {
      errorEvent = {
        operation: 'HTTP Request',
        message: error.message,
        status: error.status,
        url: error.url || undefined,
        timestamp: new Date().toISOString()
      };
    } else if (error instanceof Error) {
      errorEvent = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      };
    } else {
      errorEvent = {
        ...error,
        timestamp: error.timestamp || new Date().toISOString()
      };
    }

    // Store error in memory
    const currentErrors = this.errors.value;
    if (currentErrors.length >= this.maxErrors) {
      currentErrors.shift(); // Remove oldest error
    }
    this.errors.next([...currentErrors, errorEvent]);

    // Log error to console
    console.error('Error:', errorEvent);

    // Send to server log if configured
    if (environment.logErrorsToServer) {
      this.sendToServerLog(errorEvent).subscribe({
        next: () => console.log('Error logged to server'),
        error: (err) => console.error('Failed to log error to server', err)
      });
    }
  }

  /**
   * Get recent errors
   */
  getRecentErrors(): ErrorEvent[] {
    return this.errors.value;
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors.next([]);
  }

  /**
   * Send error to server log
   */
  private sendToServerLog(errorData: ErrorEvent): Observable<any> {
    return this.http.post(`${environment.apiUrl}/logs/error`, errorData, {
      headers: { 'X-Background-Request': 'true' } // Don't show loader for error logs
    });
  }

  /**
   * Display error notification to user
   * @param message Error message to display
   * @param operation Optional operation description
   * @param duration Notification duration in milliseconds
   */
  showError(message: string, operation?: string, duration: number = 5000): void {
    const fullMessage = operation ? `${operation}: ${message}` : message;
    this.snackBar.open(fullMessage, 'Close', {
      duration: duration,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'bottom'
    });
  }

  /**
   * Handle error comprehensively - logging and displaying notification
   * @param error The error object
   * @param operation Description of the operation that failed
   */
  handleError(error: any, operation?: string): void {
    // Log the error
    this.logError(error);

    // Extract error message
    let message = 'An error occurred';
    if (error instanceof HttpErrorResponse) {
      message = error.error?.message || error.message || `Status: ${error.status}`;
    } else if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error?.message) {
      message = error.message;
    }

    // Show error notification
    this.showError(message, operation);
    }

    /**
   * Display success notification to user
   * @param message Success message to display
   * @param duration Notification duration in milliseconds
   */
  showSuccess(message: string, duration: number = 5000): void {
    this.snackBar.open(message, 'Close', {
      duration: duration,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'bottom'
    });
}







}

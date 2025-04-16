// src/app/core/services/error/error.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../../environments/environment';

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

  private maxErrors = 100; // Maximum number of errors to store in memory

  constructor(private http: HttpClient) {}

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
}

// frontend/RuffedLemur/src/app/core/services/api/api.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ErrorService } from '../error/error.service';

// Define response types
export interface StandardApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  message?: string;
  error?: string;
  code?: number;
}

export interface SimpleApiResponse<T> {
  data: T;
}

export type ApiResponse<T> = StandardApiResponse<T> | SimpleApiResponse<T> | T;

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  protected apiUrl = environment.apiUrl;

  constructor(
    protected http: HttpClient,
    protected errorService: ErrorService
  ) {}

  /**
   * GET request
   * @param endpoint The API endpoint
   * @param params Optional query parameters
   * @param options Optional HTTP options
   */
  get<T>(endpoint: string, params?: any, options?: any): Observable<T> {
    const url = `${this.apiUrl}/${endpoint}`;
    const httpParams = this.buildHttpParams(params);
    const httpOptions = this.buildHttpOptions(options);

    return this.http.get(url, { ...httpOptions, params: httpParams })
      .pipe(
        tap(response => this.logSuccess(endpoint, response)),
        map(response => this.processResponse<T>(response)),
        catchError(error => this.handleError(error, `GET ${endpoint}`))
      );
  }

  /**
   * POST request
   * @param endpoint The API endpoint
   * @param body The request body
   * @param options Optional HTTP options
   */
  post<T>(endpoint: string, body: any, options?: any): Observable<T> {
    const url = `${this.apiUrl}/${endpoint}`;
    const httpOptions = this.buildHttpOptions(options);

    return this.http.post(url, body, httpOptions)
      .pipe(
        tap(response => this.logSuccess(endpoint, response)),
        map(response => this.processResponse<T>(response)),
        catchError(error => this.handleError(error, `POST ${endpoint}`))
      );
  }

  /**
   * PUT request
   * @param endpoint The API endpoint
   * @param body The request body
   * @param options Optional HTTP options
   */
  put<T>(endpoint: string, body: any, options?: any): Observable<T> {
    const url = `${this.apiUrl}/${endpoint}`;
    const httpOptions = this.buildHttpOptions(options);

    return this.http.put(url, body, httpOptions)
      .pipe(
        tap(response => this.logSuccess(endpoint, response)),
        map(response => this.processResponse<T>(response)),
        catchError(error => this.handleError(error, `PUT ${endpoint}`))
      );
  }

  /**
   * DELETE request
   * @param endpoint The API endpoint
   * @param options Optional HTTP options
   */
  delete<T>(endpoint: string, options?: any): Observable<T> {
    const url = `${this.apiUrl}/${endpoint}`;
    const httpOptions = this.buildHttpOptions(options);

    return this.http.delete(url, httpOptions)
      .pipe(
        tap(response => this.logSuccess(endpoint, response)),
        map(response => this.processResponse<T>(response)),
        catchError(error => this.handleError(error, `DELETE ${endpoint}`))
      );
  }

  /**
   * Process API response using type guards
   * @param response The API response
   */
  protected processResponse<T>(response: unknown): T {
    if (this.isStandardApiResponse<T>(response)) {
      if (response.status === 'error') {
        throw new Error(response.error || response.message || 'Unknown error');
      }
      return response.data;
    }

    if (this.isSimpleApiResponse<T>(response)) {
      return response.data;
    }

    // If it's already the expected type
    return response as T;
  }

  /**
   * Type guard for standard API response
   */
  private isStandardApiResponse<T>(response: unknown): response is StandardApiResponse<T> {
    return response !== null &&
           typeof response === 'object' &&
           'status' in response &&
           'data' in response;
  }

  /**
   * Type guard for simple API response
   */
  private isSimpleApiResponse<T>(response: unknown): response is SimpleApiResponse<T> {
    return response !== null &&
           typeof response === 'object' &&
           'data' in response &&
           !('status' in response);
  }

  /**
   * Log successful API response
   * @param endpoint API endpoint
   * @param response API response
   */
  protected logSuccess(endpoint: string, response: unknown): void {
    if (environment.logApiResponses) {
      console.log(`API Response [${endpoint}]:`, response);
    }
  }

  /**
   * Convert an object to HttpParams
   * @param params Object containing params
   */
  protected buildHttpParams(params?: any): HttpParams {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    return httpParams;
  }

  /**
   * Build HTTP options object
   * @param options Additional options
   */
  protected buildHttpOptions(options?: any): any {
    const httpOptions: any = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

    if (options) {
      if (options.headers) {
        Object.keys(options.headers).forEach(key => {
          httpOptions.headers = httpOptions.headers.set(key, options.headers[key]);
        });
      }

      if (options.reportProgress) {
        httpOptions.reportProgress = options.reportProgress;
      }

      if (options.responseType) {
        httpOptions.responseType = options.responseType;
      }

      if (options.withCredentials) {
        httpOptions.withCredentials = options.withCredentials;
      }

      // Mark as background request to avoid showing global loader
      if (options.background) {
        httpOptions.headers = httpOptions.headers.set('X-Background-Request', 'true');
      }
    }

    return httpOptions;
  }

  /**
   * Error handler for HTTP requests
   * @param error The error from the HTTP request
   * @param operation The operation that was attempted
   */
  protected handleError(error: any, operation: string): Observable<never> {
    // Log the error
    this.errorService.logError({
      operation,
      message: error.message || error.statusText,
      status: error.status,
      url: error.url,
      timestamp: new Date().toISOString()
    });

    // Get error message
    let errorMessage: string;

    if (error instanceof HttpErrorResponse) {
      // Server error
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 0) {
        errorMessage = 'Could not connect to the server. Please check your internet connection.';
      } else {
        errorMessage = `Server error: ${error.status} ${error.statusText}`;
      }
    } else {
      // Client error
      errorMessage = error.message || 'Something went wrong. Please try again later.';
    }

    return throwError(() => new Error(errorMessage));
  }
}

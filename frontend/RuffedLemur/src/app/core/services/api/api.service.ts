// Path: frontend/RuffedLemur/src/app/core/services/api/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ErrorService } from '../error/error.service';

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
  code?: number;
}

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
   * Generic GET request
   * @param endpoint The API endpoint
   * @param params Optional query parameters
   * @param options Optional HTTP options
   */
  get<T>(endpoint: string, params?: any, options?: any): Observable<T> {
    const url = `${this.apiUrl}/${endpoint}`;
    const httpParams = this.buildHttpParams(params);
    const httpOptions = this.buildHttpOptions(options);

    return this.http.get<ApiResponse<T>>(url, { ...httpOptions, params: httpParams })
      .pipe(
        tap(response => this.logSuccess(endpoint, response)),
        map(response => this.extractData<T>(response)),
        catchError(error => this.handleError(error, `GET ${endpoint}`))
      );
  }

  /**
   * Generic POST request
   * @param endpoint The API endpoint
   * @param body The request body
   * @param options Optional HTTP options
   */
  post<T>(endpoint: string, body: any, options?: any): Observable<T> {
    const url = `${this.apiUrl}/${endpoint}`;
    const httpOptions = this.buildHttpOptions(options);

    return this.http.post<ApiResponse<T>>(url, body, httpOptions)
      .pipe(
        tap(response => this.logSuccess(endpoint, response)),
        map(response => this.extractData<T>(response)),
        catchError(error => this.handleError(error, `POST ${endpoint}`))
      );
  }

  /**
   * Generic PUT request
   * @param endpoint The API endpoint
   * @param body The request body
   * @param options Optional HTTP options
   */
  put<T>(endpoint: string, body: any, options?: any): Observable<T> {
    const url = `${this.apiUrl}/${endpoint}`;
    const httpOptions = this.buildHttpOptions(options);

    return this.http.put<ApiResponse<T>>(url, body, httpOptions)
      .pipe(
        tap(response => this.logSuccess(endpoint, response)),
        map(response => this.extractData<T>(response)),
        catchError(error => this.handleError(error, `PUT ${endpoint}`))
      );
  }

  /**
   * Generic DELETE request
   * @param endpoint The API endpoint
   * @param options Optional HTTP options
   */
  delete<T>(endpoint: string, options?: any): Observable<T> {
    const url = `${this.apiUrl}/${endpoint}`;
    const httpOptions = this.buildHttpOptions(options);

    return this.http.delete<ApiResponse<T>>(url, httpOptions)
      .pipe(
        tap(response => this.logSuccess(endpoint, response)),
        map(response => this.extractData<T>(response)),
        catchError(error => this.handleError(error, `DELETE ${endpoint}`))
      );
  }

  /**
   * Extract data from API response
   * @param response API response
   */
  protected extractData<T>(response: ApiResponse<T>): T {
    if (response.status === 'error') {
      throw new Error(response.error || response.message || 'Unknown error');
    }
    return response.data as T;
  }

  /**
   * Log successful API response
   * @param endpoint API endpoint
   * @param response API response
   */
  protected logSuccess(endpoint: string, response: any): void {
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

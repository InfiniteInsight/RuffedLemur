import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ErrorService } from '../error/error.service';

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
    //const httpOptions = this.buildHttpOptions(options);
    const httpOptions = { ...(options || {}), observe: 'body '};

    return this.http.get<T>(url, { ...httpOptions, params: httpParams })
      .pipe(
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

    return this.http.post<T>(url, body, httpOptions)
      .pipe(
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

    return this.http.put<T>(url, body, httpOptions)
      .pipe(
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

    return this.http.delete<T>(url, httpOptions)
      .pipe(
        catchError(error => this.handleError(error, `DELETE ${endpoint}`))
      );
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
    // Log the error to console for debugging
    console.error(`${operation} failed:`, error);

    // Log to error service
    this.errorService.logError({
      operation,
      message: error.message || error.statusText,
      status: error.status,
      url: error.url,
      timestamp: new Date().toISOString()
    });

    // Return an observable with a user-facing error message
    const errorMessage = error.error?.message || 'Something went wrong. Please try again later.';
    return throwError(() => new Error(errorMessage));
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ErrorService } from '../../core/services/error/error.service';

@Injectable({
  providedIn: 'root'
})
export class AdminApiService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(
    private http: HttpClient,
    private errorService: ErrorService
  ) {}

  get<T>(endpoint: string, params?: any): Observable<T> {
    const httpParams = this.buildHttpParams(params);

    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, { params: httpParams })
      .pipe(
        catchError(error => {
          this.errorService.logError(error);
          return throwError(() => new Error(`Failed to get ${endpoint}`));
        })
      );
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, body)
      .pipe(
        catchError(error => {
          this.errorService.logError(error);
          return throwError(() => new Error(`Failed to create ${endpoint}`));
        })
      );
  }

  put<T>(endpoint: string, id: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${endpoint}/${id}`, body)
      .pipe(
        catchError(error => {
          this.errorService.logError(error);
          return throwError(() => new Error(`Failed to update ${endpoint}`));
        })
      );
  }

  delete<T>(endpoint: string, id: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}/${id}`)
      .pipe(
        catchError(error => {
          this.errorService.logError(error);
          return throwError(() => new Error(`Failed to delete ${endpoint}`));
        })
      );
  }

  private buildHttpParams(params?: any): HttpParams {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    return httpParams;
  }
}

// authorities/services/authority.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Authority, AuthorityStats } from '../../shared/models/authority.model';
import { ErrorService } from '../../core/services/error/error.service';

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface AuthorityListParams {
  page?: number;
  size?: number;
  filter?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class AuthorityService {
  private apiUrl = `${environment.apiUrl}/authorities`;

  constructor(
    private http: HttpClient,
    private errorService: ErrorService
  ) { }

  getAuthorities(params: AuthorityListParams = {}): Observable<PaginatedResponse<Authority>> {
    let httpParams = this.buildHttpParams(params);

    return this.http.get<PaginatedResponse<Authority>>(this.apiUrl, { params: httpParams })
      .pipe(
        catchError(error => {
          this.errorService.logError(error);
          return throwError(() => new Error('Failed to load authorities'));
        })
      );
  }

  getAuthority(id: string | number): Observable<Authority> {
    return this.http.get<Authority>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          this.errorService.logError(error);
          return throwError(() => new Error(`Failed to load authority with ID ${id}`));
        })
      );
  }

  createAuthority(authority: Partial<Authority>): Observable<Authority> {
    return this.http.post<Authority>(this.apiUrl, authority)
      .pipe(
        catchError(error => {
          this.errorService.logError(error);
          return throwError(() => new Error('Failed to create authority'));
        })
      );
  }

  updateAuthority(id: string | number, authority: Partial<Authority>): Observable<Authority> {
    return this.http.put<Authority>(`${this.apiUrl}/${id}`, authority)
      .pipe(
        catchError(error => {
          this.errorService.logError(error);
          return throwError(() => new Error(`Failed to update authority with ID ${id}`));
        })
      );
  }

  deleteAuthority(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          this.errorService.logError(error);
          return throwError(() => new Error(`Failed to delete authority with ID ${id}`));
        })
      );
  }

  exportAuthorityChain(id: string | number, format: 'pem' | 'der'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/export/${format}`, {
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        this.errorService.logError(error);
        return throwError(() => new Error(`Failed to export authority with ID ${id}`));
      })
    );
  }

  getAuthorityStats(): Observable<AuthorityStats> {
    return this.http.get<AuthorityStats>(`${this.apiUrl}/stats`)
      .pipe(
        catchError(error => {
          this.errorService.logError(error);
          return throwError(() => new Error('Failed to load authority statistics'));
        })
      );
  }

  getAuthorityPlugins(): Observable<string[]> {
    return this.http.get<string[]>(`${environment.apiUrl}/plugins/authority`)
      .pipe(
        catchError(error => {
          this.errorService.logError(error);
          return throwError(() => new Error('Failed to load authority plugins'));
        })
      );
  }

  private buildHttpParams(params: any = {}): HttpParams {
    let httpParams = new HttpParams();

    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        httpParams = httpParams.set(key, params[key].toString());
      }
    });

    return httpParams;
  }
}

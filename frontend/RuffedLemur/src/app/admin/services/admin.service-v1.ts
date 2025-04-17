import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, Role, Permission, SystemSetting } from '../../shared/models/admin.model';
import { ErrorService } from '../../core/services/error/error.service';


interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

interface ListParams {
  page?: number;
  size?: number;
  filter?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(
    private http: HttpClient,
    private errorService: ErrorService
  ) { }

  // User Management
  getUsers(params: ListParams = {}): Observable<PaginatedResponse<User>> {
    let httpParams = new HttpParams();

    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }

    if (params.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }

    if (params.filter) {
      httpParams = httpParams.set('filter', params.filter);
    }

    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
      if (params.order) {
        httpParams = httpParams.set('order', params.order);
      }
    }

    return this.http.get<PaginatedResponse<User>>(`${this.apiUrl}/users`, { params: httpParams })
    .pipe(
      catchError(error => {
        this.errorService.logError(error);
        return throwError(() => new Error('Failed to load users'));
      })
    );
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`)
    .pipe(
      catchError(error => {
        this.errorService.logError(error);
        return throwError(() => new Error('Failed to load users by id'));
      })
    );
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, user)
    .pipe(
      catchError(error => {
        this.errorService.logError(error);
        return throwError(() => new Error('Failed to create user'));
      })
    );
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, user)
    .pipe(
      catchError(error => {
        this.errorService.logError(error);
        return throwError(() => new Error('Failed to update users'));
      })
    );
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`)
    .pipe(
      catchError(error => {
        this.errorService.logError(error);
        return throwError(() => new Error('Failed to delete users'));
      })
    );
  }

  // Role Management
  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/roles`)
    .pipe(
      catchError(error => {
        this.errorService.logError(error);
        return throwError(() => new Error('Failed to load roles'));
      })
    );
  }

  getRole(id: number): Observable<Role> {
    return this.http.get<Role>(`${this.apiUrl}/roles/${id}`)
    .pipe(
      catchError(error => {
        this.errorService.logError(error);
        return throwError(() => new Error('Failed to load role by id'));
      })
    );
  }

  createRole(role: Partial<Role>): Observable<Role> {
    return this.http.post<Role>(`${this.apiUrl}/roles`, role)
    .pipe(
      catchError(error => {
        this.errorService.logError(error);
        return throwError(() => new Error('Failed to create role'));
      })
    );
  }

  updateRole(id: number, role: Partial<Role>): Observable<Role> {
    return this.http.put<Role>(`${this.apiUrl}/roles/${id}`, role)
    .pipe(
      catchError(error => {
        this.errorService.logError(error);
        return throwError(() => new Error('Failed to update roles'));
      })
    );
  }

  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/roles/${id}`)
    .pipe(
      catchError(error => {
        this.errorService.logError(error);
        return throwError(() => new Error('Failed to delete roles'));
      })
    );
  }

  // Permission Management
  getPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.apiUrl}/permissions`)
    .pipe(
      catchError(error => {
        this.errorService.logError(error);
        return throwError(() => new Error('Failed to get permissions'));
      })
    );
  }

  // System Settings
  getSettings(): Observable<SystemSetting[]> {
    return this.http.get<SystemSetting[]>(`${this.apiUrl}/settings`)
    .pipe(
      catchError(error => {
        this.errorService.logError(error);
        return throwError(() => new Error('Failed to get settings'));
      })
    );
  }

  updateSetting(key: string, value: string): Observable<SystemSetting> {
    return this.http.put<SystemSetting>(`${this.apiUrl}/settings/${key}`, { value })
    .pipe(
      catchError(error => {
        this.errorService.logError(error);
        return throwError(() => new Error('Failed to update settings'));
      })
    );
  }

  // System Information
  getSystemInfo(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/system/info`)
    .pipe(
      catchError(error => {
        this.errorService.logError(error);
        return throwError(() => new Error('Failed to get system info'));
      })
    );
  }

  // System Logs
  getLogs(params: ListParams = {}): Observable<PaginatedResponse<any>> {
    let httpParams = new HttpParams();

    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }

    if (params.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }

    if (params.filter) {
      httpParams = httpParams.set('filter', params.filter);
    }

    return this.http.get<PaginatedResponse<any>>(`${this.apiUrl}/system/logs`, { params: httpParams })
    .pipe(
      catchError(error => {
        this.errorService.logError(error);
        return throwError(() => new Error('Failed to get system logs'));
      })
    );
  }
}

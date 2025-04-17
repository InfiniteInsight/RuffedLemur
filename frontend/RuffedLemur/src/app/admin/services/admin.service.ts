// frontend/RuffedLemur/src/app/admin/services/admin.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User, Role, Permission, SystemSetting } from '../../shared/models/admin.model';
import { ErrorService } from '../../core/services/error/error.service';

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  size?: number;
}

export interface ListParams {
  page?: number;
  size?: number;
  filter?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  level?: string; // For logs
  [key: string]: any; // Allow any additional parameters
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

  // -------------------- User Management --------------------

  /**
   * Get paginated list of users with filtering and sorting
   * @param params List parameters (page, size, filter, etc.)
   */
  getUsers(params: ListParams = {}): Observable<PaginatedResponse<User>> {
    let httpParams = this.buildHttpParams(params);

    return this.http.get<PaginatedResponse<User>>(`${this.apiUrl}/users`, { params: httpParams })
      .pipe(
        catchError(error => {
          this.errorService.logError(error);
          return throwError(() => new Error('Failed to load users'));
        })
      );
  }

  /**
   * Get user by ID
   * @param id User ID
   */
  getUser(id: number | string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`)
      .pipe(
        catchError(error => {
          this.errorService.logError(error);
          return throwError(() => new Error('Failed to load user'));
        })
      );
  }

  /**
   * Create a new user
   * @param user User data to create
   */
  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, user)
      .pipe(
        catchError(error => {
          this.errorService.logError(error);
          return throwError(() => new Error('Failed to create user'));
        })
      );
  }

  /**
   * Update an existing user
   * @param id User ID
   * @param user User data to update
   */
  updateUser(id: number | string, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, user)
      .pipe(
        catchError(error => {
          this.errorService.logError(error);
          return throwError(() => new Error('Failed to update user'));
        })
      );
  }

  /**
   * Delete a user
   * @param id User ID
   */
  deleteUser(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`)
      .pipe(
        catchError(error => {
          this.errorService.logError(error);
          return throwError(() => new Error('Failed to delete user'));
        })
      );
  }

  // -------------------- Role Management --------------------

  /**
   * Get list of all roles
   */
  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/roles`)
      .pipe(
        catchError(error => {
          this.errorService.logError(error);
          return throwError(() => new Error('Failed to load roles'));
        })
      );
  }

  /**
   * Get role by ID
   * @param id Role ID
   */
  getRole(id: number | string): Observable<Role> {
    return this.http.get<Role>(`${this.apiUrl}/roles/${id}`)
      .pipe(
        catchError(error => {
          this.errorService.logError(error);
          return throwError(() => new Error('Failed to load role'));
        })
      );
  }

  /**
   * Create a new role
   * @param role Role data to create
   */
  createRole(role: Partial<Role>): Observable<Role> {
    return this.http.post<Role>(`${this.apiUrl}/roles`, role)
      .pipe(
        catchError(error => {
          this.errorService.logError(error);
          return throwError(() => new Error('Failed to create role'));
        })
      );
  }

  /**
   * Update an existing role
   * @param id Role ID
   * @param role Role data to update
   */
  updateRole(id: number | string, role: Partial<Role>): Observable<Role> {
    return this.http.put<Role>(`${this.apiUrl}/roles/${id}`, role)
      .pipe(
        catchError(error => {
          this.errorService.logError(error);
          return throwError(() => new Error('Failed to update role'));
        })
      );
  }

  /**
   * Delete a role
   * @param id Role ID
   */
  deleteRole(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/roles/${id}`)
      .pipe(
        catchError(error => {
          this.errorService.logError(error);
          return throwError(() => new Error('Failed to delete role'));
        })
      );
  }

  // -------------------- Permission Management --------------------

  /**
   * Get list of all permissions
   */
  getPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.apiUrl}/permissions`)
      .pipe(
        catchError(error => {
          this.errorService.logError(error);
          return throwError(() => new Error('Failed to load permissions'));
        })
      );
  }

  // -------------------- System Settings --------------------

  /**
   * Get all system settings
   */
  getSettings(): Observable<SystemSetting[]> {
    return this.http.get<SystemSetting[]>(`${this.apiUrl}/settings`)
      .pipe(
        catchError(error => {
          this.errorService.logError(error);
          return throwError(() => new Error('Failed to load settings'));
        })
      );
  }

  /**
   * Update a system setting
   * @param key Setting key
   * @param value New setting value
   */
  updateSetting(key: string, value: string): Observable<SystemSetting> {
    return this.http.put<SystemSetting>(`${this.apiUrl}/settings/${key}`, { value })
      .pipe(
        catchError(error => {
          this.errorService.logError(error);
          return throwError(() => new Error('Failed to update setting'));
        })
      );
  }

  // -------------------- System Information --------------------

  /**
   * Get system information
   */
  getSystemInfo(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/system/info`)
      .pipe(
        catchError(error => {
          this.errorService.logError(error);
          return throwError(() => new Error('Failed to load system information'));
        })
      );
  }

  // -------------------- System Logs --------------------

  /**
   * Get paginated system logs with filtering
   * @param params List parameters (page, size, filter, level, etc.)
   */
  getLogs(params: ListParams = {}): Observable<PaginatedResponse<any>> {
    let httpParams = this.buildHttpParams(params);

    return this.http.get<PaginatedResponse<any>>(`${this.apiUrl}/system/logs`, { params: httpParams })
      .pipe(
        catchError(error => {
          this.errorService.logError(error);
          return throwError(() => new Error('Failed to load system logs'));
        })
      );
  }

  // -------------------- Helper Methods --------------------

  /**
   * Build HTTP parameters from an object
   * @param params Parameter object
   * @returns HttpParams object
   */
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

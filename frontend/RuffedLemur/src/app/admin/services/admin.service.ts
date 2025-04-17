// frontend/RuffedLemur/src/app/admin/services/admin.service.ts
import { Injectable } from '@angular/core';
//import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
//import { catchError } from 'rxjs/operators';
//import { environment } from '../../../environments/environment';
import { User, Role, Permission, SystemSetting } from '../../shared/models/admin.model';
//import { ErrorService } from '../../core/services/error/error.service';
import { AdminApiService } from './api.service';

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
  //private apiUrl = `${environment.apiUrl}`;

  constructor(
    //private http: HttpClient,
    //private errorService: ErrorService
    private api: AdminApiService
  ) { }

// -------------------- User Management --------------------

  /**
   * Get paginated list of users with filtering and sorting
   * @param params List parameters (page, size, filter, etc.)
   */
  getUsers(params: ListParams = {}): Observable<PaginatedResponse<User>> {
    return this.api.get<PaginatedResponse<User>>('users', params);
  }

  /**
   * Get user by ID
   * @param id User ID
   */
  getUser(id: number | string): Observable<User> {
    return this.api.get<User>(`users/${id}`);
  }

  /**
   * Create a new user
   * @param user User data to create
   */
  createUser(user: Partial<User>): Observable<User> {
    return this.api.post<User>('users', user);
  }

  /**
   * Update an existing user
   * @param id User ID
   * @param user User data to update
   */
  updateUser(id: number | string, user: Partial<User>): Observable<User> {
    return this.api.put<User>('users', id, user);
  }

  /**
   * Delete a user
   * @param id User ID
   */
  deleteUser(id: number | string): Observable<void> {
    return this.api.delete<void>('users', id);
  }

  // -------------------- Role Management --------------------

  /**
   * Get list of all roles
   */
  getRoles(): Observable<Role[]> {
    return this.api.get<Role[]>('roles');
  }

  /**
   * Get role by ID
   * @param id Role ID
   */
  getRole(id: number | string): Observable<Role> {
    return this.api.get<Role>(`roles/${id}`);
  }

  /**
   * Create a new role
   * @param role Role data to create
   */
  createRole(role: Partial<Role>): Observable<Role> {
    return this.api.post<Role>('roles', role);
  }

  /**
   * Update an existing role
   * @param id Role ID
   * @param role Role data to update
   */
  updateRole(id: number | string, role: Partial<Role>): Observable<Role> {
    return this.api.put<Role>('roles', id, role);
  }

  /**
   * Delete a role
   * @param id Role ID
   */
  deleteRole(id: number | string): Observable<void> {
    return this.api.delete<void>('roles', id);
  }

  // -------------------- Permission Management --------------------

  /**
   * Get list of all permissions
   */
  getPermissions(): Observable<Permission[]> {
    return this.api.get<Permission[]>('permissions');
  }

  // -------------------- System Settings --------------------

  /**
   * Get all system settings
   */
  getSettings(): Observable<SystemSetting[]> {
    return this.api.get<SystemSetting[]>('settings');
  }

  /**
   * Update a system setting
   * @param key Setting key
   * @param value New setting value
   */
  updateSetting(key: string, value: string): Observable<SystemSetting> {
    return this.api.put<SystemSetting>('settings', key, { value });
  }

  // -------------------- System Information --------------------

  /**
   * Get system information
   */
  getSystemInfo(): Observable<any> {
    return this.api.get<any>('system/info');
  }

  // -------------------- System Logs --------------------

  /**
   * Get paginated system logs with filtering
   * @param params List parameters (page, size, filter, level, etc.)
   */
  getLogs(params: ListParams = {}): Observable<PaginatedResponse<any>> {
    return this.api.get<PaginatedResponse<any>>('system/logs', params);
  }
}

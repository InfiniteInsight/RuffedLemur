import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, Role, Permission, SystemSetting } from '../../shared/models/admin.model';

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

  constructor(private http: HttpClient) { }

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

    return this.http.get<PaginatedResponse<User>>(`${this.apiUrl}/users`, { params: httpParams });
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, user);
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`);
  }

  // Role Management
  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/roles`);
  }

  getRole(id: number): Observable<Role> {
    return this.http.get<Role>(`${this.apiUrl}/roles/${id}`);
  }

  createRole(role: Partial<Role>): Observable<Role> {
    return this.http.post<Role>(`${this.apiUrl}/roles`, role);
  }

  updateRole(id: number, role: Partial<Role>): Observable<Role> {
    return this.http.put<Role>(`${this.apiUrl}/roles/${id}`, role);
  }

  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/roles/${id}`);
  }

  // Permission Management
  getPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.apiUrl}/permissions`);
  }

  // System Settings
  getSettings(): Observable<SystemSetting[]> {
    return this.http.get<SystemSetting[]>(`${this.apiUrl}/settings`);
  }

  updateSetting(key: string, value: string): Observable<SystemSetting> {
    return this.http.put<SystemSetting>(`${this.apiUrl}/settings/${key}`, { value });
  }

  // System Information
  getSystemInfo(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/system/info`);
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

    return this.http.get<PaginatedResponse<any>>(`${this.apiUrl}/system/logs`, { params: httpParams });
  }
}

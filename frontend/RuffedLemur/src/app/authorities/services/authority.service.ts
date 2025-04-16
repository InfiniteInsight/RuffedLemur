import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Authority, AuthorityStats } from '../../shared/models/authority.model';

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

interface AuthorityListParams {
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

  constructor(private http: HttpClient) { }

  getAuthorities(params: AuthorityListParams = {}): Observable<PaginatedResponse<Authority[]>> {
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
      if( params.order) {
        httpParams = httpParams.set('order', params.order);
      }
    }

    return this.http.get<PaginatedResponse<Authority[]>>(this.apiUrl, {params: httpParams });
  }


  getAuthority(id: number): Observable<Authority> {
    return this.http.get<Authority>(`${this.apiUrl}/${id}`);
  }

  createAuthority(authority: Partial<Authority>): Observable<Authority> {
    return this.http.post<Authority>(this.apiUrl, authority);
  }

  updateAuthority(id: number, authority: Partial<Authority>): Observable<Authority> {
    return this.http.put<Authority>(`${this.apiUrl}/${id}`, authority);
  }

  deleteAuthority(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  exportAuthorityChain(id: number, format: 'pem' | 'der'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/export/${format}`, {
      responseType: 'blob'
    });
  }

  getAuthorityStats(): Observable<AuthorityStats> {
    return this.http.get<AuthorityStats>(`${this.apiUrl}/stats}`);
  }

  getAuthorityPlugins(): Observable<string[]> {
    return this.http.get<string[]>(`${environment.apiUrl}/plugins/authority`);
  }
}


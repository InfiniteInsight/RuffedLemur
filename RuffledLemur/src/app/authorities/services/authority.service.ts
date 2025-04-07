import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Authority } from '../../shared/models/certificate.model';

@Injectable({
  providedIn: 'root'
})
export class AuthorityService {
  private apiUrl = `${environment.apiUrl}/authorities`;

  constructor(private http: HttpClient) { }

  getAuthorities(): Observable<Authority[]> {
    return this.http.get<Authority[]>(this.apiUrl);
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
}

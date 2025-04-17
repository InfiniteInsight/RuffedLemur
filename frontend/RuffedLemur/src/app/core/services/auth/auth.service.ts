// src/app/core/services/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { LoginCredentials, AuthResponse, TokenResponse, UserInfo, SSOConfig } from '../../../shared/models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UserInfo | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }


  private loadUserFromStorage(): void {
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user_info');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as UserInfo;
        this.currentUserSubject.next(user);
      } catch (e) {
        console.error('Failed to parse stored user info', e);
        this.logout();
      }
    }
  }

  // Regular login with username and password

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.getCsrfToken().pipe(
      switchMap(csrfResponse => {
        return this.http.post<AuthResponse>(
          `${this.apiUrl}/login`,
          credentials,
          {
            headers: {
              'X-CSRF-TOKEN': csrfResponse.token
            }
          }
        );
      }),
      tap(response => this.handleAuthentication(response)),
      catchError(error => {
        console.error('Login failed', error);
        return throwError(() => new Error(error.error?.message || 'Login failed. Please try again.'));
      })
    );
  }

  // Handle successful authentication
  private handleAuthentication(response: AuthResponse): void {
    if (response.token) {
      localStorage.setItem('access_token', response.token);

      if (response.refreshToken) {
        localStorage.setItem('refresh_token', response.refreshToken);
      }

      if (response.user) {
        localStorage.setItem('user_info', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
      }
    }
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }

  // Get authentication token
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // Logout user
  logout(): void {
    // Call logout endpoint if needed
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => this.handleLogout(),
      error: () => this.handleLogout()
    });
  }

  // Handle logout process
  private handleLogout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  // Refresh token
  refreshToken(): Observable<TokenResponse> {
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<TokenResponse>(`${this.apiUrl}/refresh`, { refresh_token: refreshToken })
      .pipe(
        tap(response => {
          if (response.token) {
            localStorage.setItem('access_token', response.token);
          }
        }),
        catchError(error => {
          console.error('Token refresh failed', error);
          this.handleLogout();
          return throwError(() => new Error('Session expired. Please login again.'));
        })
      );
  }

  // SSO Authentication
  initiateSSOLogin(provider: string): void {
    // For most SSO flows, redirect to the provider's login page
    window.location.href = `${this.apiUrl}/sso/${provider}`;
  }

  // Handle SSO callback
  handleSSOCallback(code: string, state: string): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${this.apiUrl}/sso/callback?code=${code}&state=${state}`)
      .pipe(
        tap(response => this.handleAuthentication(response)),
        catchError(error => {
          console.error('SSO authentication failed', error);
          return throwError(() => new Error(error.error?.message || 'SSO authentication failed. Please try again.'));
        })
      );
  }

  // Get available SSO providers
  getSSOProviders(): Observable<SSOConfig[]> {
    return this.http.get<{providers: SSOConfig[]}>(`${this.apiUrl}/sso/providers`)
      .pipe(
        map(response => response.providers),
        catchError(error => {
          console.error('Failed to load SSO providers', error);
          return throwError(() => new Error('Failed to load login options.'));
        })
      );
  }

  getCsrfToken(): Observable<{token: string}> {
    return this.http.get<{token: string}>(`${this.apiUrl}/csrf-token`);
}
}

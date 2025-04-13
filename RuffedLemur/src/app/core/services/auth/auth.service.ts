// src/app/core/services/auth/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment'
import {
  AuthResponse,
  LoginCredentials,
  SSOConfig,
  UserInfo,
  TokenResponse
} from '../../../shared/models/auth.model'
//'../../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UserInfo | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private tokenKey = 'auth_token';
  private refreshTokenKey = 'refresh_token';
  private userKey = 'user_info';
  private ssoConfigKey = 'sso_config';
  private tokenExpiryKey = 'token_expiry';

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
  }

  // Load user info from local storage on service initialization
  private loadUserFromStorage(): void {
    const storedUser = localStorage.getItem(this.userKey);
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);

        // Check token expiry
        const expiry = localStorage.getItem(this.tokenExpiryKey);
        if (expiry && new Date(expiry) <= new Date()) {
          // Token has expired, attempt refresh
          this.refreshToken().subscribe({
            error: () => {
              // If refresh fails, log the user out
              this.logout();
              this.router.navigate(['/auth/login']);
            }
          });
        }
      } catch (e) {
        localStorage.removeItem(this.userKey);
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.refreshTokenKey);
        localStorage.removeItem(this.tokenExpiryKey);
      }
    }
  }

  // Standard login with username/password
  login(credentials: LoginCredentials): Observable<UserInfo> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => this.handleAuthSuccess(response)),
        map(response => response.user),
        catchError(error => {
          console.error('Login error', error);
          return throwError(() => new Error(error.error?.message || 'Invalid username or password'));
        })
      );
  }

  // Handle successful authentication (for both standard and SSO login)
  private handleAuthSuccess(response: AuthResponse): void {
    localStorage.setItem(this.tokenKey, response.token);

    if (response.refreshToken) {
      localStorage.setItem(this.refreshTokenKey, response.refreshToken);
    }

    if (response.expiry) {
      localStorage.setItem(this.tokenExpiryKey, response.expiry);
    }

    localStorage.setItem(this.userKey, JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
  }

  // Refresh the access token
  refreshToken(): Observable<string> {
    const refreshToken = localStorage.getItem(this.refreshTokenKey);

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<TokenResponse>(`${environment.apiUrl}/auth/refresh`, { refreshToken })
      .pipe(
        tap(response => {
          localStorage.setItem(this.tokenKey, response.token);

          if (response.refreshToken) {
            localStorage.setItem(this.refreshTokenKey, response.refreshToken);
          }

          if (response.expiry) {
            localStorage.setItem(this.tokenExpiryKey, response.expiry);
          }
        }),
        map(response => response.token),
        catchError(error => {
          console.error('Token refresh error', error);
          return throwError(() => new Error('Failed to refresh token'));
        })
      );
  }

  // Get the current authentication token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // Get current user info
  getCurrentUser(): UserInfo | null {
    return this.currentUserSubject.value;
  }

  // Logout user
  logout(): void {
    // Call backend logout endpoint if needed
    this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe({
      next: () => {},
      error: () => {}
    });

    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.tokenExpiryKey);
    this.currentUserSubject.next(null);
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.roles?.includes(role) || false;
  }

  // SSO Support Methods
  // Save SSO configuration
  saveSSOConfig(config: SSOConfig): void {
    localStorage.setItem(this.ssoConfigKey, JSON.stringify(config));
  }

  // Get SSO configuration
  getSSOConfig(): SSOConfig | null {
    const config = localStorage.getItem(this.ssoConfigKey);
    return config ? JSON.parse(config) : null;
  }

  // Initialize SSO login flow
  initiateSSOLogin(provider: string): void {
    // Fetch provider config from backend
    this.http.get<SSOConfig>(`${environment.apiUrl}/auth/sso/${provider}/config`)
      .pipe(
        tap(config => this.saveSSOConfig(config)),
        map(config => {
          // Build authorization URL with required parameters
          const authUrl = new URL(config.authEndpoint);
          authUrl.searchParams.append('client_id', config.clientId);
          authUrl.searchParams.append('redirect_uri', config.redirectUri);
          authUrl.searchParams.append('response_type', config.responseType);
          authUrl.searchParams.append('scope', config.scope);
          authUrl.searchParams.append('state', this.generateRandomState());

          // Redirect to SSO provider
          window.location.href = authUrl.toString();
        })
      ).subscribe();
  }

  // Handle SSO callback with authorization code
  handleSSOCallback(code: string, state: string): Observable<UserInfo> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/sso/callback`, { code, state })
      .pipe(
        tap(response => this.handleAuthSuccess(response)),
        map(response => response.user),
        catchError(error => {
          console.error('SSO callback error', error);
          return throwError(() => new Error('SSO authentication failed'));
        })
      );
  }

  // Generate random state for CSRF protection
  private generateRandomState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

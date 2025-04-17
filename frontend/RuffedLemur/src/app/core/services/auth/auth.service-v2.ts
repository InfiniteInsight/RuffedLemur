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
  // Update in auth.service.ts

/**
 * Handle successful authentication response from backend
 * @param response Authentication response containing tokens
 */
private handleAuthResponse(response: any): void {
  // Store tokens
  localStorage.setItem('token', response.access_token);
  localStorage.setItem('refreshToken', response.refresh_token);

  // Parse token to extract user information
  const tokenData = this.parseJwt(response.access_token);

  // Create user object from token claims
  const user: User = {
    id: tokenData.sub,  // The 'sub' claim is the user ID
    username: tokenData.username,
    email: tokenData.email,
    roles: tokenData.roles || [],
    active: true
  };

  // Update user subject
  this.currentUserSubject.next(user);

  // Schedule token refresh
  const expiresInMs = response.expires_in * 1000;
  this.scheduleTokenRefresh(expiresInMs);
}

/**
 * Parse JWT token to extract payload
 * @param token JWT token
 * @returns Decoded token payload
 */
private parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT', error);
    return {};
  }
}

/**
 * Schedule token refresh before expiration
 * @param expiresInMs Token expiration time in milliseconds
 */
private scheduleTokenRefresh(expiresInMs: number): void {
  // Clear any existing refresh timer
  if (this.refreshTimer) {
    clearTimeout(this.refreshTimer);
  }

  // Set refresh to happen 1 minute before expiration
  const refreshTime = expiresInMs - 60000; // 1 minute before expiration

  if (refreshTime > 0) {
    this.refreshTimer = setTimeout(() => {
      this.refreshToken().subscribe({
        error: () => {
          // If refresh fails, log the user out
          this.logout();
        }
      });
    }, refreshTime);
  }
}


}

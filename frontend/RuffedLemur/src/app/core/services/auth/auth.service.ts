// src/app/core/services/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of, switchMap } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { LoginCredentials, UserInfo } from '../../../shared/models/auth.model';
import { TokenService } from '../token/token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UserInfo | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private apiUrl = `${environment.apiUrl}/auth`;
  private idleTimer: any;

  constructor(
    private http: HttpClient,
    private router: Router,
    private tokenService: TokenService
  ) {
    this.loadUserFromStorage();
    // Only start the idle timer if the user is logged in
    if (this.isLoggedIn()) {
      this.startIdleTimer();
    }
  }

  private loadUserFromStorage(): void {
    const user = this.tokenService.getUser();
    if (user) {
      this.currentUserSubject.next(user);
    }
  }

  // Regular login with username and password
  login(credentials: LoginCredentials): Observable<any> {
    return this.getCsrfToken().pipe(
      switchMap(csrfResponse => {
        return this.http.post<any>(
          `${this.apiUrl}/login`,
          credentials,
          {
            headers: {
              'X-CSRF-TOKEN': csrfResponse.token
            },
            withCredentials: true // Important for cookies
          }
        );
      }),
      tap(response => {
        // Store the user data
        if (response.user) {
          this.tokenService.setUser(response.user);
          this.currentUserSubject.next(response.user);

          // Start idle timer after login
          this.startIdleTimer();
        }
      }),
      catchError(error => {
        console.error('Login failed', error);
        return throwError(() => new Error(error.error?.message || 'Login failed. Please try again.'));
      })
    );
  }

  // Get CSRF token
  getCsrfToken(): Observable<{token: string}> {
    return this.http.get<{token: string}>(`${this.apiUrl}/csrf-token`,
      { withCredentials: true }
    ).pipe(
      tap(response => {
        // Store CSRF token for use in requests
        localStorage.setItem('csrf_token', response.token);
      })
    );
  }

  // Silent token refresh for HttpOnly cookies
  silentRefresh(): Observable<boolean> {
    return this.http.post<any>(
      `${this.apiUrl}/refresh`,
      {},
      { withCredentials: true }
    ).pipe(
      map(() => true),
      catchError(() => {
        this.logout();
        return of(false);
      })
    );
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return !!this.tokenService.getUser();
  }

  // Logout user
  logout(): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/logout`,
      {},
      { withCredentials: true }
    ).pipe(
      tap(() => this.handleLogout()),
      catchError(error => {
        this.handleLogout();
        return throwError(() => error);
      })
    );
  }

  // Handle logout process
  private handleLogout(): void {
    this.tokenService.clearUserData();
    this.currentUserSubject.next(null);
    this.clearIdleTimer();
    this.router.navigate(['/auth/login']);
  }

  // SSO Authentication
  initiateSSOLogin(provider: string): void {
    window.location.href = `${this.apiUrl}/sso/${provider}`;
  }

  // Handle SSO callback
  handleSSOCallback(code: string, state: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/sso/callback?code=${code}&state=${state}`,
      { withCredentials: true }
    ).pipe(
      tap(response => {
        if (response.user) {
          this.tokenService.setUser(response.user);
          this.currentUserSubject.next(response.user);
          this.startIdleTimer();
        }
      }),
      catchError(error => {
        console.error('SSO authentication failed', error);
        return throwError(() => new Error(error.error?.message || 'SSO authentication failed. Please try again.'));
      })
    );
  }

  // Idle timeout management
  startIdleTimer(): void {
    this.clearIdleTimer(); // Clear any existing timer

    const idleTimeout = 15 * 60 * 1000; // 15 minutes

    const resetTimer = () => {
      this.clearIdleTimer();
      this.idleTimer = setTimeout(() => {
        // Log out after idle timeout
        this.logout().subscribe();
      }, idleTimeout);
    };

    // Listen for user activity
    ['mousedown', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    // Start initial timer
    resetTimer();
  }

  clearIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

// User registration
register(userData: { username: string, email: string, password: string }): Observable<any> {
  return this.getCsrfToken().pipe(
    switchMap(csrfResponse => {
      return this.http.post<any>(
        `${this.apiUrl}/register`,
        userData,
        {
          headers: {
            'X-CSRF-TOKEN': csrfResponse.token
          },
          withCredentials: true
        }
      );
    }),
    catchError(error => {
      console.error('Registration failed', error);
      return throwError(() => new Error(error.error?.message || 'Registration failed. Please try again.'));
    })
  );
}

/**
 * Check if the current user has a specific role
 * @param role Role name to check
 * @returns True if the user has the role, false otherwise
 */
hasRole(role: string): boolean {
  const user = this.getCurrentUser();
  if (!user || !user.roles) return false;

  // If roles is an array of strings
  if (Array.isArray(user.roles) && typeof user.roles[0] === 'string') {
    return user.roles.includes(role);
  }

  // If roles is an array of objects with name property
  if (Array.isArray(user.roles) && typeof user.roles[0] === 'object') {
    return user.roles.some((r: any) => r.name === role);
  }

  return false;
}

/**
 * Check if the current user has a specific permission
 * @param permission Permission string in format 'resource:action'
 * @returns True if the user has the permission, false otherwise
 */
hasPermission(permission: string): boolean {
  const user = this.getCurrentUser();
  if (!user || !user.roles) return false;

  // If user has admin role, grant all permissions
  if (this.hasRole('admin')) return true;

  // Split permission into resource and action
  const [resource, action] = permission.split(':');
  if (!resource || !action) return false;

  // Check each role's permissions
  return user.roles.some((role: any) => {
    // Skip if role has no permissions
    if (!role.permissions) return false;

    // Check if role has the specific permission
    return role.permissions.some((perm: any) =>
      perm.resource === resource && perm.action === action
    );
  });
}

/**
 * Get current user information
 * @returns Current user or null if not logged in
 */
getCurrentUser(): any {
  return this.currentUserSubject.value;
}


}

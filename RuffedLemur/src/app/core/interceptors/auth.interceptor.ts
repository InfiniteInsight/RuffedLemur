// src/app/core/interceptors/auth.interceptor.ts

import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap, finalize } from 'rxjs/operators';
import { AuthService } from '../services/auth/auth.service';
import { LoadingService } from '../services/loading/loading.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private authService: AuthService,
    private loadingService: LoadingService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Show loading spinner for non-background requests
    if (!request.headers.has('X-Background-Request')) {
      this.loadingService.setLoading(true, request.url);
    }

    // Add token if available
    const token = this.authService.getToken();
    if (token) {
      request = this.addToken(request, token);
    }

    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse) {
          if (error.status === 401) {
            // Handle 401 Unauthorized errors - token may be expired
            return this.handle401Error(request, next);
          } else if (error.status === 403) {
            // Handle 403 Forbidden errors - user doesn't have permission
            this.router.navigate(['/unauthorized']);
          } else if (error.status === 404) {
            // Handle 404 Not Found errors
            console.error('Resource not found:', request.url);
          } else if (error.status === 0 || error.status >= 500) {
            // Handle server errors or connectivity issues
            console.error('Server error or connectivity issue:', error);
          }
        }
        return throwError(() => error);
      }),
      finalize(() => {
        // Hide loading spinner when request completes
        if (!request.headers.has('X-Background-Request')) {
          this.loadingService.setLoading(false, request.url);
        }
      })
    );
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((token: any) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(token);
          return next.handle(this.addToken(request, token));
        }),
        catchError((error) => {
          this.isRefreshing = false;
          this.authService.logout();
          this.router.navigate(['/auth/login']);
          return throwError(() => error);
        })
      );
    } else {
      // Wait for the token to be refreshed, then retry with the new token
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(token => next.handle(this.addToken(request, token)))
      );
    }
  }
}

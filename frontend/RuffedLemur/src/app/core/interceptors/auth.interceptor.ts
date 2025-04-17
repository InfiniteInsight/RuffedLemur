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
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // With HttpOnly cookies, we don't need to manually add the token
    // The browser will automatically include cookies in the request

    // For CSRF protection
    if (this.shouldAddCsrfToken(request)) {
      request = this.addCsrfToken(request);
    }

    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(request, next);
        }

        return throwError(() => error);
      })
    );
  }

  private shouldAddCsrfToken(request: HttpRequest<any>): boolean {
    // Add CSRF token to all POST, PUT, DELETE, PATCH requests
    const method = request.method.toUpperCase();
    return ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
  }

  private addCsrfToken(request: HttpRequest<any>): HttpRequest<any> {
    const token = localStorage.getItem('csrf_token');
    if (token) {
      return request.clone({
        setHeaders: {
          'X-CSRF-TOKEN': token
        }
      });
    }
    return request;
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      // With HttpOnly cookies, the refresh happens on the server
      return this.authService.silentRefresh().pipe(
        switchMap(success => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(true);
          return next.handle(request);
        }),
        catchError(err => {
          this.isRefreshing = false;
          this.authService.logout();
          return throwError(() => err);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(() => next.handle(request))
      );
    }
  }
}

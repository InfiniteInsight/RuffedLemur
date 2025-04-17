// src/app/core/services/token.service.ts

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly USER_KEY = 'user_info';

  constructor() {}

  // With HttpOnly cookies, we don't manage tokens directly in JavaScript,
  // but we do need to store user info for the app to use
  setUser(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getUser(): any {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  clearUserData(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  // For cookies, we need the HttpClient to communicate with the server
  // about authentication status
  isAuthenticated(auth: any): boolean {
    // We rely on the user info in localStorage as a proxy for
    // whether the user is authenticated - the actual tokens
    // are in HttpOnly cookies
    return !!this.getUser();
  }
}

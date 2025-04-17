import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, of, throwError } from "rxjs";
import { catchError, map, tap } from "rxjs";
import { Router } from "@angular/router";
import { AuthResponse, LoginCredentials, SSOConfig, UserInfo } from "../../../shared/models/auth.model";
import { environment } from  '../../../../environments/environment';
import { User } from "../../../shared/models/user.model";

@Injectable({
  providedIn: 'root'
})


export class AuthService {
  private currentUserSubject = new BehaviorSubject<UserInfo | null>(null);
  public currentUsers$ = this.currentUserSubject.asObservable();

  private tokenKey = 'auth_token';
  private userKey = 'user_info';
  private ssoConfigKey = 'sso_config';

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
  }


private loadUserFromStorage(): void {
  const storedUser = localStorage.getItem(this.userKey); //cached JWT in local storage
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      this.currentUserSubject.next(user);
     } catch (e) {
      localStorage.removeItem(this.userKey);
      localStorage.removeItem(this.tokenKey);
     }
   }
 }

 //standard login with user/pass
 login(credentials: LoginCredentials): Observable<UserInfo> {
  return this.http.post<AuthResponse>(`$environment.apiUrl/login`, credentials)
    .pipe(
      tap(response => this.handleAuthSuccess(response)),
      map(response => response.user),
      catchError(error => {
        console.log('Login Error', error);
        return throwError(() => new Error('Invalid username or password'));

      })
    );
  }

 //handle successful auths for both sso and standard user/pass
 private handleAuthSuccess(response: AuthResponse): void {
  localStorage.setItem(this.tokenKey, response.token);
  localStorage.setItem(this.userKey, JSON.stringify(response.user));
  this.currentUserSubject.next(response.user);
}

//get current auth token
getToken(): string | null {
  return localStorage.getItem(this.tokenKey);
}

//check if the user is logged in
isLoggedIn(): boolean {
  return !!this.getToken();
}

//get current user info
getCurrentUser(): UserInfo | null {
  return this.currentUserSubject.value;
}

// Logout user
logout(): void {
  localStorage.removeItem(this.tokenKey);
  localStorage.removeItem(this.userKey);
  this.currentUserSubject.next(null);
  this.router.navigate(['/auth/login']);
}

//check for user roles
hasRole(role: string): boolean {
  const user = this.getCurrentUser();
  return user?.roles?.includes(role) || false;
}

//SSO Support Methods

//Save SSO config

saveSSOConfig(config: SSOConfig): void {
  localStorage.setItem(this.ssoConfigKey, JSON.stringify(config));
}

//Get SSO Config

getSSOConfig(): SSOConfig | null {
  const config = localStorage.getItem(this.ssoConfigKey);
  return config ? JSON.parse(config) : null;
}

//Initialize the SSO login flow
initiateSSOLogin(provider: string): void {
  //fetch the provider config
  this.http.get<SSOConfig>(`${environment.apiUrl}/auth/sso/${provider}/config`)
    .pipe(
      tap(config => this.saveSSOConfig(config)),
      map(config => {
        // Build the authorization URL with required params
        const authURL = new URL(config.authEndpoint);
        authURL.searchParams.append('client_id', config.clientId);
        authURL.searchParams.append('redirect_uri', config.redirectUri);
        authURL.searchParams.append('response_type', config.responseType);
        authURL.searchParams.append('scope', config.scope);
        authURL.searchParams.append('state', this.generateRandomState());


        //Redirect to SSO provider
        window.location.href = authURL.toString();
      })
    ).subscribe();
}

  //Handle SSO Callback with auth code
  handleSSOCallback(code: string, state: string): Observable<UserInfo> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/sso/callback`, {code, state})
    .pipe(
      tap(Response => this.handleAuthSuccess(Response)),
      map(Response => Response.user),
      catchError(error => {
        console.error('SSO Callback error', error);
        return throwError(() => new Error('SSO authentication failed'));
      })
    );

  }

  //Generate random state for cross site request foragery protection
  private generateRandomState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2,15);
  }
}



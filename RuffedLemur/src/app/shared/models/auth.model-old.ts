export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserInfo;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  roles: string[];
  firstName?: string;
  lastName?: string;
  active: boolean;
  department?: string;
  title?: string;

}

//TO DO: To implement SSO
export interface SSOConfig {
  provider: string;
  clientId: string;
  authEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint: string;
  redirectUri: string;
  scope: string;
  responseType: string;
}

// src/app/core/models/auth.model.ts

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  expiry?: string;  // ISO date string for token expiration
  user: UserInfo;
}

export interface TokenResponse {
  token: string;
  refreshToken?: string;
  expiry?: string;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  roles: string[];
  firstName?: string;
  lastName?: string;
  active: boolean;
}

// For future SSO support
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

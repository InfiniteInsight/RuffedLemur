export interface User {
  id?: string; //string for uuid compatibility
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  active: boolean;
  roles: Role[];
  apiKey?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Role {
  id?: string;
  name: string;
  description?: string;
  permissions: Permission[];
}

export interface Permission {
  id?: string;
  name: string;
  description?: string;
}

export interface SystemSetting {
  id?: string;
  key: string;
  value: string;
  description?: string;
  category: SettingCategory;
  editable: boolean;
}

export enum SettingCategory {
  GENERAL = 'general',
  SECURITY = 'security',
  CERTIFICATE = 'certificate',
  NOTIFICATION = 'notification',
  AUTHENTICATION = 'authentication'
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

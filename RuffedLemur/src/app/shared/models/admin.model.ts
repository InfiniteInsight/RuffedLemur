// src/app/shared/models/admin.model.ts
export interface User {
  id?: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  active: boolean;
  roles: Role[];
  apiKey?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Role {
  id?: number;
  name: string;
  description?: string;
  permissions: Permission[];
}

export interface Permission {
  id?: number;
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

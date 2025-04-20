export interface Plugin {
  id?: number;
  name: string;
  description?: string;
  version: string;
  author?: string;
  enabled: boolean;
  type: PluginType;
  options?: PluginOptions;
  metadata: PluginMetadata;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum PluginType {
  ISSUER = 'issuer',
  DESTINATION = 'destination',
  NOTIFICATION = 'notification',
  SOURCE = 'source',
  EXPORT = 'export',
  METRIC = 'metric'
}

export interface PluginStat {
  type: PluginType;
  count: number;
  enabledCount: number;
}

export interface PluginOptions {
  name: string;
  description?: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'object';
  required: boolean;
  default?: any;
  options?: string[]; // For select type
}

export interface PluginMetadata {
  [key: string]: {
    required?: boolean;
    type?: string;
    description?: string;
    validation?: string;
    default?: any;
  };
}

export interface AvailablePlugin {
  name: string;
  type: PluginType;
  description?: string;
  version?: string;
}



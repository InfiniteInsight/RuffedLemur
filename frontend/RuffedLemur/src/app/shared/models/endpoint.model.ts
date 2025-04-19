// src/app/shared/models/endpoint.model.ts
export interface Endpoint {
  id?: string | number;
  name: string;
  description?: string;
  owner: string;
  type: EndpointType;
  active: boolean;
  dnsProviderType?: string;
  certificateCount?: number;
  options?: EndpointOptions;
  createdAt?: Date;
  updatedAt?: Date;
  team?: string[];
}

export enum EndpointType {
  AWS = 'aws',
  GCP = 'gcp',
  AZURE = 'azure',
  KUBERNETES = 'kubernetes',
  ONPREM = 'on-premises',
  CUSTOM = 'custom'
}

export interface EndpointOptions {
  region?: string;
  accountId?: string;
  projectId?: string;
  resourceGroup?: string;
  namespace?: string;
  customFields?: Record<string, string>;
}

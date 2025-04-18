// frontend/RuffedLemur/src/app/shared/models/certificate.model.ts
export interface Certificate {
  id: string | number;  // added string for UUID compatibility
  name: string;
  owner: string;
  description?: string;
  commonName: string;
  chain?: string;
  body: string;
  private_key?: string;
  //cn: string;
  serial: string;
  status?: string;
  notBefore: string;
  notAfter: string;
  bits?: number;
  san?: string;
  issuer?: string;
  distinguished_name?: string;
  key_type?: string;
  signing_algorithm?: string;
  is_ca: boolean;
  revoked: boolean;
  rotation: boolean;
  has_private_key: boolean;
  domains: string[];
  authorityId: string;
  authority?: Authority;
  user_id?: string;
  team?: string;
  source?: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
  extensions?: any;
}

export interface Authority {
  id: string;
  name: string;
  description?: string;
  owner?: string;
  active: boolean;
}

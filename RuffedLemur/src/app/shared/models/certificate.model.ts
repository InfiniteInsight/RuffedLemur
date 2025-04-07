import { User } from "./user.model";

export interface Certificate {
  status?: string;
  commonName: string; // Common Name or Canonical Name
  chain?: string;
  csr?: string;
  authority?: Authority;
  authorityId: Authority;
  owner: string;
  serial: string;
  id: number;
  issuer?: string;
  dateCreated: string; // possibly date object
  notBefore: string; // Could also be a Date object, but string is safer initially
  notAfter: string; // Could also be a Date object
  destinations: string; //where the cert will be installed
  bits: number;
  body: string; //certificate body
  description?: string;
  deleted?: boolean;
  notifications?: string[]; //en
  fingerprint: string;
  signatureAlgorithm: string;
  signatureHashAlgorithm: string;
  user: User[]; //should match user model
  active: boolean;
  domains: Domains[];
  replaces: string;
  replaced: string;
  name: string;
  roles: string;
  san?: string[]; //subject alternative name
  quantity: number;
  team?: string;
}

export interface Authority {
  active: boolean;
  owner: string;
  id: number;
  description?: string[];
  name: string;
}

export interface Authority {
  id?: number;
  name?: string;
  description?: string;
  owner?: string;
  active?: boolean;
  options?: AuthorityOptions;
  body?: string; //for PEM base64 certs
  chain?: string[] //potential multiple base64 certs
  roles?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthorityOptions {
  plugin: AuthorityPlugin;
  pluginOptions: any; //TO DO: choose a better type later
  validityYears: number;
  keyType: KeyType;
  keySize?: number;
  curve?: string;
  organization?: string;
  organizationalUnit?: string;
  country?: string;
  state?: string;
  location?: string;
}

export enum KeyType {
  RSA = 'RSA',
  ECC = 'ECC',
  ED25519 = 'ED25519'
}

export enum AuthorityPlugin {
  ACMEIssuer = 'acme-issuer',
  SelfSigned = 'selfsigned',
  VenafiIssuer = 'venafi-issuer',
  AWSIssuer = 'aws-issuer',
  SectigoIssuer = 'sectigo-issuer',
  DigicertIssuer = 'digicert-issuer',
  EntrustIssuer = 'entrust-issuer',
  LetsEncryptIssuer = 'letsencrypt-issuer',
  ZeroSslIssuer = 'zerossl-issuer',
  GoogleIssuer = "google-issuer"
}

export interface AuthorityStats {
  certificateCount: number;
  expiringCertificates: number;
  expiredCertificates: number;
  revokedCertificates: number;
  activeAuthorities: number;
  inactiveAuthorities: number;
  totalAuthorities: number;

}

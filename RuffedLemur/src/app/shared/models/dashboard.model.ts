import { User } from "./user.model";
import { Certificate } from "./certificate.model";

export interface CertificateStats {
  id?: number;
  total?: number;
  active?: number;
  expired?: number;
  revoked?: number;
  expiringToday?: number;
  expiringLessThan7Days?: number;
  expiringLessThan15Days?: number;
  expiringLessThan30Days?: number;
  expiringIn90Days?: number;
  expiringIn180Days?: number;
  expiringIn730Days?: number;
  owner?: User;
  certificate?: Certificate;
}

export interface CertificateByAuthority {
  id?: number;
  authorityName?: string;
  count?: number;
  percentage?: number;
  authorityExpirationDate?: Date;
  certificate?: Certificate;
}

export interface ExpiringCertificate {
  id?: number;
  name?: string;
  owner?: string;
  expirationDate?: Date;
  daysUntilExpiration?: number;
  commonName?: string;
  authorityName?: string;
  subjectAlternativeName?: string;
  validFrom?: Date;
  validTo?: Date;
  certificate?: Certificate;
}

export interface CertificateByOwner {
  id?: number;
  owner?: User;
  count?: number;
  expiringCertificate?: ExpiringCertificate;
  certificate?: Certificate;
}

export interface CertificateByDomain {
  id: number;
  domain?: string;
  total?: number;
  validFrom?: Date
  validTo?: Date;
  certificate?: Certificate;
  ExpiringCertificate?: ExpiringCertificate;
}

export interface CertificateByTeam {
  id: number;
  team?: string;
  total?: number;
  validFrom?: Date;
  validTo?: Date;
  certificate?: Certificate
  ExpiringCertificate?: ExpiringCertificate;
}

export interface CertificateBySource {
  id?: number;
  source?: string;
  total?: number;
  validFrom?: Date;
  validTo?: Date;
  certificate?: Certificate;
  ExpiringCertificate?: ExpiringCertificate;
}

export interface CertificateByTime {
  id: number;
  holiday?: Date[];
  timeSpanStart: Date;
  timeSpanEnd: Date;
  validFrom?: Date;
  validTo?: Date;
  certificate?: Certificate;
  ExpiringCertificate: ExpiringCertificate[];
}

//TO DO: CertificateByHoliday, CertificateOnWeekend, CertificateWithLifeTimeGreaterThan

// src/app/certificates/services/certificate.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Certificate } from '../../shared/models/certificate.model';
import { ApiService } from '../../core/services/api/api.service';
import { ErrorService } from '../../core/services/error/error.service';
import { idToString } from '../../shared/utils/type-guard';

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface CertificateListParams {
  page?: number;
  size?: number;
  filter?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class CertificateService extends ApiService {

  constructor(
    protected override http: HttpClient,
    protected override errorService: ErrorService
  ) {
    super(http, errorService);
  }

  /**
   * Get certificates with pagination and filtering
   */
  getCertificates(params: CertificateListParams = {}): Observable<PaginatedResponse<Certificate>> {
    return this.get<PaginatedResponse<Certificate>>('certificates', params);
  }

  /**
   * Get a single certificate by ID
   */
  getCertificate(id: string | number): Observable<Certificate> {
    // convert id to string for the URL
    const certId = idToString(id);
    return this.get<Certificate>(`certificates/${certId}`);
  }

  /**
   * Create a new certificate
   */
  createCertificate(certificate: Partial<Certificate>): Observable<Certificate> {
    return this.post<Certificate>('certificates', certificate);
  }

  /**
   * Update an existing certificate
   */
  updateCertificate(id: string | number, certificate: Partial<Certificate>): Observable<Certificate> {
    const certId = idToString(id);
    return this.put<Certificate>(`certificates/${certId}`, certificate);
  }

  /**
   * Revoke a certificate
   */
  revokeCertificate(id: string | number, reason: string): Observable<Certificate> {
    // Convert id to string for the URL
    const certId = idToString(id);
    return this.post<Certificate>(`certificates/${certId}/revoke`, { reason });
  }

  /**
   * Export a certificate in the specified format
   */
  exportCertificate(id: string | number, format: 'pem' | 'der' | 'pkcs12'): Observable<Blob> {
    // convert id to string for the URL
    const certId = idToString(id);
    return this.get<Blob>(`certificates/${certId}/export/${format}`, {}, {
      responseType: 'blob'
    });
  }

  /**
   * Get all certificate providers
   */
  getCertificateProviders(): Observable<string[]> {
    return this.get<string[]>('certificates/providers');
  }

  /**
   * Get certificate statistics
   */
  getCertificateStats(): Observable<any> {
    return this.get<any>('certificates/stats', {}, { background: true });
  }

  /**
   * Get certificates expiring soon
   */
  getExpiringCertificates(days: number = 30): Observable<Certificate[]> {
    return this.get<Certificate[]>('certificates/expiring', { days });
  }

  /**
   * Get certificates by authority
   */
  getCertificatesByAuthority(authorityId: number): Observable<Certificate[]> {
    return this.get<Certificate[]>(`certificates/by-authority/${authorityId}`);
  }
}

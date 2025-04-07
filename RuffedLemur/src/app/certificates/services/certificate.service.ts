// src/app/certificates/services/certificate.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Certificate } from '../../shared/models/certificate.model';

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

interface CertificateListParams {
  page?: number;
  size?: number;
  filter?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class CertificateService {
  private apiUrl = `${environment.apiUrl}/certificates`;

  constructor(private http: HttpClient) { }

  getCertificates(params: CertificateListParams = {}): Observable<PaginatedResponse<Certificate>> {
    let httpParams = new HttpParams();

    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }

    if (params.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }

    if (params.filter) {
      httpParams = httpParams.set('filter', params.filter);
    }

    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
      if (params.order) {
        httpParams = httpParams.set('order', params.order);
      }
    }

    return this.http.get<PaginatedResponse<Certificate>>(this.apiUrl, { params: httpParams });
  }

  getCertificate(id: number): Observable<Certificate> {
    return this.http.get<Certificate>(`${this.apiUrl}/${id}`);
  }

  createCertificate(certificate: Partial<Certificate>): Observable<Certificate> {
    return this.http.post<Certificate>(this.apiUrl, certificate);
  }

  updateCertificate(id: number, certificate: Partial<Certificate>): Observable<Certificate> {
    return this.http.put<Certificate>(`${this.apiUrl}/${id}`, certificate);
  }

  revokeCertificate(id: number, reason: string): Observable<Certificate> {
    return this.http.post<Certificate>(`${this.apiUrl}/${id}/revoke`, { reason });
  }

  exportCertificate(id: number, format: 'pem' | 'der' | 'pkcs12'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/export/${format}`, {
      responseType: 'blob'
    });
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CertificateSource, SourcePlugin } from '../../shared/models/certificate-source.model';

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

interface SourceListParams {
  page?: number;
  size?: number;
  filter?: string;
  plugin?: SourcePlugin;
  active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CertificateSourceService {
  private apiUrl = `${environment.apiUrl}/sources`;

  constructor(private http: HttpClient) { }

  getSources(params: SourceListParams = {}): Observable<PaginatedResponse<CertificateSource>> {
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

    if (params.plugin) {
      httpParams = httpParams.set('plugin', params.plugin);
    }

    if (params.active !== undefined) {
      httpParams = httpParams.set('active', params.active.toString());
    }

    return this.http.get<PaginatedResponse<CertificateSource>>(this.apiUrl, { params: httpParams });
  }

  getSource(id: number): Observable<CertificateSource> {
    return this.http.get<CertificateSource>(`${this.apiUrl}/${id}`);
  }

  createSource(source: Partial<CertificateSource>): Observable<CertificateSource> {
    return this.http.post<CertificateSource>(this.apiUrl, source);
  }

  updateSource(id: number, source: Partial<CertificateSource>): Observable<CertificateSource> {
    return this.http.put<CertificateSource>(`${this.apiUrl}/${id}`, source);
  }

  deleteSource(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getSourcePlugins(): Observable<string[]> {
    return this.http.get<string[]>(`${environment.apiUrl}/plugins/source`);
  }

  testSourceConfiguration(source: Partial<CertificateSource>): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/test`, source);
  }

  importCertificates(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/import`, {});
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CSVReportConfig {
  includeColumns: string[];
  filename: string;
  owners?: string[];  // Filter by certificate owners
  days?: number;      // Days before expiration
  authorities?: number[]; // Filter by authority IDs
  sendEmail?: boolean;
  recipients?: string[];
  emailSubject?: string;
  emailBody?: string;
}

export interface CSVReportResult {
  filename: string;
  url?: string;
  count: number;
  sent?: boolean;
  recipients?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CSVReportService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) { }

  /**
   * Generate a CSV report of expiring certificates
   */
  generateExpiringCertificatesReport(config: CSVReportConfig): Observable<CSVReportResult> {
    return this.http.post<CSVReportResult>(`${this.apiUrl}/expiring-certificates`, config);
  }

  /**
   * Generate a CSV report of certificates by owner
   */
  generateCertificatesByOwnerReport(config: CSVReportConfig): Observable<CSVReportResult> {
    return this.http.post<CSVReportResult>(`${this.apiUrl}/certificates-by-owner`, config);
  }

  /**
   * Generate a CSV report of certificates by authority
   */
  generateCertificatesByAuthorityReport(config: CSVReportConfig): Observable<CSVReportResult> {
    return this.http.post<CSVReportResult>(`${this.apiUrl}/certificates-by-authority`, config);
  }

  /**
   * Send a previously generated report to specified recipients
   */
  sendReport(reportId: string, recipients: string[], subject: string, body: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${reportId}/send`, {
      recipients,
      subject,
      body
    });
  }

  /**
   * Download a previously generated report
   */
  downloadReport(reportId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${reportId}/download`, {
      responseType: 'blob'
    });
  }

  /**
   * Get list of available reports
   */
  getReports(): Observable<CSVReportResult[]> {
    return this.http.get<CSVReportResult[]>(`${this.apiUrl}`);
  }

  /**
   * Schedule an automatic report to be generated and sent
   */
  scheduleReport(config: CSVReportConfig, schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number; // 0-6, where 0 is Sunday (for weekly)
    dayOfMonth?: number; // 1-31 (for monthly)
    time: string; // HH:MM format
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/schedule`, {
      config,
      schedule
    });
  }
}

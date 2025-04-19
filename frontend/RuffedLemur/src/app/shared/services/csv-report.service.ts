import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth/auth.service';
import { idToString } from '../../shared/utils/type-guard';

export interface CSVReportConfig {
  includeColumns: string[];
  filename: string;
  owners?: string[];  // Filter by certificate owners
  days?: number;      // Days before expiration
  authorities?: (string | number)[];  // Filter by authority IDs, supporting string or number
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

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  /**
   * Generate a CSV report of expiring certificates
   */
  generateExpiringCertificatesReport(config: CSVReportConfig): Observable<CSVReportResult> {
    // Convert authority IDs to strings if present
    if (config.authorities) {
      config.authorities = config.authorities.map(id => idToString(id));
    }

    return this.authService.getCsrfToken().pipe(
      switchMap(csrfResponse => {
        return this.http.post<CSVReportResult>(
          `${this.apiUrl}/expiring-certificates`,
          config,
          {
            headers: {
              'X-CSRF-TOKEN': csrfResponse.token
            },
            withCredentials: true
          }
        );
      })
    );
  }

  /**
   * Generate a CSV report of certificates by owner
   */
  generateCertificatesByOwnerReport(config: CSVReportConfig): Observable<CSVReportResult> {
    // Convert authority IDs to strings if present
    if (config.authorities) {
      config.authorities = config.authorities.map(id => idToString(id));
    }

    return this.authService.getCsrfToken().pipe(
      switchMap(csrfResponse => {
        return this.http.post<CSVReportResult>(
          `${this.apiUrl}/certificates-by-owner`,
          config,
          {
            headers: {
              'X-CSRF-TOKEN': csrfResponse.token
            },
            withCredentials: true
          }
        );
      })
    );
  }

  /**
   * Generate a CSV report of certificates by authority
   */
  generateCertificatesByAuthorityReport(config: CSVReportConfig): Observable<CSVReportResult> {
    // Convert authority IDs to strings if present
    if (config.authorities) {
      config.authorities = config.authorities.map(id => idToString(id));
    }

    return this.authService.getCsrfToken().pipe(
      switchMap(csrfResponse => {
        return this.http.post<CSVReportResult>(
          `${this.apiUrl}/certificates-by-authority`,
          config,
          {
            headers: {
              'X-CSRF-TOKEN': csrfResponse.token
            },
            withCredentials: true
          }
        );
      })
    );
  }

  /**
   * Send a previously generated report to specified recipients
   */
  sendReport(
    reportId: string | number,
    recipients: string[],
    subject: string,
    body: string
  ): Observable<any> {
    return this.authService.getCsrfToken().pipe(
      switchMap(csrfResponse => {
        return this.http.post(
          `${this.apiUrl}/${idToString(reportId)}/send`,
          {
            recipients,
            subject,
            body
          },
          {
            headers: {
              'X-CSRF-TOKEN': csrfResponse.token
            },
            withCredentials: true
          }
        );
      })
    );
  }

  /**
   * Download a previously generated report
   */
  downloadReport(reportId: string | number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/${idToString(reportId)}/download`,
      {
        responseType: 'blob'
      }
    );
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
  scheduleReport(
    config: CSVReportConfig,
    schedule: {
      frequency: 'daily' | 'weekly' | 'monthly';
      dayOfWeek?: number; // 0-6, where 0 is Sunday (for weekly)
      dayOfMonth?: number; // 1-31 (for monthly)
      time: string; // HH:MM format
    }
  ): Observable<any> {
    // Convert authority IDs to strings if present
    if (config.authorities) {
      config.authorities = config.authorities.map(id => idToString(id));
    }

    return this.authService.getCsrfToken().pipe(
      switchMap(csrfResponse => {
        return this.http.post(
          `${this.apiUrl}/schedule`,
          {
            config,
            schedule
          },
          {
            headers: {
              'X-CSRF-TOKEN': csrfResponse.token
            },
            withCredentials: true
          }
        );
      })
    );
  }
}

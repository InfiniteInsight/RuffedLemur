import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Notification,
  NotificationConfig,
  NotificationType,
  NotificationPlugin
} from '../../shared/models/notification.model';
import { AuthService } from '../../core/services/auth/auth.service';
import { isStringId, idToString } from '../../shared/utils/type-guard';

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

interface NotificationListParams {
  page?: number;
  size?: number;
  type?: NotificationType;
  read?: boolean;
  sort?: string;
  order?: 'asc' | 'desc';
}

interface NotificationConfigListParams {
  page?: number;
  size?: number;
  filter?: string;
  plugin?: NotificationPlugin;
  active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;
  private configApiUrl = `${environment.apiUrl}/notification-configurations`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // User Notification Methods
  getNotifications(params: NotificationListParams = {}): Observable<PaginatedResponse<Notification>> {
    let httpParams = new HttpParams();

    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }

    if (params.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }

    if (params.type) {
      httpParams = httpParams.set('type', params.type);
    }

    if (params.read !== undefined) {
      httpParams = httpParams.set('read', params.read.toString());
    }

    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
      if (params.order) {
        httpParams = httpParams.set('order', params.order);
      }
    }

    return this.http.get<PaginatedResponse<Notification>>(this.apiUrl, { params: httpParams });
  }

  getNotification(id: string | number): Observable<Notification> {
    return this.http.get<Notification>(`${this.apiUrl}/${idToString(id)}`);
  }

  markAsRead(id: string | number): Observable<Notification> {
    return this.authService.getCsrfToken().pipe(
      switchMap(csrfResponse => {
        return this.http.post<Notification>(
          `${this.apiUrl}/${idToString(id)}/read`,
          {},
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

  markAllAsRead(): Observable<void> {
    return this.authService.getCsrfToken().pipe(
      switchMap(csrfResponse => {
        return this.http.post<void>(
          `${this.apiUrl}/read-all`,
          {},
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

  deleteNotification(id: string | number): Observable<void> {
    return this.authService.getCsrfToken().pipe(
      switchMap(csrfResponse => {
        return this.http.delete<void>(
          `${this.apiUrl}/${idToString(id)}`,
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

  sendNotification(notification: Partial<Notification>): Observable<Notification> {
    return this.authService.getCsrfToken().pipe(
      switchMap(csrfResponse => {
        return this.http.post<Notification>(
          `${this.apiUrl}/send`,
          notification,
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

  // Notification Configuration Methods
  getNotificationConfigs(params: NotificationConfigListParams = {}): Observable<PaginatedResponse<NotificationConfig>> {
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

    return this.http.get<PaginatedResponse<NotificationConfig>>(this.configApiUrl, { params: httpParams });
  }

  getNotificationConfig(id: string | number): Observable<NotificationConfig> {
    // Fixed URL formatting - removed extra $ character
    return this.http.get<NotificationConfig>(`${this.configApiUrl}/${idToString(id)}`);
  }

  createNotificationConfig(config: Partial<NotificationConfig>): Observable<NotificationConfig> {
    return this.authService.getCsrfToken().pipe(
      switchMap(csrfResponse => {
        return this.http.post<NotificationConfig>(
          this.configApiUrl,
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

  updateNotificationConfig(id: string | number, config: Partial<NotificationConfig>): Observable<NotificationConfig> {
    // Fixed to use PUT and proper endpoint
    return this.authService.getCsrfToken().pipe(
      switchMap(csrfResponse => {
        return this.http.put<NotificationConfig>(
          `${this.configApiUrl}/${idToString(id)}`,
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

  deleteNotificationConfig(id: string | number): Observable<void> {
    return this.authService.getCsrfToken().pipe(
      switchMap(csrfResponse => {
        return this.http.delete<void>(
          `${this.configApiUrl}/${idToString(id)}`,
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

  getNotificationPlugins(): Observable<string[]> {
    return this.http.get<string[]>(`${environment.apiUrl}/plugins/notification`);
  }

  testNotificationConfig(config: Partial<NotificationConfig>): Observable<any> {
    return this.authService.getCsrfToken().pipe(
      switchMap(csrfResponse => {
        return this.http.post<any>(
          `${this.configApiUrl}/test`,
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

  // Methods for handling file uploads for attachments
  uploadAttachment(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.authService.getCsrfToken().pipe(
      switchMap(csrfResponse => {
        return this.http.post<any>(
          `${this.apiUrl}/upload-attachment`,
          formData,
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

  // Methods for handling specific notifications
  sendCsvReport(certificateIds: (string | number)[], recipients: string[], subject?: string): Observable<any> {
    // Convert all IDs to strings
    const stringIds = certificateIds.map(id => idToString(id));

    return this.authService.getCsrfToken().pipe(
      switchMap(csrfResponse => {
        return this.http.post<any>(
          `${this.apiUrl}/csv-report`,
          {
            certificateIds: stringIds,
            recipients,
            subject: subject || 'Certificate Expiration Report'
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

  // Validate SMTP config
  testSmtpConnection(config: Partial<NotificationConfig>): Observable<any> {
    return this.authService.getCsrfToken().pipe(
      switchMap(csrfResponse => {
        return this.http.post<any>(
          `${this.configApiUrl}/test-smtp`,
          {
            smtpServer: config.smtpServer,
            smtpPort: config.smtpPort,
            smtpUser: config.smtpUser,
            smtpPassword: config.smtpPassword
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

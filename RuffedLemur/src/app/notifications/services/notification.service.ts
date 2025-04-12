import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Notification,
  NotificationConfig,
  NotificationType,
  NotificationPlugin

} from '../../shared/models/notification.model'

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


  constructor(private http: HttpClient) { }

  //User Notification Methods
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

  getNotification(id: number): Observable<Notification> {
    return this.http.get<Notification>(`${this.apiUrl}/${id}`);
  }

  markAsRead(id: number): Observable<Notification> {
    return this.http.post<Notification>(`${this.apiUrl}/${id}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/read-all`, {});
  }

  deleteNotification(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  sendNotification(notification: Partial<Notification>): Observable<Notification> {
    return this.http.post<Notification>(`${this.apiUrl}/send`, notification);
  }

  //Notification Configuration Methods
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

  getNotificationConfig(id: number): Observable<NotificationConfig> {
    return this.http.get<NotificationConfig>(`${this.configApiUrl}/$${id}`);
  }

  createNotificationConfig(config: Partial<NotificationConfig>): Observable<NotificationConfig> {
    return this.http.post<NotificationConfig>(this.configApiUrl, config);
  }

  updateNotificationConfig(id: number, config: Partial<NotificationConfig>): Observable<NotificationConfig> {
    return this.http.post<NotificationConfig>(this.configApiUrl, config);
  }

  deleteNotificationConfig(id: number): Observable<void> {
    return this.http.delete<void>(`${this.configApiUrl}/${id}`);
  }

  getNotificationPlugins(): Observable<string[]> {
    return this.http.get<string[]>(`${environment.apiUrl}/plugins/notification`);
  }

  testNotificationConfig(config: Partial<NotificationConfig>): Observable<any> {
    return this.http.post<any>(`${this.configApiUrl}/test`, config);
  }

  //methods for handling file uploads for attachments
  uploadAttachment(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post<any>(`${this.apiUrl}/upload-attachment`, formData);
  }

  //Validate SMTP config
  testSmtpConnection(config: Partial<NotificationConfig>): Observable<any> {
    return this.http.post<any>(`${this.configApiUrl}/test-smtp`, {
      smtpServer: config.smtpServer,
      smtpPort: config.stmpPort,
      smtpUser: config.smtpUser,
      smtpPassword: config.smtpPassword
    });
  }
}

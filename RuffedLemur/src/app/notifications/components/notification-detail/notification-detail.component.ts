// src/app/notifications/components/notification-detail/notification-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Notification,
  NotificationLevel,
  NotificationType
} from '../../../shared/models/notification.model';
import { NotificationService } from '../../services/notification.service';
import { ErrorService } from '../../../core/services/error/error.service';

@Component({
  selector: 'app-notification-detail',
  templateUrl: './notification-detail.component.html',
  styleUrls: ['./notification-detail.component.scss']
})
export class NotificationDetailComponent implements OnInit {
  notificationId: number;
  notification: Notification | null = null;
  isLoading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService,
    private errorService: ErrorService
  ) {
    this.notificationId = +this.route.snapshot.paramMap.get('id')!;
  }

  ngOnInit(): void {
    this.loadNotification();
  }

  loadNotification(): void {
    this.isLoading = true;
    this.notificationService.getNotification(this.notificationId).subscribe({
      next: (data) => {
        this.notification = data;

        // Mark as read if not already read
        if (!data.read) {
          this.markAsRead();
        } else {
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.error = 'Failed to load notification details';
        this.errorService.logError(err);
        this.isLoading = false;
      }
    });
  }

  markAsRead(): void {
    this.notificationService.markAsRead(this.notificationId).subscribe({
      next: (data) => {
        this.notification = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorService.logError(err);
        this.isLoading = false;
      }
    });
  }

  deleteNotification(): void {
    if (confirm('Are you sure you want to delete this notification?')) {
      this.notificationService.deleteNotification(this.notificationId).subscribe({
        next: () => {
          this.router.navigate(['/notifications']);
        },
        error: (err) => {
          this.errorService.logError(err);
        }
      });
    }
  }

  getLevelClass(): string {
    if (!this.notification) return '';

    switch (this.notification.level) {
      case NotificationLevel.INFO:
        return 'info-level';
      case NotificationLevel.WARNING:
        return 'warning-level';
      case NotificationLevel.ERROR:
        return 'error-level';
      case NotificationLevel.SUCCESS:
        return 'success-level';
      case NotificationLevel.EXPIRATION:
        return 'expiration-level';
      default:
        return '';
    }
  }

  getLevelIcon(): string {
    if (!this.notification) return '';

    switch (this.notification.level) {
      case NotificationLevel.INFO:
        return 'info';
      case NotificationLevel.WARNING:
        return 'warning';
      case NotificationLevel.ERROR:
        return 'error';
      case NotificationLevel.SUCCESS:
        return 'check_circle';
      case NotificationLevel.EXPIRATION:
        return 'alarm';
      default:
        return 'message';
    }
  }

  getLevelLabel(): string {
    if (!this.notification) return '';

    return this.notification.level.charAt(0).toUpperCase() + this.notification.level.slice(1);
  }

  downloadAttachment(): void {
    // TO DO: Handle attachment download - would need to be implemented in the service
    // This is a placeholder for the functionality
    // This is to download any attachments that that were sent to users as notifications
    console.log('Download attachment:', this.notification?.attachment);
  }

  goBack(): void {
    this.router.navigate(['/notifications']);
  }
}

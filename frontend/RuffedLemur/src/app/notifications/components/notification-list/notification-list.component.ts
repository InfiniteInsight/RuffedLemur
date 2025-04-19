import { Component, OnInit, OnDestroy } from "@angular/core";
import { PageEvent } from "@angular/material/paginator";
import { MatTabChangeEvent } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  Notification,
  NotificationLevel,
  NotificationType
} from '../../../shared/models/notification.model';
import { NotificationService } from "../../services/notification.service";
import { ErrorService } from "../../../core/services/error/error.service";
import { ConfirmationDialogComponent } from "../../../shared/components/confirmation-dialog/confirmation-dialog.component";
import { idToString } from '../../../shared/utils/type-guard';
import { ApiNotificationService } from "../../../core/services/api-notification/api-notification.service";

@Component({
  selector: 'app-notification-list',
  templateUrl: './notification-list.component.html', // Fixed template path
  styleUrls: ['./notification-list.component.scss']
})
export class NotificationListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  notifications: Notification[] = [];
  displayedColumns: string[] = ['level', 'subject', 'message', 'createdAt', 'actions'];
  isLoading = true;
  error = '';

  // Pagination
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;
  pageSizeOptions = [5, 10, 25, 50, 100, 150, 200, 250, 500, 1000];

  // Filtering
  activeTab = 0; // 0 = All, 1 = Unread
  selectedType: NotificationType | null = null;
  notificationTypes = Object.values(NotificationType);

  constructor(
    private notificationService: NotificationService,
    private errorService: ErrorService,
    private apiNotificationService: ApiNotificationService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications(): void {
    this.isLoading = true;

    // Create params based on active filters
    const params: any = {
      page: this.currentPage,
      size: this.pageSize,
    };

    // Add read filter based on tab
    if (this.activeTab === 1) {
      params.read = false;
    }

    // Add type filter if selected
    if (this.selectedType) {
      params.type = this.selectedType;
    }

    this.notificationService.getNotifications(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.notifications = data.items;
          this.totalItems = data.total;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to load notifications';
          this.errorService.logError(err);
          this.apiNotificationService.error('Failed to load notifications');
          this.isLoading = false;
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadNotifications();
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.activeTab = event.index;
    this.currentPage = 0;
    this.loadNotifications();
  }

  filterByType(type: NotificationType | null): void {
    this.selectedType = type;
    this.currentPage = 0;
    this.loadNotifications();
  }

  markAsRead(notification: Notification): void {
    if (notification.read) return;

    this.notificationService.markAsRead(notification.id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedNotification) => {
          const index = this.notifications.findIndex(n => n.id === notification.id);
          if (index !== -1) {
            this.notifications[index] = updatedNotification;
          }
          this.apiNotificationService.success('Notification marked as read');
        },
        error: (err) => {
          this.errorService.logError(err);
          this.apiNotificationService.error('Failed to mark notification as read');
        }
      });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadNotifications();
          this.apiNotificationService.success('All notifications marked as read');
        },
        error: (err) => {
          this.errorService.logError(err);
          this.apiNotificationService.error('Failed to mark all notifications as read');
        }
      });
  }

  deleteNotification(notification: Notification): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Notification',
        message: `Are you sure you want to delete this notification?`,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.notificationService.deleteNotification(notification.id!)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.loadNotifications();
                this.apiNotificationService.success('Notification deleted successfully');
              },
              error: (err) => {
                this.errorService.logError(err);
                this.apiNotificationService.error('Failed to delete notification');
              }
            });
        }
      });
  }

  getLevelClass(level: NotificationLevel): string {
    switch(level) {
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

  getLevelIcon(level: NotificationLevel): string {
    switch (level) {
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

  getTypeLabel(type: NotificationType): string {
    return type.replace(/_/g, ' ').toLowerCase();
  }
}

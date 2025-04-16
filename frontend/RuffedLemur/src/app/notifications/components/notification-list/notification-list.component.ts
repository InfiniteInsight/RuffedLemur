import { Component, OnInit } from "@angular/core";
import { PageEvent } from "@angular/material/paginator";
import { MatTab, MatTabChangeEvent } from '@angular/material/tabs';
import {
  Notification,
  NotificationLevel,
  NotificationType
} from '../../../shared/models/notification.model'
import { NotificationService } from "../../services/notification.service";
import { ErrorService } from "../../../core/services/error/error.service";

@Component({
  selector: 'app-notification-list',
  templateUrl: './notifications-list.component.html',
  styleUrls: ['./notification-list.component.scss']
})
export class NotificationListComponent implements OnInit {
  notifications: Notification[] = [];
  displayedColumns: string[] = ['level', 'subject', 'message', 'createdAt', 'actions'];
  isLoading = true;
  error = '';

  //pagination
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;
  pageSizeOptions = [5, 10, 25, 50, 100, 150, 200, 250, 500];

  //filtering
  activeTab = 0; // 0 = All, 1 = Unread
  selectedType: NotificationType | null = null;
  notificationTypes = Object.values(NotificationType);

  constructor(
    private notificationService: NotificationService,
    private errorService: ErrorService
  ) { }

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.isLoading = true;

    //Create params based on active filters
    const params: any = {
      page: this.currentPage,
      size: this.pageSize,
    };

    //add read filter based on tab
    if (this.activeTab === 1) {
      params.read = false;
    }

    //add type filter if selected
    if (this.selectedType) {
      params.type = this.selectedType;
    }

    this.notificationService.getNotifications(params).subscribe({
      next: (data) => {
        this.notifications = data.items;
        this.totalItems = data.total;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load notifications';
        this.errorService.logError(err);
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

    this.notificationService.markAsRead(notification.id!).subscribe({
      next: (updateNotification) => {
        const index = this.notifications.findIndex(n => n.id === notification.id);
        if (index !== -1) {
          this.notifications[index] = updateNotification;
        }
      },
      error: (err) => {
        this.errorService.logError(err);
      }
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.loadNotifications();
      },
      error: (err) => {
        this.errorService.logError(err);
      }
    });
  }

  deleteNotification(notification: Notification): void {
    if (confirm('Are you sure you want to delete this notification?')) {
      this.notificationService.deleteNotification(notification.id!).subscribe({
        next: () => {
          this.loadNotifications();
        },
        error: (err) => {
          this.errorService.logError(err);
        }
      });
    }
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

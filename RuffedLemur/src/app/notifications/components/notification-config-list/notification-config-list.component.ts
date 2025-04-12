// src/app/notifications/components/notification-config-list/notification-config-list.component.ts
import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import {
  NotificationConfig,
  NotificationPlugin
} from '../../../shared/models/notification.model';
import { NotificationService } from '../../services/notification.service';
import { ErrorService } from '../../../core/services/error/error.service';

@Component({
  selector: 'app-notification-config-list',
  templateUrl: './notification-config-list.component.html',
  styleUrls: ['./notification-config-list.component.scss']
})
export class NotificationConfigListComponent implements OnInit {
  configs: NotificationConfig[] = [];
  displayedColumns: string[] = ['name', 'plugin', 'active', 'actions'];
  isLoading = true;
  error = '';

  // Pagination
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;
  pageSizeOptions = [5, 10, 25, 50, 100, 150, 200, 250, 500];

  // Filtering
  filterText = '';
  selectedPlugin: NotificationPlugin | null = null;
  pluginTypes = Object.values(NotificationPlugin);

  constructor(
    private notificationService: NotificationService,
    private errorService: ErrorService
  ) { }

  ngOnInit(): void {
    this.loadConfigs();
  }

  loadConfigs(): void {
    this.isLoading = true;

    const params: any = {
      page: this.currentPage,
      size: this.pageSize,
    };

    if (this.filterText) {
      params.filter = this.filterText;
    }

    if (this.selectedPlugin) {
      params.plugin = this.selectedPlugin;
    }

    this.notificationService.getNotificationConfigs(params).subscribe({
      next: (data) => {
        this.configs = data.items;
        this.totalItems = data.total;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load notification configurations';
        this.errorService.logError(err);
        this.isLoading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadConfigs();
  }

  applyFilter(): void {
    this.currentPage = 0;
    this.loadConfigs();
  }

  clearFilter(): void {
    this.filterText = '';
    this.applyFilter();
  }

  filterByPlugin(plugin: NotificationPlugin | null): void {
    this.selectedPlugin = plugin;
    this.currentPage = 0;
    this.loadConfigs();
  }

  toggleActive(config: NotificationConfig): void {
    const updatedConfig = {
      ...config,
      active: !config.active
    };

    this.notificationService.updateNotificationConfig(config.id!, { active: !config.active }).subscribe({
      next: () => {
        const index = this.configs.findIndex(c => c.id === config.id);
        if (index !== -1) {
          this.configs[index].active = !config.active;
        }
      },
      error: (err) => {
        this.errorService.logError(err);
      }
    });
  }

  deleteConfig(config: NotificationConfig): void {
    if (confirm(`Are you sure you want to delete "${config.name}"? This action cannot be undone.`)) {
      this.notificationService.deleteNotificationConfig(config.id!).subscribe({
        next: () => {
          this.loadConfigs();
        },
        error: (err) => {
          this.errorService.logError(err);
        }
      });
    }
  }
}

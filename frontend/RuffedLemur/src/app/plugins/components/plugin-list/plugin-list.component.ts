// frontend/RuffedLemur/src/app/plugins/components/plugin-list/plugin-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth/auth.service';
import { Plugin, PluginType, PluginStat } from '../../../shared/models/plugin.model';
import { PluginService } from '../../services/plugin.service';
import { ErrorService } from '../../../core/services/error/error.service';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { PluginInstallDialogComponent } from '../plugin-install-dialog/plugin-install-dialog.component';

@Component({
  selector: 'app-plugin-list',
  templateUrl: './plugin-list.component.html',
  styleUrls: ['./plugin-list.component.scss']
})
export class PluginListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  plugins: Plugin[] = [];
  displayedColumns: string[] = ['name', 'type', 'version', 'author', 'enabled', 'actions'];
  isLoading = true;
  error = '';
  stats: PluginStat[] = [];
  isLoadingStats = true;

  // Pagination
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;
  pageSizeOptions = [5, 10, 25, 50];

  // Filtering
  filterText = '';
  selectedType: PluginType | null = null;
  pluginTypes = Object.values(PluginType);

  constructor(
    private pluginService: PluginService,
    private errorService: ErrorService,
    private dialog: MatDialog,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadPlugins();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPlugins(): void {
    this.isLoading = true;
    this.error = '';

    const params: any = {
      page: this.currentPage,
      size: this.pageSize,
    };

    if (this.filterText) {
      params.filter = this.filterText;
    }

    if (this.selectedType) {
      params.type = this.selectedType;
    }

    this.pluginService.getPlugins(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if ('items' in response) {
            this.plugins = response.items;
            this.totalItems = response.total;
          } else {
            this.plugins = [];
            this.totalItems = 0;
            this.errorService.showError('Unexpected response format from server');
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to load plugins';
          this.errorService.handleError(err, 'Loading Plugins');
          this.isLoading = false;
        }
      });
  }

  loadStats(): void {
    this.isLoadingStats = true;

    this.pluginService.getPluginStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.stats = data;
          this.isLoadingStats = false;
        },
        error: (err) => {
          this.errorService.handleError(err, 'Loading Plugin Statistics');
          this.isLoadingStats = false;
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadPlugins();
  }

  applyFilter(): void {
    this.currentPage = 0; // Reset to first page when filtering
    this.loadPlugins();
  }

  clearFilter(): void {
    this.filterText = '';
    this.selectedType = null;
    this.applyFilter();
  }

  filterByType(type: PluginType | null): void {
    this.selectedType = type;
    this.applyFilter();
  }

  /**
   * Check if user has permission to perform an action
   */
  canPerformAction(action: string): boolean {
    return this.authService.hasPermission(`plugin:${action}`);
  }

  togglePluginStatus(plugin: Plugin): void {
    if (!this.canPerformAction('update')) {
      this.errorService.showError('You do not have permission to perform this action');
      return;
    }

    const action = plugin.enabled ?
      this.pluginService.disablePlugin(plugin.id!) :
      this.pluginService.enablePlugin(plugin.id!);

    const actionName = plugin.enabled ? 'disable' : 'enable';

    action
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedPlugin) => {
          const index = this.plugins.findIndex(p => p.id === plugin.id);
          if (index !== -1) {
            this.plugins[index].enabled = updatedPlugin.enabled;
          }
          // Show success notification
          this.errorService.showSuccess(`Plugin ${plugin.name} ${actionName}d successfully`);
          // Refresh stats after toggling
          this.loadStats();
        },
        error: (err) => {
          // More detailed error handling with specific message
          let errorMessage = `Failed to ${actionName} plugin`;

          if (err.status === 403) {
            errorMessage = `You don't have permission to ${actionName} this plugin`;
          } else if (err.status === 409) {
            errorMessage = `Cannot ${actionName} plugin. It may be in use by other components`;
          }

          this.errorService.handleError(err, errorMessage);
        }
      });
  }

  installPlugin(): void {
    if (!this.canPerformAction('create')) {
      this.errorService.showError('You do not have permission to perform this action');
      return;
    }

    this.pluginService.getAvailablePlugins()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (availablePlugins) => {
          const dialogRef = this.dialog.open(PluginInstallDialogComponent, {
            width: '600px',
            data: { availablePlugins }
          });

          dialogRef.afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe(selectedPlugin => {
              if (selectedPlugin) {
                this.executePluginInstallation(selectedPlugin.name);
              }
            });
        },
        error: (err) => {
          this.errorService.handleError(err, 'Loading Available Plugins');
        }
      });
  }

  private executePluginInstallation(pluginName: string): void {
    this.pluginService.installPlugin(pluginName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (installedPlugin) => {
          this.loadPlugins();
          this.loadStats();
          this.errorService.showSuccess(`Plugin ${installedPlugin.name} installed successfully`);
        },
        error: (err) => {
          this.errorService.handleError(err, 'Installing Plugin');
        }
      });
  }

  uninstallPlugin(plugin: Plugin): void {
    if (!this.canPerformAction('delete')) {
      this.errorService.showError('You do not have permission to perform this action');
      return;
    }

    if (plugin.enabled) {
      this.errorService.showError('Please disable the plugin before uninstalling');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirm Plugin Uninstallation',
        message: `Are you sure you want to uninstall "${plugin.name}"? This action cannot be undone.`,
        confirmButtonText: 'Uninstall',
        cancelButtonText: 'Cancel',
        type: 'danger'
      } as ConfirmationDialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.pluginService.uninstallPlugin(plugin.id!)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.loadPlugins();
                this.loadStats();
                this.errorService.showSuccess(`Plugin ${plugin.name} uninstalled successfully`);
              },
              error: (err) => {
                this.error = 'Failed to uninstall plugin';
                this.errorService.handleError(err, 'Plugin Uninstallation');
              }
            });
        }
      });
  }

  getPluginTypeLabel(type: PluginType): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  getStatForType(type: PluginType): number {
    const stat = this.stats.find(s => s.type === type);
    return stat ? stat.enabledCount : 0;
  }

  getTotalPluginsCount(): number {
    return this.stats.reduce((sum, stat) => sum + stat.count, 0);
  }

  getTotalEnabledPluginsCount(): number {
    return this.stats.reduce((sum, stat) => sum + stat.enabledCount, 0);
  }
}

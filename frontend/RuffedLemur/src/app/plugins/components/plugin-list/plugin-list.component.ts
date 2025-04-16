// src/app/plugins/components/plugin-list/plugin-list.component.ts

import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { Plugin, PluginType, PluginStat } from '../../../shared/models/plugin.model';
import { PluginService } from '../../services/plugin.service';
import { ErrorService } from '../../../core/services/error/error.service';

@Component({
  selector: 'app-plugin-list',
  templateUrl: './plugin-list.component.html',
  styleUrls: ['./plugin-list.component.scss']
})
export class PluginListComponent implements OnInit {
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
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadPlugins();
    this.loadStats();
  }

  loadPlugins(): void {
    this.isLoading = true;

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

    this.pluginService.getPlugins(params).subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.plugins = data;
          this.totalItems = data.length;
        } else if (data && data.items) {
          this.plugins = data.items;
          this.totalItems = data.total;
        } else {
          this.plugins = [];
          this.totalItems = 0;
          console.warn('Unexpected response format from plugin service', data);
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load plugins';
        this.errorService.logError(err);
        this.isLoading = false;
      }
    });
  }

  loadStats(): void {
    this.isLoadingStats = true;
    this.pluginService.getPluginStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.isLoadingStats = false;
      },
      error: (err) => {
        this.errorService.logError(err);
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

  togglePluginStatus(plugin: Plugin): void {
    const action = plugin.enabled ?
      this.pluginService.disablePlugin(plugin.id!) :
      this.pluginService.enablePlugin(plugin.id!);

    action.subscribe({
      next: (updatedPlugin) => {
        const index = this.plugins.findIndex(p => p.id === plugin.id);
        if (index !== -1) {
          this.plugins[index].enabled = updatedPlugin.enabled;
        }
        // Refresh stats after toggling
        this.loadStats();
      },
      error: (err) => {
        this.errorService.logError(err);
        // Show error notification
      }
    });
  }

  installPlugin(): void {
    // In a complete implementation, this would open a dialog to select a plugin to install
    // For now, we'll just log a message
    console.log('Install plugin functionality would be implemented here');
    // This would typically involve:
    // 1. Opening a dialog showing available plugins
    // 2. Selecting a plugin to install
    // 3. Calling this.pluginService.installPlugin(selectedPlugin)
    // 4. Refreshing the plugin list
  }

  uninstallPlugin(plugin: Plugin): void {
    if (confirm(`Are you sure you want to uninstall "${plugin.name}"? This action cannot be undone.`)) {
      this.pluginService.uninstallPlugin(plugin.id!).subscribe({
        next: () => {
          // Remove from list or refresh
          this.loadPlugins();
          this.loadStats();
        },
        error: (err) => {
          this.error = 'Failed to uninstall plugin';
          this.errorService.logError(err);
        }
      });
    }
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

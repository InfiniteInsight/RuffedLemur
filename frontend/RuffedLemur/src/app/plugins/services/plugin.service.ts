// frontend/RuffedLemur/src/app/plugins/services/plugin.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api/api.service';
import { ErrorService } from '../../core/services/error/error.service';
import { Plugin, PluginType, PluginStat, AvailablePlugin } from '../../shared/models/plugin.model';
import { idToString } from '../../shared/utils/type-guard';

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

interface PluginListParams {
  page?: number;
  size?: number;
  filter?: string;
  type?: PluginType;
  enabled?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PluginService {
  private endpoint = 'plugins';

  constructor(
    private apiService: ApiService,
    private errorService: ErrorService
  ) { }

  /**
   * Get plugins with filtering and pagination
   */
  getPlugins(params: PluginListParams = {}): Observable<PaginatedResponse<Plugin>> {
    try {
      return this.apiService.get<PaginatedResponse<Plugin>>(this.endpoint, params);
    } catch (error) {
      this.errorService.handleError(error, 'Loading Plugins');
      throw error;
    }
  }

  /**
   * Get a single plugin by ID
   */
  getPlugin(id: string | number): Observable<Plugin> {
    try {
      return this.apiService.get<Plugin>(`${this.endpoint}/${idToString(id)}`);
    } catch (error) {
      this.errorService.handleError(error, 'Loading Plugin');
      throw error;
    }
  }

  /**
   * Update a plugin
   */
  updatePlugin(id: string | number, plugin: Partial<Plugin>): Observable<Plugin> {
    try {
      return this.apiService.put<Plugin>(`${this.endpoint}/${idToString(id)}`, plugin);
    } catch (error) {
      this.errorService.handleError(error, 'Updating Plugin');
      throw error;
    }
  }

  /**
   * Enable a plugin
   */
  enablePlugin(id: string | number): Observable<Plugin> {
    try {
      return this.apiService.post<Plugin>(`${this.endpoint}/${idToString(id)}/enable`, {});
    } catch (error) {
      this.errorService.handleError(error, 'Enabling Plugin');
      throw error;
    }
  }

  /**
   * Disable a plugin
   */
  disablePlugin(id: string | number): Observable<Plugin> {
    try {
      return this.apiService.post<Plugin>(`${this.endpoint}/${idToString(id)}/disable`, {});
    } catch (error) {
      this.errorService.handleError(error, 'Disabling Plugin');
      throw error;
    }
  }

  /**
   * Get plugin statistics
   */
  getPluginStats(): Observable<PluginStat[]> {
    try {
      return this.apiService.get<PluginStat[]>(`${this.endpoint}/stats`);
    } catch (error) {
      this.errorService.handleError(error, 'Loading Plugin Statistics');
      throw error;
    }
  }

/**
 * Get available plugins for installation
 */
getAvailablePlugins(): Observable<AvailablePlugin[]> {
  try {
    return this.apiService.get<AvailablePlugin[]>(`${this.endpoint}/available`);
  } catch (error) {
    this.errorService.handleError(error, 'Loading Available Plugins');
    throw error;
  }
}

  /**
   * Install a plugin
   */
  installPlugin(pluginName: string): Observable<Plugin> {
    try {
      return this.apiService.post<Plugin>(`${this.endpoint}/install`, { name: pluginName });
    } catch (error) {
      this.errorService.handleError(error, 'Installing Plugin');
      throw error;
    }
  }

  /**
   * Uninstall a plugin
   */
  uninstallPlugin(id: string | number): Observable<void> {
    try {
      return this.apiService.delete<void>(`${this.endpoint}/${idToString(id)}`);
    } catch (error) {
      this.errorService.handleError(error, 'Uninstalling Plugin');
      throw error;
    }
  }

  /**
   * Test plugin configuration
   */
  testPluginConfiguration(id: string | number, options: any): Observable<boolean> {
    try {
      return this.apiService.post<boolean>(`${this.endpoint}/${idToString(id)}/test`, { options });
    } catch (error) {
      this.errorService.handleError(error, 'Testing Plugin Configuration');
      throw error;
    }
  }
}

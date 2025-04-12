import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Plugin, PluginType, PluginStat } from '../../shared/models/plugin.model';

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
  private apiUrl = `${environment.apiUrl}/plugins`;

  constructor(private http: HttpClient) { }

  getPlugins(params: PluginListParams = {}): Observable<PaginatedResponse<Plugin>> {
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

    if (params.type) {
      httpParams = httpParams.set('type', params.type);
    }

    if (params.enabled !== undefined) {
      httpParams = httpParams.set('enabled', params.enabled.toString());
    }

    return this.http.get<PaginatedResponse<Plugin>>(this.apiUrl, { params: httpParams });
  }

  getPlugin(id: number): Observable<Plugin> {
    return this.http.get<Plugin>(`${this.apiUrl}/${id}`);
  }

  updatePlugin(id: number, plugin: Partial<Plugin>): Observable<Plugin> {
    return this.http.put<Plugin>(`${this.apiUrl}/${id}`, plugin);
  }

  enablePlugin(id: number): Observable<Plugin> {
    return this.http.post<Plugin>(`${this.apiUrl}/${id}/enable`, {});
  }

  disablePlugin(id: number): Observable<Plugin> {
    return this.http.post<Plugin>(`${this.apiUrl}/${id}/disable`, {});
  }

  getPluginStats(): Observable<PluginStat[]> {
    return this.http.get<PluginStat[]>(`${this.apiUrl}/stats`);
  }

  getAvailablePlugins(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/available`);
  }

  installPlugin(pluginName: string): Observable<Plugin> {
    return this.http.post<Plugin>(`${this.apiUrl}/install`, { name: pluginName });
  }

  uninstallPlugin(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

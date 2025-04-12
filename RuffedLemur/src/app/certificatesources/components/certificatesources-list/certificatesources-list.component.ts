import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { CertificateSource, SourcePlugin } from '../../../shared/models/certificate-source.model';
import { CertificateSourceService } from '../../services/certificate-source.service';
import { ErrorService } from '../../../core/services/error/error.service';

@Component({
  selector: 'app-certificate-source-list',
  templateUrl: './certificate-source-list.component.html',
  styleUrls: ['./certificate-source-list.component.scss']
})
export class CertificateSourceListComponent implements OnInit {
  sources: CertificateSource[] = [];
  displayedColumns: string[] = ['name', 'plugin', 'active', 'actions'];
  isLoading = true;
  error = '';
  isImporting = false;
  importSuccess = false;
  importError = '';

  // Pagination
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;
  pageSizeOptions = [5, 10, 25, 50];

  // Filtering
  filterText = '';
  selectedPlugin: SourcePlugin | null = null;
  pluginTypes = Object.values(SourcePlugin);

  constructor(
    private sourceService: CertificateSourceService,
    private errorService: ErrorService
  ) { }

  ngOnInit(): void {
    this.loadSources();
  }

  loadSources(): void {
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

    this.sourceService.getSources(params).subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.sources = data;
          this.totalItems = data.length;
        } else if (data && data.items) {
          this.sources = data.items;
          this.totalItems = data.total;
        } else {
          this.sources = [];
          this.totalItems = 0;
          console.warn('Unexpected response format from source service', data);
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load certificate sources';
        this.errorService.logError(err);
        this.isLoading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadSources();
  }

  applyFilter(): void {
    this.currentPage = 0; // Reset to first page when filtering
    this.loadSources();
  }

  clearFilter(): void {
    this.filterText = '';
    this.selectedPlugin = null;
    this.applyFilter();
  }

  filterByPlugin(plugin: SourcePlugin | null): void {
    this.selectedPlugin = plugin;
    this.currentPage = 0;
    this.loadSources();
  }

  toggleSourceStatus(source: CertificateSource): void {
    const updatedSource = {
      ...source,
      active: !source.active
    };

    this.sourceService.updateSource(source.id!, { active: !source.active }).subscribe({
      next: (data) => {
        const index = this.sources.findIndex(s => s.id === source.id);
        if (index !== -1) {
          this.sources[index].active = data.active;
        }
      },
      error: (err) => {
        this.errorService.logError(err);
        // Revert the toggle if there was an error
      }
    });
  }

  deleteSource(source: CertificateSource): void {
    if (confirm(`Are you sure you want to delete "${source.name}"? This action cannot be undone.`)) {
      this.sourceService.deleteSource(source.id!).subscribe({
        next: () => {
          this.loadSources();
        },
        error: (err) => {
          this.error = 'Failed to delete source';
          this.errorService.logError(err);
        }
      });
    }
  }

  importCertificates(source: CertificateSource): void {
    this.isImporting = true;
    this.importSuccess = false;
    this.importError = '';

    this.sourceService.importCertificates(source.id!).subscribe({
      next: (result) => {
        this.isImporting = false;
        this.importSuccess = true;
        // Optionally show a message with the number of imported certificates
        setTimeout(() => {
          this.importSuccess = false;
        }, 5000); // Clear success message after 5 seconds
      },
      error: (err) => {
        this.isImporting = false;
        this.importError = 'Failed to import certificates';
        this.errorService.logError(err);
      }
    });
  }

  getPluginLabel(plugin: SourcePlugin): string {
    return plugin.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}

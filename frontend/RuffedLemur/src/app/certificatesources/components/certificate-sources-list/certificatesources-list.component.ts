// src/app/certificatesources/components/certificate-source-list/certificate-source-list.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { CertificateSource, SourcePlugin } from '../../../shared/models/certificate-source.model';
import { CertificateSourceService } from '../../services/certificate-source.service';
import { ErrorService } from '../../../core/services/error/error.service';
import { ApiNotificationService } from '../../../core/services/api-notification/api-notification.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-certificate-source-list',
  templateUrl: './certificate-source-list.component.html',
  styleUrls: ['./certificate-source-list.component.scss']
})
export class CertificateSourceListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  sources: CertificateSource[] = [];
  displayedColumns: string[] = ['name', 'plugin', 'active', 'actions'];
  isLoading = true;
  error = '';
  importingSourceId: number | null = null;

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
    private errorService: ErrorService,
    private notificationService: ApiNotificationService,
    private router: Router,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadSources();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSources(): void {
    this.isLoading = true;
    this.error = '';

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

    this.sourceService.getSources(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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
          this.notificationService.error('Failed to load certificate sources');
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

    this.sourceService.updateSource(source.id!, { active: !source.active })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const index = this.sources.findIndex(s => s.id === source.id);
          if (index !== -1) {
            this.sources[index].active = data.active;
          }

          const status = data.active ? 'activated' : 'deactivated';
          this.notificationService.success(`Source "${source.name}" ${status} successfully`);
        },
        error: (err) => {
          this.errorService.logError(err);
          this.notificationService.error(`Failed to update source status`);

          // Revert the toggle if there was an error
          const index = this.sources.findIndex(s => s.id === source.id);
          if (index !== -1) {
            this.sources[index].active = source.active;
          }
        }
      });
  }

  deleteSource(source: CertificateSource): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Source',
        message: `Are you sure you want to delete "${source.name}"? This action cannot be undone.`,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.sourceService.deleteSource(source.id!)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.loadSources();
              this.notificationService.success(`Source "${source.name}" deleted successfully`);
            },
            error: (err) => {
              this.errorService.logError(err);
              this.notificationService.error(`Failed to delete source "${source.name}"`);
            }
          });
      }
    });
  }

  importCertificates(source: CertificateSource): void {
    this.importingSourceId = source.id!;

    this.sourceService.importCertificates(source.id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.importingSourceId = null;
          const total = result.imported + result.updated;

          if (total > 0) {
            this.notificationService.success(
              `Successfully imported ${result.imported} and updated ${result.updated} certificates from "${source.name}"`
            );
          } else {
            this.notificationService.info(`No new certificates found in "${source.name}"`);
          }

          if (result.failed > 0) {
            this.notificationService.warn(`Failed to import ${result.failed} certificates`);
          }
        },
        error: (err) => {
          this.importingSourceId = null;
          this.errorService.logError(err);
          this.notificationService.error(`Failed to import certificates from "${source.name}"`);
        }
      });
  }

  getPluginLabel(plugin: SourcePlugin): string {
    return plugin.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  viewDetails(source: CertificateSource): void {
    this.router.navigate(['/certificatesources', source.id]);
  }
}

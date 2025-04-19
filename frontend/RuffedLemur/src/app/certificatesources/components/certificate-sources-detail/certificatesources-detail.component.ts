// src/app/certificatesources/components/certificate-source-detail/certificate-source-detail.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CertificateSource, SourcePlugin } from '../../../shared/models/certificate-source.model';
import { CertificateSourceService, SourceStats } from '../../services/certificate-source.service';
import { ErrorService } from '../../../core/services/error/error.service';
import { ApiNotificationService } from '../../../core/services/api-notification/api-notification.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { isStringId, isNumberId, idToString, idToNumber } from '../../../shared/utils/type-guard';

@Component({
  selector: 'app-certificate-source-detail',
  templateUrl: './certificate-source-detail.component.html',
  styleUrls: ['./certificate-source-detail.component.scss']
})
export class CertificateSourceDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  sourceId: number = 0;
  source: CertificateSource | null = null;
  sourceStats: SourceStats | null = null;
  isLoading = true;
  isImporting = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sourceService: CertificateSourceService,
    private errorService: ErrorService,
    private notificationService: ApiNotificationService,
    private dialog: MatDialog
  ) {
    const idParam = this.route.snapshot.paramMap.get('id');
    if(idParam) {
      this.sourceId = idToNumber(idParam);
    } else {
      // Handle missing ID by redirecting to list page
      this.router.navigate(['/certificatesources'])
    }
  }

  ngOnInit(): void {
    this.loadSource();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSource(): void {
    this.isLoading = true;
    this.error = '';

    this.sourceService.getSource(this.sourceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.source = data;
          this.loadSourceStats();
        },
        error: (err) => {
          this.error = 'Failed to load certificate source details';
          this.errorService.logError(err);
          this.notificationService.error('Failed to load certificate source details');
          this.isLoading = false;
        }
      });
  }
  loadSourceStats(): void {
    if (!this.source || !this.source.active) {
      this.isLoading = false;
      return;
    }

    this.sourceService.getSourceStats(this.sourceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats: SourceStats) => {
          this.sourceStats = stats;
          this.isLoading = false;
        },
        error: (error: Error) => {
          console.error('Failed to load source stats', error);
          this.errorService.logError(error);
          this.isLoading = false;
        }
      });
  }

  toggleSourceStatus(): void {
    if (!this.source) return;

    this.sourceService.updateSource(this.sourceId, { active: !this.source.active })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.source!.active = data.active;
          const status = data.active ? 'activated' : 'deactivated';
          this.notificationService.success(`Source "${this.source!.label}" ${status} successfully`);

          // If activated, load stats
          if (data.active) {
            this.loadSourceStats();
          }
        },
        error: (err) => {
          this.errorService.logError(err);
          this.notificationService.error('Failed to update source status');
        }
      });
  }

  importCertificates(): void {
    if (!this.source || !this.source.active || this.isImporting) return;

    this.isImporting = true;

    this.sourceService.importCertificates(this.sourceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isImporting = false;
          const total = result.imported + result.updated;

          if (total > 0) {
            this.notificationService.success(
              `Successfully imported ${result.imported} and updated ${result.updated} certificates from "${this.source!.label}"`
            );
          } else {
            this.notificationService.info(`No new certificates found in "${this.source!.label}"`);
          }

          if (result.failed > 0) {
            this.notificationService.warn(`Failed to import ${result.failed} certificates`);
          }

          // Refresh stats after import
          this.loadSourceStats();
        },
        error: (err) => {
          this.isImporting = false;
          this.errorService.logError(err);
          this.notificationService.error(`Failed to import certificates from "${this.source!.label}"`);
        }
      });
  }

  deleteSource(): void {
    if (!this.source) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Source',
        message: `Are you sure you want to delete "${this.source.label}"? This action cannot be undone.`,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.sourceService.deleteSource(this.sourceId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.notificationService.success(`Source "${this.source!.label}" deleted successfully`);
              this.router.navigate(['/certificatesources']);
            },
            error: (err) => {
              this.errorService.logError(err);
              this.notificationService.error(`Failed to delete source "${this.source!.label}"`);
            }
          });
      }
    });
  }


  editSource(): void {
    this.router.navigate(['/certificatesources', this.sourceId, 'edit']);
  }

  getPluginLabel(plugin: SourcePlugin): string {
    return plugin.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  goBack(): void {
    this.router.navigate(['/certificatesources']);
  }

  /**
   * Safely get a nested property from plugin options
   */
  getPluginOptionValue(key: string): any {
    if (this.source && this.source.pluginOptions) {
      return this.source.pluginOptions[key];
    }
    return null;
  }

  /**
   * Format a date string
   */
  formatDate(date: string | Date): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }

    /**
   * Determines if a field value should be masked for security
   * @param key Field key name
   * @returns True if the field should be masked
   */
  isSensitiveField(key: string): boolean {
    return key.toLowerCase().includes('password') ||
          key.toLowerCase().includes('secret') ||
          key.toLowerCase().includes('key') ||
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('auth');
  }

}

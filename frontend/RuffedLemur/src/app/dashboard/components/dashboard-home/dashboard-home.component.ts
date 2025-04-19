// frontend/RuffedLemur/src/app/dashboard/components/dashboard-home/dashboard-home.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

import { StatsWidgetComponent } from '../stats-widget/stats-widget.component';
import { ExpiringCertsWidgetComponent } from '../expiring-certs-widget/expiring-certs-widget.component';
import { DashboardService } from '../../services/dashboard.service';
import { ErrorService } from '../../../core/services/error/error.service';
import {
  CertificateStats,
  CertificateByAuthority,
  ExpiringCertificate
} from '../../../shared/models/dashboard.model';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    StatsWidgetComponent,
    ExpiringCertsWidgetComponent
  ],
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.scss']
})
export class DashboardHomeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  certificateStats: CertificateStats | null = null;
  certificatesByAuthority: CertificateByAuthority[] = [];
  expiringCertificates: ExpiringCertificate[] = [];

  isLoadingStats = true;
  isLoadingAuth = true;
  isLoadingExpiring = true;

  statsError = '';
  authError = '';
  expiringError = '';

  constructor(
    private dashboardService: DashboardService,
    private errorService: ErrorService
  ) { }

  ngOnInit(): void {
    this.loadCertificateStats();
    this.loadCertificatesByAuthority();
    this.loadExpiringCertificates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCertificateStats(): void {
    this.isLoadingStats = true;
    this.statsError = '';

    this.dashboardService.getCertificateStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.certificateStats = stats;
          this.isLoadingStats = false;
        },
        error: (err) => {
          this.statsError = 'Failed to load certificate statistics';
          this.errorService.logError(err);
          this.isLoadingStats = false;
        }
      });
  }

  loadCertificatesByAuthority(): void {
    this.isLoadingAuth = true;
    this.authError = '';

    this.dashboardService.getCertificateByAuthority()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.certificatesByAuthority = data;
          this.isLoadingAuth = false;
        },
        error: (err) => {
          this.authError = 'Failed to load certificates by authority';
          this.errorService.logError(err);
          this.isLoadingAuth = false;
        }
      });
  }

  loadExpiringCertificates(): void {
    this.isLoadingExpiring = true;
    this.expiringError = '';

    this.dashboardService.getExpiringCertificates(30)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.expiringCertificates = data;
          this.isLoadingExpiring = false;
        },
        error: (err) => {
          this.expiringError = 'Failed to load expiring certificates';
          this.errorService.logError(err);
          this.isLoadingExpiring = false;
        }
      });
  }

  // Helper method to determine total certificates for percentage calculations
  getTotalCertificates(): number {
    return this.certificatesByAuthority.reduce((total, auth) => total + (auth.count || 0), 0);
  }
}

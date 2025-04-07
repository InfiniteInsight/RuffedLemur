import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { CertificateStats, CertificateByAuthority, CertificateByOwner, CertificateByDomain, ExpiringCertificate, CertificateBySource, CertificateByTeam, CertificateByTime } from '../../../shared/models/dashboard.model';
import { ErrorService } from '../../../core/services/error/error.service';


@Component({
  selector: 'app-dashboard-home',
  imports: [],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.scss'
})
export class DashboardHomeComponent implements OnInit {
  CertificateStats: CertificateStats | null = null;
  certificatesByAuthority: CertificateByAuthority[] = [];
  certificatesByOwner: CertificateByOwner[] = [];
  certificatesByDomain: CertificateByDomain[]= [];
  certificateBySource: CertificateBySource[] = [];
  certificateByTeam: CertificateByTeam[] = [];
  certificateByTime: CertificateByTime[] = [];
  expiringCertificates: ExpiringCertificate[] = [];
//TO DO: CertificateByHoliday, CertificateOnWeekend, CertificateWithLifeTimeGreaterThan
  isLoading = true;
  error = '';


  constructor(
    private dashboardService: DashboardService,
    private errorService: ErrorService
  ) { }

  ngOnInit(): void {
    this.isLoading = true;

    //Get Certificate Stats
    this.dashboardService.getCertificateStats().subscribe({
      next: (stats) => {
        this.CertificateStats = stats;
        this.loadCertificatesByAuthority();
      },
      error: (err) => {
        this.error = 'Failed to load certificate statistics';
        this.errorService.logError(err);
        this.isLoading = false;
      }
    });
  }

  loadCertificatesByAuthority(): void {
    this.dashboardService.getCertificateByAuthority().subscribe({
      next: (data) => {
        this.certificatesByAuthority = data;
        this.loadExpiringCertificates();
      },
      error: (err) => {
        this.error = 'Failed to load certificates by authority';
        this.errorService.logError(err);
        this.isLoading = false;
      }
    });
  }
  loadExpiringCertificates(): void {
    this.dashboardService.getExpiringCertificates(30).subscribe({
      next: (data) => {
        this.expiringCertificates = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load expiring certificates';
        this.errorService.logError(err);
        this.isLoading = false;
      }
    });
  }
}


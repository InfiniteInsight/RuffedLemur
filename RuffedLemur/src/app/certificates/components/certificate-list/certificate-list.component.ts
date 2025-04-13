// src/app/certificates/components/certificate-list/certificate-list.component.ts
import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Certificate } from '../../../shared/models/certificate.model';
import { CertificateService } from '../../services/certificate.service';
import { ErrorService } from '../../../core/services/error/error.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-certificate-list',
  templateUrl: './certificate-list.component.html',
  styleUrls: ['./certificate-list.component.scss']
})
export class CertificateListComponent implements OnInit {
  certificates: Certificate[] = [];
  displayedColumns: string[] = ['name', 'commonName', 'san', 'notAfter', 'issuer', 'status', 'owner', 'team', 'fingerprint', 'actions'];

  //loading and error state
  isLoading = true;
  loadingError = '';
  showRetry = false;

  // Pagination
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;
  pageSizeOptions = [5, 10, 25, 50, 100, 200, 500];

  // Filtering
  filterText = '';

  constructor(
    private certificateService: CertificateService,
    private errorService: ErrorService
  ) { }

  ngOnInit(): void {
    this.loadCertificates();
  }

  loadCertificates(): void {
    this.isLoading = true;
    this.loadingError = '';
    this.showRetry = false;

    this.certificateService.getCertificates({
      page: this.currentPage,
      size: this.pageSize,
      filter: this.filterText
    })
    .pipe(
      finalize(() => this.isLoading = false)
    )
    .subscribe({
      next: (data) => {
        this.certificates = data.items;
        this.totalItems = data.total;
        //this.isLoading = false;
      },
      error: (err) => {
        this.loadingError = 'Failed to load certificates';
        this.errorService.handleError(err, 'loading certificates');
        this.isLoading = false;
        this.showRetry = true;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadCertificates();
  }

  applyFilter(): void {
    this.currentPage = 0; // Reset to first page when filtering
    this.loadCertificates();
  }

  clearFilter(): void {
    this.filterText = '';
    this.applyFilter();
  }

  getCertificateStatus(certificate: Certificate): string {
    const now = new Date();

    if (!certificate.active) {
      return 'Revoked';
    }

    if (new Date(certificate.notAfter) < now) {
      return 'Expired';
    }

    return 'Active';
  }

  getStatusClass(certificate: Certificate): string {
    const status = this.getCertificateStatus(certificate);

    switch (status) {
      case 'Active': return 'status-active';
      case 'Expired': return 'status-expired';
      case 'Revoked': return 'status-revoked';
      default: return '';
    }
  }


  exportCertificate(id: number, format: 'pem' | 'der' | 'pkcs12'): void {
    this.certificateService.exportCertificate(id, format).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate-${id}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      },
      error: (err) => {
        this.loadingError = 'Failed to export certificates';
        this.errorService.handleError(err, 'export certificates');
        this.isLoading = false;
        this.showRetry = true;
      },


    });
  }

  openRevokeDialog(certificate: Certificate): void {
    // TO DO: replace this with a proper dialog later
    if (confirm(`Are you sure you want to revoke certificate "${certificate.name}"?`)) {
      this.certificateService.revokeCertificate(certificate.id!, 'Manual revocation').subscribe({
        next: () => {
          // Refresh the list
          this.loadCertificates();
        },
        error: (err) => {
          this.loadingError = 'Failed to revoke certificates';
          this.errorService.handleError(err, 'revoke certificates');
          this.isLoading = false;
          this.showRetry = true;
        }
      });
    }
  }

  retryLoading(): void {
    this.loadCertificates();
  }

  dismissError(): void {
    this.loadingError = '';
  }

}

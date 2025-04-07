// src/app/certificates/components/certificate-detail/certificate-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Certificate } from '../../../shared/models/certificate.model';
import { CertificateService } from '../../services/certificate.service';
import { ErrorService } from '../../../core/services/error/error.service';

@Component({
  selector: 'app-certificate-detail',
  templateUrl: './certificate-detail.component.html',
  styleUrls: ['./certificate-detail.component.scss']
})
export class CertificateDetailComponent implements OnInit {
  certificateId: number;
  certificate: Certificate | null = null;
  isLoading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private certificateService: CertificateService,
    private errorService: ErrorService,
    private dialog: MatDialog
  ) {
    this.certificateId = +this.route.snapshot.paramMap.get('id')!;
  }

  ngOnInit(): void {
    this.loadCertificate();
  }

  loadCertificate(): void {
    this.isLoading = true;

    this.certificateService.getCertificate(this.certificateId).subscribe({
      next: (data) => {
        this.certificate = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load certificate details';
        this.errorService.logError(err);
        this.isLoading = false;
      }
    });
  }

  getCertificateStatus(): string {
    if (!this.certificate) return '';

    const now = new Date();

    if (!this.certificate.active) {
      return 'Revoked';
    }

    if (new Date(this.certificate.notAfter) < now) {
      return 'Expired';
    }

    return 'Active';
  }

  getStatusClass(): string {
    const status = this.getCertificateStatus();

    switch (status) {
      case 'Active': return 'status-active';
      case 'Expired': return 'status-expired';
      case 'Revoked': return 'status-revoked';
      default: return '';
    }
  }

  exportCertificate(format: 'pem' | 'der' | 'pkcs12'): void {
    this.certificateService.exportCertificate(this.certificateId, format).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate-${this.certificateId}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      },
      error: (err) => {
        this.errorService.logError(err);
        // Show error toast or notification
      }
    });
  }

  openRevokeDialog(): void {
    //TO DO: implement this with a dialog component later
    if (confirm('Are you sure you want to revoke this certificate?')) {
      this.revokeCertificate('Manual revocation');
    }
  }

  revokeCertificate(reason: string): void {
    this.certificateService.revokeCertificate(this.certificateId, reason).subscribe({
      next: (data) => {
        this.certificate = data;
        // Show success toast or notification
      },
      error: (err) => {
        this.errorService.logError(err);
        // Show error toast or notification
      }
    });
  }

  goToEdit(): void {
    this.router.navigate(['/certificates', this.certificateId, 'edit']);
  }

  goBack(): void {
    this.router.navigate(['/certificates']);
  }
}

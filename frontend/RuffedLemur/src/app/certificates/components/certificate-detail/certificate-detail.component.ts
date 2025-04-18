// Path: frontend/RuffedLemur/src/app/certificates/components/certificate-detail/certificate-detail.component.ts

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Certificate } from '../../../shared/models/certificate.model';
import { CertificateService } from '../../services/certificate.service';
import { ErrorService } from '../../../core/services/error/error.service';
import { finalize } from 'rxjs/operators';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { idToNumber } from '../../../shared/utils/type-guard';

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
    const id = this.route.snapshot.paramMap.get('id');
    this.certificateId = id ? idToNumber(id) : 0;
  }

  ngOnInit(): void {
    this.loadCertificate();
  }

  loadCertificate(): void {
    this.isLoading = true;
    this.error = '';

    this.certificateService.getCertificate(this.certificateId)
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (data) => {
          this.certificate = data;
        },
        error: (err) => {
          this.error = 'Failed to load certificate details';
          this.errorService.handleError(err, 'Loading certificate details');
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
        this.errorService.handleError(err, `Exporting certificate in ${format} format`);
      }
    });
  }

  openRevokeDialog(): void {
    if (!this.certificate) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Revoke Certificate',
        message: `Are you sure you want to revoke certificate <strong>"${this.certificate.name}"</strong>?<br><br>This action cannot be undone.`,
        confirmButtonText: 'Revoke',
        cancelButtonText: 'Cancel',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.revokeCertificate('Manual revocation');
      }
    });
  }

  revokeCertificate(reason: string): void {
    this.certificateService.revokeCertificate(this.certificateId, reason).subscribe({
      next: (data) => {
        this.certificate = data;
        this.errorService.showSuccess('Certificate revoked successfully');
      },
      error: (err) => {
        this.errorService.handleError(err, 'Revoking certificate');
      }
    });
  }

  goToEdit(): void {
    this.router.navigate(['/certificates', this.certificateId, 'edit']);
  }

  goBack(): void {
    this.router.navigate(['/certificates']);
  }

  retryLoading(): void {
    this.loadCertificate();
  }
}

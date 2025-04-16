import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';

import { Certificate } from '../../../shared/models/certificate.model';
import { Authority } from '../../../shared/models/authority.model';
import { CertificateService } from '../../services/certificate.service';
import { AuthorityService } from '../../../authorities/services/authority.service';
import { ErrorService } from '../../../core/services/error/error.service';
import { FormValidationService } from '../../../shared/services/form-validation.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-certificate-form',
  templateUrl: './certificate-form.component.html',
  styleUrls: ['./certificate-form.component.scss']
})
export class CertificateFormComponent implements OnInit {
  certificateForm: FormGroup;
  isEdit = false;
  certificateId: string | null = null;
  certificate: Certificate | null = null;

  // Available authorities for dropdown
  authorities: Authority[] = [];

  // Form states
  isLoading = false;
  isSaving = false;
  loadingError = '';
  savingError = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private certificateService: CertificateService,
    private authorityService: AuthorityService,
    private errorService: ErrorService,
    private validationService: FormValidationService
  ) {
    // Initialize the form with default values
    this.certificateForm = this.createForm();
  }

  ngOnInit(): void {
    // Load available authorities
    this.loadAuthorities();

    // Check if we're in edit mode
    this.certificateId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.certificateId;

    if (this.isEdit && this.certificateId) {
      this.loadCertificate(this.certificateId);
    }
  }

  /**
   * Create the certificate form with validators
   */
  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [
        Validators.required,
        Validators.maxLength(128)
      ]],
      commonName: ['', [
        Validators.required,
        Validators.maxLength(64)
      ]],
      description: ['', Validators.maxLength(1024)],
      authorityId: ['', Validators.required],
      domains: ['', Validators.maxLength(2048)],
      validityDays: [365, [
        Validators.required,
        Validators.min(1),
        Validators.max(3650)
      ]],
      keyType: ['RSA2048', Validators.required],
      organization: ['', Validators.maxLength(128)],
      organizationalUnit: ['', Validators.maxLength(128)],
      country: ['', [
        Validators.maxLength(2),
        Validators.pattern(/^[A-Z]{2}$/)
      ]],
      state: ['', Validators.maxLength(128)],
      location: ['', Validators.maxLength(128)]
    });
  }

  /**
   * Load authorities for the dropdown
   */
  loadAuthorities(): void {
    this.authorityService.getAuthorities()
      .pipe(
        finalize(() => {
          // If there are no authorities, show a warning
          if (this.authorities.length === 0) {
            this.loadingError = 'No certificate authorities available. Please create an authority first.';
          }
        })
      )
      .subscribe({
        next: (data) => {
          this.authorities = data.items;
        },
        error: (err) => {
          this.loadingError = 'Failed to load certificate authorities';
          this.errorService.handleError(err, 'loading certificate authorities');
        }
      });
  }

  /**
   * Load certificate data when in edit mode
   */
  loadCertificate(id: string): void {
    this.isLoading = true;

    this.certificateService.getCertificate(id)
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (certificate) => {
          this.certificate = certificate;
          this.updateForm(certificate);
        },
        error: (err) => {
          this.loadingError = 'Failed to load certificate';
          this.errorService.handleError(err, 'loading certificate');
        }
      });
  }

  /**
   * Update form with certificate data
   */
  updateForm(certificate: Certificate): void {
    this.certificateForm.patchValue({
      name: certificate.name,
      commonName: certificate.commonName,
      description: certificate.description || '',
      authorityId: certificate.authorityId,
      domains: certificate.domains ? certificate.domains.join(',') : '',
      validityDays: certificate.validityDays || 365,
      keyType: certificate.keyType || 'RSA2048',
      organization: certificate.organization || '',
      organizationalUnit: certificate.organizationalUnit || '',
      country: certificate.country || '',
      state: certificate.state || '',
      location: certificate.location || ''
    });
  }

  /**
   * Check if a form control has errors
   */
  hasError(controlName: string): boolean {
    const control = this.certificateForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  /**
   * Get error message for a form control
   */
  getErrorMessage(controlName: string): string {
    const control = this.certificateForm.get(controlName);
    if (control) {
      return this.validationService.getErrorMessage(control);
    }
    return '';
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    // Stop if form is invalid
    if (this.certificateForm.invalid) {
      // Mark all fields as touched to show validation errors
      this.validationService.markFormGroupTouched(this.certificateForm);
      return;
    }

    // Get form values
    const formValue = this.certificateForm.value;

    // Process domains from comma-separated string to array
    const domains = formValue.domains
      ? formValue.domains.split(',').map((d: string) => d.trim()).filter(Boolean)
      : [];

    // Prepare certificate data
    const certificateData: Partial<Certificate> = {
      name: formValue.name,
      commonName: formValue.commonName,
      description: formValue.description,
      authorityId: formValue.authorityId,
      domains,
      validityDays: formValue.validityDays,
      keyType: formValue.keyType,
      organization: formValue.organization,
      organizationalUnit: formValue.organizationalUnit,
      country: formValue.country,
      state: formValue.state,
      location: formValue.location
    };

    this.isSaving = true;
    this.savingError = '';

    if (this.isEdit && this.certificateId) {
      // Update existing certificate
      this.certificateService.updateCertificate(this.certificateId, certificateData)
        .pipe(
          finalize(() => this.isSaving = false)
        )
        .subscribe({
          next: (updatedCertificate) => {
            this.navigateAfterSave(updatedCertificate.id);
          },
          error: (err) => {
            this.savingError = 'Failed to update certificate';
            this.errorService.handleError(err, 'updating certificate');
          }
        });
    } else {
      // Create new certificate
      this.certificateService.createCertificate(certificateData)
        .pipe(
          finalize(() => this.isSaving = false)
        )
        .subscribe({
          next: (newCertificate) => {
            this.navigateAfterSave(newCertificate.id);
          },
          error: (err) => {
            this.savingError = 'Failed to create certificate';
            this.errorService.handleError(err, 'creating certificate');
          }
        });
    }
  }

  /**
   * Navigate after successful save
   */
  navigateAfterSave(id: string): void {
    this.router.navigate(['/certificates', id]);
  }

  /**
   * Handle cancel button click
   */
  onCancel(): void {
    if (this.certificateForm.dirty) {
      // Show confirmation dialog if form has unsaved changes
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        data: {
          title: 'Unsaved Changes',
          message: 'You have unsaved changes. Are you sure you want to leave this page?',
          confirmText: 'Yes, Leave Page',
          cancelText: 'Stay on Page'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.navigateBack();
        }
      });
    } else {
      // No unsaved changes, navigate back immediately
      this.navigateBack();
    }
  }

  /**
   * Navigate back to the appropriate page
   */
  navigateBack(): void {
    if (this.isEdit && this.certificateId) {
      this.router.navigate(['/certificates', this.certificateId]);
    } else {
      this.router.navigate(['/certificates']);
    }
  }

  /**
   * Retry loading certificate data
   */
  retryLoading(): void {
    this.loadingError = '';

    if (this.isEdit && this.certificateId) {
      this.loadCertificate(this.certificateId);
    }

    // Always reload authorities
    this.loadAuthorities();
  }

  /**
   * Dismiss loading error
   */
  dismissLoadingError(): void {
    this.loadingError = '';
  }

  /**
   * Dismiss saving error
   */
  dismissSavingError(): void {
    this.savingError = '';
  }
}

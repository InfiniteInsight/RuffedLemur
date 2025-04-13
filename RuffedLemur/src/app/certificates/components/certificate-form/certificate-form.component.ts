import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';

import { Certificate, Authority } from '../../../shared/models/certificate.model';
import { CertificateService } from '../../services/certificate.service';
import { AuthorityService } from '../../../authorities/services/authority.service';
import { ErrorService } from '../../../core/services/error/error.service';

@Component({
  selector: 'app-certificate-form',
  templateUrl: './certificate-form.component.html',
  styleUrls: ['./certificate-form.component.scss']
})
export class CertificateFormComponent implements OnInit {
  certificateForm: FormGroup;
  authorities: Authority[] = [];
  certificateId: number | null = null;

  //Loading, error, edit, save state
  isEditMode = false;
  isSaving = false;
  isLoading = false;
  showRetry = false;
  //error = '';
  loadingError = ''
  savingError = ''


  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private certificateService: CertificateService,
    private authorityService: AuthorityService,
    private errorService: ErrorService
  ) {
    // Initialize form with empty values
    this.certificateForm = this.createForm();

    // Check if we are in edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.certificateId = +id;
      this.isEditMode = true;
    }
  }

  ngOnInit(): void {
    this.loadAuthorities();

    if (this.isEditMode && this.certificateId) {
      this.loadCertificate(this.certificateId);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required]],
      commonName: ['', [Validators.required]],
      san: [''],
      owner: ['', [Validators.required]],
      team: [''],
      description: [''],
      authorityId: [null, [Validators.required]],
      domains: this.fb.array([this.createDomainControl()]),
    });
  }

  private createDomainControl() {
    return this.fb.control('', Validators.required);
  }

  get domainsArray() {
    return this.certificateForm.get('domains') as FormArray;
  }

  addDomain() {
    this.domainsArray.push(this.createDomainControl());
  }

  removeDomain(index: number) {
    this.domainsArray.removeAt(index);
  }

  loadAuthorities() {
    this.authorityService.getAuthorities().subscribe({
      next: (data: any) => {
        this.authorities = data;
      },
      error: (err: any) => {
        this.loadingError = 'Failed to load certificate authorities';
        this.errorService.handleError(err, 'loading certificate authorities');
        this.showRetry = true;
      }
    });
  }

  loadCertificate(id: number) {
    this.isLoading = true;

    this.certificateService.getCertificate(id).subscribe({
      next: (certificate) => {
        // Clear existing domains array
        while (this.domainsArray.length) {
          this.domainsArray.removeAt(0);
        }

        // Add domains from certificate
        if (certificate.domains && certificate.domains.length) {
          certificate.domains.forEach(domain => {
            this.domainsArray.push(this.fb.control(domain, Validators.required));
          });
        } else {
          // Ensure at least one empty domain field
          this.domainsArray.push(this.createDomainControl());
        }

        // Patch form values
        this.certificateForm.patchValue({
          name: certificate.name,
          commonName: certificate.commonName,
          san: certificate.san,
          owner: certificate.owner,
          team: certificate.team,
          description: certificate.description || '',
          authorityId: certificate.authority?.id
        });

        this.isLoading = false;
      },
      error: (err) => {
        this.loadingError = 'Failed to load certificate details';
        this.errorService.handleError(err,'loading certificates');
        this.isLoading = false;
        this.showRetry = true;
      }
    });
  }

  onSubmit() {
    if (this.certificateForm.invalid) {
      this.markFormGroupTouched(this.certificateForm);
      return;
    }

    this.isSaving = true;

    const certificateData = this.prepareCertificateData();
    let saveObservable: Observable<Certificate>;

    if (this.isEditMode && this.certificateId) {
      saveObservable = this.certificateService.updateCertificate(this.certificateId, certificateData);
    } else {
      saveObservable = this.certificateService.createCertificate(certificateData);
    }

    saveObservable.subscribe({
      next: (data) => {
        this.isSaving = false;
        this.router.navigate(['/certificates', data.id]);
      },
      error: (err) => {
        this.savingError = 'Failed to save certificate';
        this.errorService.handleError(err, 'saving certificates');
        this.isSaving = false;
        this.showRetry = true;
      }
    });
  }

  prepareCertificateData(): Partial<Certificate> {
    const formValue = this.certificateForm.value;

    return {
      name: formValue.name,
      commonName: formValue.commonName,
      san: formValue.commonName,
      owner: formValue.owner,
      description: formValue.description,
      team: formValue.team,
      authorityId: formValue.authorityId,
      domains: formValue.domains.filter((domain: string) => domain.trim() !== '')
    };
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  cancel() {
    if (this.isEditMode && this.certificateId) {
      this.router.navigate(['/certificates', this.certificateId]);
    } else {
      this.router.navigate(['/certificates']);
    }
  }
}

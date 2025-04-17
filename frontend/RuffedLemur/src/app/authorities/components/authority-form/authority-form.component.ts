// frontend/RuffedLemur/src/app/authorities/components/authority-form/authority-form.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Authority, KeyType, AuthorityPlugin } from '../../../shared/models/authority.model';
import { AuthorityService } from '../../services/authority.service';
import { ErrorService } from '../../../core/services/error/error.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-authority-form',
  templateUrl: './authority-form.component.html',
  styleUrls: ['./authority-form.component.scss']
})
export class AuthorityFormComponent implements OnInit {
  authorityForm: FormGroup;
  authorityId: number | null = null;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  error = '';
  availablePlugins: string[] = [];
  keyTypes = Object.values(KeyType);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authorityService: AuthorityService,
    private errorService: ErrorService,
    private snackBar: MatSnackBar
  ) {
    // Initialize form with empty values
    this.authorityForm = this.createForm();

    // Check if we are in edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.authorityId = +id;
      this.isEditMode = true;
    }
  }

  ngOnInit(): void {
    this.loadPlugins();

    if (this.isEditMode && this.authorityId) {
      this.loadAuthority(this.authorityId);
    }

    // Show/hide key size or curve based on key type selection
    this.authorityForm.get('options.keyType')?.valueChanges.subscribe(keyType => {
      this.updateKeyTypeFields(keyType);
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required]],
      owner: ['', [Validators.required]],
      description: [''],
      options: this.fb.group({
        plugin: ['', [Validators.required]],
        keyType: [KeyType.RSA, [Validators.required]],
        keySize: [2048, [Validators.required, Validators.min(2048)]],
        curve: [''],
        validityYears: [1, [Validators.required, Validators.min(1), Validators.max(30)]],
        organization: [''],
        organizationalUnit: [''],
        country: [''],
        state: [''],
        location: [''],
        pluginOptions: this.fb.group({})
      })
    });
  }

  loadPlugins(): void {
    this.authorityService.getAuthorityPlugins().subscribe({
      next: (plugins) => {
        this.availablePlugins = plugins;
        // If no plugin is selected and we have plugins, select the first one
        if (!this.authorityForm.get('options.plugin')?.value && plugins.length > 0) {
          this.authorityForm.get('options.plugin')?.setValue(plugins[0]);
        }
      },
      error: (err) => {
        this.error = 'Failed to load authority plugins';
        this.snackBar.open('Failed to load authority plugins', 'Close', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
        // The error service handling is done within the authority service
      }
    });
  }

  loadAuthority(id: number): void {
    this.isLoading = true;
    this.error = '';

    this.authorityService.getAuthority(id).subscribe({
      next: (authority) => {
        // Patch form values
        this.authorityForm.patchValue({
          name: authority.name,
          owner: authority.owner,
          description: authority.description || '',
          options: {
            plugin: authority.options?.plugin,
            keyType: authority.options?.keyType,
            keySize: authority.options?.keySize,
            curve: authority.options?.curve,
            validityYears: authority.options?.validityYears,
            organization: authority.options?.organization,
            organizationalUnit: authority.options?.organizationalUnit,
            country: authority.options?.country,
            state: authority.options?.state,
            location: authority.options?.location
          }
        });

        // Update form based on key type
        this.updateKeyTypeFields(authority.options?.keyType);

        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load authority details';
        this.isLoading = false;
        this.snackBar.open('Failed to load authority details', 'Close', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
        // The error service handling is done within the authority service
      }
    });
  }

  updateKeyTypeFields(keyType: KeyType | undefined): void {
    // This method remains unchanged
    const keySizeControl = this.authorityForm.get('options.keySize');
    const curveControl = this.authorityForm.get('options.curve');

    if (keyType === KeyType.RSA) {
      keySizeControl?.setValidators([Validators.required, Validators.min(2048)]);
      curveControl?.clearValidators();
      curveControl?.setValue('');
    } else if (keyType === KeyType.ECC) {
      keySizeControl?.clearValidators();
      keySizeControl?.setValue(null);
      curveControl?.setValidators([Validators.required]);
      curveControl?.setValue('secp256r1'); // Default curve
    } else if (keyType === KeyType.ED25519) {
      keySizeControl?.clearValidators();
      keySizeControl?.setValue(null);
      curveControl?.clearValidators();
      curveControl?.setValue('');
    }

    keySizeControl?.updateValueAndValidity();
    curveControl?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.authorityForm.invalid) {
      this.markFormGroupTouched(this.authorityForm);
      return;
    }

    this.isSaving = true;
    this.error = '';

    const authorityData = this.prepareAuthorityData();

    let saveObservable: Observable<Authority>;

    if (this.isEditMode && this.authorityId) {
      saveObservable = this.authorityService.updateAuthority(this.authorityId, authorityData);
    } else {
      saveObservable = this.authorityService.createAuthority(authorityData);
    }

    saveObservable.subscribe({
      next: (data) => {
        this.isSaving = false;
        this.snackBar.open(
          `Authority ${this.isEditMode ? 'updated' : 'created'} successfully`,
          'Close',
          { duration: 3000, panelClass: 'success-snackbar' }
        );
        this.router.navigate(['/authorities', data.id]);
      },
      error: (err) => {
        this.error = `Failed to ${this.isEditMode ? 'update' : 'create'} authority`;
        this.isSaving = false;
        this.snackBar.open(
          `Failed to ${this.isEditMode ? 'update' : 'create'} authority: ${err.message}`,
          'Close',
          { duration: 5000, panelClass: 'error-snackbar' }
        );
        // The error service handling is done within the authority service
      }
    });
  }

  prepareAuthorityData(): Partial<Authority> {
    const formValue = this.authorityForm.value;

    // Clean up the data before sending to API
    const options = { ...formValue.options };

    // Only include keySize or curve based on key type
    if (options.keyType === KeyType.ECC) {
      delete options.keySize;
    } else if (options.keyType === KeyType.RSA) {
      delete options.curve;
    } else if (options.keyType === KeyType.ED25519) {
      delete options.keySize;
      delete options.curve;
    }

    return {
      name: formValue.name,
      owner: formValue.owner,
      description: formValue.description,
      options: options
    };
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  cancel(): void {
    if (this.isEditMode && this.authorityId) {
      this.router.navigate(['/authorities', this.authorityId]);
    } else {
      this.router.navigate(['/authorities']);
    }
  }
}

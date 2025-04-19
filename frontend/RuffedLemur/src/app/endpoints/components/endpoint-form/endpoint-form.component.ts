// frontend/RuffedLemur/src/app/endpoints/components/endpoint-form/endpoint-form.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Endpoint, EndpointType } from '../../../shared/models/endpoint.model';
import { EndpointService } from '../../services/endpoint.service';
import { ErrorService } from '../../../core/services/error/error.service';
import { ApiNotificationService } from '../../../core/services/api-notification/api-notification.service';
import { ComponentCanDeactivate } from '../../../core/guards/pending-changes.guard';

@Component({
  selector: 'app-endpoint-form',
  templateUrl: './endpoint-form.component.html',
  styleUrls: ['./endpoint-form.component.scss']
})
export class EndpointFormComponent implements OnInit, OnDestroy, ComponentCanDeactivate {
  private destroy$ = new Subject<void>();

  endpointForm: FormGroup;
  endpointId: number | null = null;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  error = '';
  endpointTypes = Object.values(EndpointType);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private endpointService: EndpointService,
    private errorService: ErrorService,
    private notificationService: ApiNotificationService
  ) {
    // Initialize form with empty values
    this.endpointForm = this.createForm();

    // Check if we are in edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.endpointId = +id;
      this.isEditMode = true;
    }
  }

  ngOnInit(): void {
    if (this.isEditMode && this.endpointId) {
      this.loadEndpoint(this.endpointId);
    }

    // Show/hide fields based on endpoint type
    this.endpointForm.get('type')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(type => {
        this.updateEndpointTypeFields(type);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Implement canDeactivate method for pending changes guard
  canDeactivate(): boolean | Observable<boolean> {
    // Return true if there are no pending changes
    return !this.endpointForm.dirty || this.isSaving;
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      owner: ['', [Validators.required]],
      type: [EndpointType.CUSTOM, [Validators.required]],
      options: this.fb.group({
        // AWS fields
        region: [''],
        accountId: [''],

        // GCP fields
        projectId: [''],

        // Azure fields
        resourceGroup: [''],

        // Kubernetes fields
        namespace: [''],

        // Custom fields
        customFields: this.fb.array([])
      })
    });
  }

  // Helper getter for customFields FormArray
  get customFields(): FormArray {
    return this.endpointForm.get('options.customFields') as FormArray;
  }

  // Add a custom field key-value pair
  addCustomField(): void {
    this.customFields.push(
      this.fb.group({
        key: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
        value: ['', Validators.required]
      })
    );
  }

  // Remove a custom field
  removeCustomField(index: number): void {
    this.customFields.removeAt(index);
    this.endpointForm.markAsDirty();
  }

  loadEndpoint(id: number): void {
    this.isLoading = true;
    this.error = '';

    this.endpointService.getEndpoint(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (endpoint) => {
          // Clear existing custom fields
          while (this.customFields.length) {
            this.customFields.removeAt(0);
          }

          // Add custom fields if any
          if (endpoint.options?.customFields) {
            Object.entries(endpoint.options.customFields).forEach(([key, value]) => {
              this.customFields.push(
                this.fb.group({
                  key: [key, [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
                  value: [value, Validators.required]
                })
              );
            });
          }

          // Patch form values
          this.endpointForm.patchValue({
            name: endpoint.name,
            description: endpoint.description || '',
            owner: endpoint.owner,
            type: endpoint.type,
            options: {
              region: endpoint.options?.region || '',
              accountId: endpoint.options?.accountId || '',
              projectId: endpoint.options?.projectId || '',
              resourceGroup: endpoint.options?.resourceGroup || '',
              namespace: endpoint.options?.namespace || '',
            }
          });

          // Update form based on endpoint type
          this.updateEndpointTypeFields(endpoint.type);

          this.isLoading = false;
          this.endpointForm.markAsPristine();
        },
        error: (err) => {
          this.error = 'Failed to load endpoint details';
          this.errorService.logError(err);
          this.notificationService.error('Failed to load endpoint details');
          this.isLoading = false;
        }
      });
  }

  updateEndpointTypeFields(type: EndpointType): void {
    // Reset all field validators
    const regionControl = this.endpointForm.get('options.region');
    const accountIdControl = this.endpointForm.get('options.accountId');
    const projectIdControl = this.endpointForm.get('options.projectId');
    const resourceGroupControl = this.endpointForm.get('options.resourceGroup');
    const namespaceControl = this.endpointForm.get('options.namespace');

    // Clear validators
    regionControl?.clearValidators();
    accountIdControl?.clearValidators();
    projectIdControl?.clearValidators();
    resourceGroupControl?.clearValidators();
    namespaceControl?.clearValidators();

    // Set validators based on type
    switch (type) {
      case EndpointType.AWS:
        regionControl?.setValidators([Validators.required]);
        accountIdControl?.setValidators([Validators.required, Validators.pattern(/^\d{12}$/)]);
        break;
      case EndpointType.GCP:
        projectIdControl?.setValidators([Validators.required]);
        break;
      case EndpointType.AZURE:
        resourceGroupControl?.setValidators([Validators.required]);
        break;
      case EndpointType.KUBERNETES:
        namespaceControl?.setValidators([Validators.required]);
        break;
      case EndpointType.CUSTOM:
        // No specific required fields for custom
        break;
    }

    // Update validity
    regionControl?.updateValueAndValidity();
    accountIdControl?.updateValueAndValidity();
    projectIdControl?.updateValueAndValidity();
    resourceGroupControl?.updateValueAndValidity();
    namespaceControl?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.endpointForm.invalid) {
      this.markFormGroupTouched(this.endpointForm);
      this.notificationService.error('Please fix the form errors before submitting');
      return;
    }

    this.isSaving = true;
    this.error = '';

    const endpointData = this.prepareEndpointData();

    const saveObservable = this.isEditMode && this.endpointId
      ? this.endpointService.updateEndpoint(this.endpointId, endpointData)
      : this.endpointService.createEndpoint(endpointData);

    saveObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.isSaving = false;
          this.endpointForm.markAsPristine();

          const message = this.isEditMode
            ? `Endpoint "${data.name}" updated successfully`
            : `Endpoint "${data.name}" created successfully`;

          this.notificationService.success(message);
          this.router.navigate(['/endpoints', data.id]);
        },
        error: (err) => {
          this.error = 'Failed to save endpoint';
          this.errorService.logError(err);
          this.notificationService.error('Failed to save endpoint');
          this.isSaving = false;
        }
      });
  }

  prepareEndpointData(): Partial<Endpoint> {
    const formValue = this.endpointForm.value;
    const endpointType = formValue.type;

    // Prepare options based on type
    const options: any = {};

    switch (endpointType) {
      case EndpointType.AWS:
        options.region = formValue.options.region;
        options.accountId = formValue.options.accountId;
        break;
      case EndpointType.GCP:
        options.projectId = formValue.options.projectId;
        break;
      case EndpointType.AZURE:
        options.resourceGroup = formValue.options.resourceGroup;
        break;
      case EndpointType.KUBERNETES:
        options.namespace = formValue.options.namespace;
        break;
      case EndpointType.CUSTOM:
        options.customFields = {};
        formValue.options.customFields.forEach((field: any) => {
          options.customFields[field.key] = field.value;
        });
        break;
    }

    return {
      name: formValue.name,
      description: formValue.description,
      owner: formValue.owner,
      type: endpointType,
      options: options,
      active: this.isEditMode ? (this.endpointForm.get('active')?.value ?? true) : true
    };
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }

      if (control instanceof FormArray) {
        for (let i = 0; i < control.length; i++) {
          if (control.at(i) instanceof FormGroup) {
            this.markFormGroupTouched(control.at(i) as FormGroup);
          } else {
            control.at(i).markAsTouched();
          }
        }
      }
    });
  }

  cancel(): void {
    if (this.isEditMode && this.endpointId) {
      this.router.navigate(['/endpoints', this.endpointId]);
    } else {
      this.router.navigate(['/endpoints']);
    }
  }

  // Helper method to check form field validity
  isInvalid(controlName: string): boolean {
    const control = this.endpointForm.get(controlName);
    return control ? control.invalid && control.touched : false;
  }

  // Helper method to check form field validity within the options group
  isOptionsInvalid(controlName: string): boolean {
    const control = this.endpointForm.get(`options.${controlName}`);
    return control ? control.invalid && control.touched : false;
  }

  // Helper method to get error message for custom field key
  getCustomFieldKeyError(index: number): string {
    const control = this.customFields.at(index).get('key');
    if (!control) return '';

    if (control.hasError('required')) {
      return 'Key is required';
    }
    if (control.hasError('pattern')) {
      return 'Key can only contain letters, numbers, and underscores';
    }
    return '';
  }
}

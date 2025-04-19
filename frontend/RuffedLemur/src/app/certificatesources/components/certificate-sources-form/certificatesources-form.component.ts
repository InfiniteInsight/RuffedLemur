// src/app/certificatesources/components/certificate-source-form/certificate-source-form.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { CertificateSource, SourcePlugin } from '../../../shared/models/certificate-source.model';
import { CertificateSourceService } from '../../services/certificate-source.service';
import { ErrorService } from '../../../core/services/error/error.service';
import { ApiNotificationService } from '../../../core/services/api-notification/api-notification.service';
import { ComponentCanDeactivate } from '../../../core/guards/pending-changes.guard';

@Component({
  selector: 'app-certificate-source-form',
  templateUrl: './certificate-source-form.component.html',
  styleUrls: ['./certificate-source-form.component.scss']
})
export class CertificateSourceFormComponent implements OnInit, OnDestroy, ComponentCanDeactivate {
  private destroy$ = new Subject<void>();

  sourceForm: FormGroup;
  sourceId: number | null = null;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  isTesting = false;
  testSuccess = false;
  testError = '';
  error = '';

  pluginTypes = Object.values(SourcePlugin);
  availablePlugins: string[] = [];

  // Plugin-specific schema info
  currentPluginSchema: any = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private sourceService: CertificateSourceService,
    private errorService: ErrorService,
    private notificationService: ApiNotificationService
  ) {
    // Initialize form with empty values
    this.sourceForm = this.createForm();

    // Check if we are in edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.sourceId = +id;
      this.isEditMode = true;
    }
  }

  ngOnInit(): void {
    // Load available plugins from the server
    this.loadPlugins();

    if (this.isEditMode && this.sourceId) {
      this.loadSource(this.sourceId);
    }

    // React to plugin type changes to show appropriate options
    this.sourceForm.get('plugin')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(plugin => {
        this.loadPluginSchema(plugin);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      label: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      plugin: [SourcePlugin.CUSTOM, [Validators.required]],
      active: [true],
      pluginOptions: this.fb.group({})
    });
  }

  canDeactivate(): boolean {
    // Return true if there are no pending changes, or false if there are
    return !this.sourceForm.dirty;
  }

  loadPlugins(): void {
    this.sourceService.getSourcePlugins()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (plugins: SourcePlugin[]) => {
          this.availablePlugins = plugins;

          // Set default selection if we have plugins and no selection yet
          if (plugins.length > 0 && !this.sourceForm.get('plugin')?.value) {
            this.sourceForm.get('plugin')?.setValue(plugins[0]);
            this.loadPluginSchema(plugins[0]);
          }
        },
        error: (error: Error) => {
          this.error = 'Failed to load source plugins';
          this.errorService.logError(error);
          this.notificationService.error('Failed to load source plugins');
        }
      });
  }

  loadPluginSchema(plugin: SourcePlugin): void {
    // Clear the current plugin options form group
    const pluginOptionsGroup = this.sourceForm.get('pluginOptions') as FormGroup;

    // Clear existing controls
    Object.keys(pluginOptionsGroup.controls).forEach(key => {
      pluginOptionsGroup.removeControl(key);
    });

    // Load schema for the selected plugin
    this.sourceService.getSourceSchema(plugin)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (schema) => {
          this.currentPluginSchema = schema;

          // Add form controls based on schema
          if (schema && schema.properties) {
            Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
              // Create validators based on schema
              const validators = [];

              if (schema.required && schema.required.includes(key)) {
                validators.push(Validators.required);
              }

              if (prop.type === 'string' && prop.format === 'email') {
                validators.push(Validators.email);
              }

              if (prop.type === 'number' || prop.type === 'integer') {
                if (prop.minimum !== undefined) {
                  validators.push(Validators.min(prop.minimum));
                }
                if (prop.maximum !== undefined) {
                  validators.push(Validators.max(prop.maximum));
                }
              }

              if (prop.type === 'string' && prop.minLength !== undefined) {
                validators.push(Validators.minLength(prop.minLength));
              }

              // Set default value
              let defaultValue = '';
              if (prop.default !== undefined) {
                defaultValue = prop.default;
              }

              // Add control to form group
              pluginOptionsGroup.addControl(key, new FormControl(defaultValue, validators));
            });
          }
        },
        error: (err) => {
          console.error('Failed to load plugin schema', err);
          // Not showing error to user as this is more of a development issue
        }
      });
  }

  loadSource(id: number): void {
    this.isLoading = true;

    this.sourceService.getSource(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (source) => {
          // Load the plugin schema first
          this.loadPluginSchema(source.plugin);

          // Short delay to allow schema to load and create form controls
          setTimeout(() => {
            // Patch form values
            this.sourceForm.patchValue({
              label: source.label,
              description: source.description || '',
              plugin: source.plugin,
              active: source.active,
              pluginOptions: source.pluginOptions || {}
            });

            this.isLoading = false;
          }, 200);
        },
        error: (err) => {
          this.error = 'Failed to load certificate source';
          this.errorService.logError(err);
          this.notificationService.error('Failed to load certificate source');
          this.isLoading = false;
        }
      });
  }

  testConfiguration(): void {
    if (this.sourceForm.invalid) {
      this.markFormGroupTouched(this.sourceForm);
      return;
    }

    this.isTesting = true;
    this.testSuccess = false;
    this.testError = '';

    const sourceData = this.prepareSourceData();

    this.sourceService.testSourceConfiguration(sourceData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isTesting = false)
      )
      .subscribe({
        next: (result) => {
          this.testSuccess = result.success;
          if (result.success) {
            this.notificationService.success('Connection test successful');
          } else {
            this.testError = result.message || 'Test failed';
            this.notificationService.warn(this.testError);
          }
        },
        error: (err) => {
          this.testError = 'Connection test failed';
          this.errorService.logError(err);
          this.notificationService.error(this.testError);
        }
      });
  }

  onSubmit(): void {
    if (this.sourceForm.invalid) {
      this.markFormGroupTouched(this.sourceForm);
      return;
    }

    this.isSaving = true;
    const sourceData = this.prepareSourceData();

    let saveObservable: Observable<CertificateSource>;

    if (this.isEditMode && this.sourceId) {
      saveObservable = this.sourceService.updateSource(this.sourceId, sourceData);
    } else {
      saveObservable = this.sourceService.createSource(sourceData);
    }

    saveObservable
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSaving = false)
      )
      .subscribe({
        next: (result) => {
          const action = this.isEditMode ? 'updated' : 'created';
          this.notificationService.success(`Certificate source ${action} successfully`);
          this.router.navigate(['/certificatesources']);
        },
        error: (err) => {
          this.error = `Failed to ${this.isEditMode ? 'update' : 'create'} certificate source`;
          this.errorService.logError(err);
          this.notificationService.error(this.error);
        }
      });
  }

  prepareSourceData(): Partial<CertificateSource> {
    const formValue = this.sourceForm.value;

    return {
      label: formValue.label,
      description: formValue.description || null,
      plugin: formValue.plugin,
      pluginOptions: formValue.pluginOptions,
      active: formValue.active
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
    this.router.navigate(['/certificatesources']);
  }

  getPluginLabel(plugin: SourcePlugin): string {
    return plugin.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Helper for template
  getSchemaPropertyLabel(key: string): string {
    if (this.currentPluginSchema &&
        this.currentPluginSchema.properties &&
        this.currentPluginSchema.properties[key] &&
        this.currentPluginSchema.properties[key].title) {
      return this.currentPluginSchema.properties[key].title;
    }

    // Fallback to formatted key
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  // Helper for template
  getSchemaPropertyDescription(key: string): string {
    if (this.currentPluginSchema &&
        this.currentPluginSchema.properties &&
        this.currentPluginSchema.properties[key] &&
        this.currentPluginSchema.properties[key].description) {
      return this.currentPluginSchema.properties[key].description;
    }

    return '';
  }

  // Helper for template
  isPropertyRequired(key: string): boolean {
    return this.currentPluginSchema &&
           this.currentPluginSchema.required &&
           this.currentPluginSchema.required.includes(key);
  }

  // Helper for template
  getPropertyType(key: string): string {
    if (this.currentPluginSchema &&
        this.currentPluginSchema.properties &&
        this.currentPluginSchema.properties[key]) {
      const prop = this.currentPluginSchema.properties[key];

      if (prop.type === 'string' && prop.format === 'password') {
        return 'password';
      }

      if (prop.type === 'string' && prop.format === 'email') {
        return 'email';
      }

      if (prop.type === 'integer' || prop.type === 'number') {
        return 'number';
      }

      if (prop.type === 'boolean') {
        return 'boolean';
      }

      if (prop.enum) {
        return 'enum';
      }
    }

    return 'text';
  }

  // Helper for template
  getPropertyEnum(key: string): string[] {
    if (this.currentPluginSchema &&
        this.currentPluginSchema.properties &&
        this.currentPluginSchema.properties[key] &&
        this.currentPluginSchema.properties[key].enum) {
      return this.currentPluginSchema.properties[key].enum;
    }

    return [];
  }
}

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';

import { CertificateSource, SourcePlugin } from '../../../shared/models/certificate-source.model';
import { CertificateSourceService } from '../../services/certificate-source.service';
import { ErrorService } from '../../../core/services/error/error.service';

@Component({
  selector: 'app-certificate-source-form',
  templateUrl: './certificate-source-form.component.html',
  styleUrls: ['./certificate-source-form.component.scss']
})
export class CertificateSourceFormComponent implements OnInit {
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

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private sourceService: CertificateSourceService,
    private errorService: ErrorService
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
    this.sourceForm.get('plugin')?.valueChanges.subscribe(plugin => {
      this.updatePluginOptions(plugin);
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      plugin: [SourcePlugin.CUSTOM, [Validators.required]],
      active: [true],
      pluginOptions: this.fb.group({
        // AWS ACM specific options
        awsRegion: [''],
        awsAccessKey: [''],
        awsSecretKey: [''],

        // DigiCert specific options
        apiKey: [''],
        apiEndpoint: [''],

        // Let's Encrypt specific options
        acmeDirectory: [''],
        acmeEmail: [''],

        // Vault specific options
        vaultUrl: [''],
        vaultToken: [''],
        vaultPath: [''],

        // Custom options
        customFields: this.fb.group({})
      })
    });
  }

  loadPlugins(): void {
    this.sourceService.getSourcePlugins().subscribe({
      next: (plugins) => {
        this.availablePlugins = plugins;
        // Set default selection if we have plugins and no selection yet
        if (plugins.length > 0 && !this.sourceForm.get('plugin')?.value) {
          this.sourceForm.get('plugin')?.setValue(plugins[0]);
          this.updatePluginOptions(plugins[0]);
        }
      },
      error: (err) => {
        this.error = 'Failed to load source plugins';
        this.errorService.logError(err);
      }
    });
  }

  updatePluginOptions(plugin: SourcePlugin): void {
    // Clear validations from all fields first
    const pluginOptions = this.sourceForm.get('pluginOptions') as FormGroup;
    Object.keys(pluginOptions.controls).forEach(key => {
      pluginOptions.get(key)?.clearValidators();
      pluginOptions.get(key)?.updateValueAndValidity();
    });

    // Set validators based on plugin type
    switch(plugin) {
      case SourcePlugin.AWS_ACM:
        pluginOptions.get('awsRegion')?.setValidators([Validators.required]);
        pluginOptions.get('awsAccessKey')?.setValidators([Validators.required]);
        pluginOptions.get('awsSecretKey')?.setValidators([Validators.required]);
        break;

      case SourcePlugin.DIGICERT:
      case SourcePlugin.ENTRUST:
      case SourcePlugin.VERISIGN:
        pluginOptions.get('apiKey')?.setValidators([Validators.required]);
        pluginOptions.get('apiEndpoint')?.setValidators([Validators.required]);
        break;

      case SourcePlugin.LETS_ENCRYPT:
        pluginOptions.get('acmeDirectory')?.setValidators([Validators.required]);
        pluginOptions.get('acmeEmail')?.setValidators([Validators.required, Validators.email]);
        break;

      case SourcePlugin.VAULT:
        pluginOptions.get('vaultUrl')?.setValidators([Validators.required]);
        pluginOptions.get('vaultToken')?.setValidators([Validators.required]);
        pluginOptions.get('vaultPath')?.setValidators([Validators.required]);
        break;
    }

    // Update validity
    Object.keys(pluginOptions.controls).forEach(key => {
      pluginOptions.get(key)?.updateValueAndValidity();
    });
  }

  loadSource(id: number): void {
    this.isLoading = true;

    this.sourceService.getSource(id).subscribe({
      next: (source) => {
        // Patch form values
        this.sourceForm.patchValue({
          name: source.name,
          description: source.description || '',
          plugin: source.plugin,
          active: source.active,
          pluginOptions: source.pluginOptions || {}
        });

        // Update plugin-specific options
        this.updatePluginOptions(source.plugin);

        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load certificate source';
        this.errorService.logError(err);
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

    this.sourceService.testSourceConfiguration(sourceData).subscribe({
      next: () => {
        this.isTesting = false;
        this.testSuccess = true;
      },
      error: (err) => {
        this.testError = 'Connection test failed';
        this.errorService.logError(err);
        this.isTesting = false;
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

    saveObservable.subscribe({
      next: () => {
        this.isSaving = false;
        this.router.navigate(['/certificatesources']);
      },
      error: (err) => {
        this.error = 'Failed to save certificate source';
        this.errorService.logError(err);
        this.isSaving = false;
      }
    });
  }

  prepareSourceData(): Partial<CertificateSource> {
    const formValue = this.sourceForm.value;

    // Clean up plugin options based on selected plugin
    const pluginOptions = {...formValue.pluginOptions};
    const plugin = formValue.plugin;

    // Only include relevant plugin options for the selected plugin
    switch(plugin) {
      case SourcePlugin.AWS_ACM:
        // Keep only AWS-related options
        Object.keys(pluginOptions).forEach(key => {
          if (!key.startsWith('aws')) {
            delete pluginOptions[key];
          }
        });
        break;

      case SourcePlugin.DIGICERT:
      case SourcePlugin.ENTRUST:
      case SourcePlugin.VERISIGN:
        // Keep only API-related options
        Object.keys(pluginOptions).forEach(key => {
          if (!['apiKey', 'apiEndpoint'].includes(key)) {
            delete pluginOptions[key];
          }
        });
        break;

      case SourcePlugin.LETS_ENCRYPT:
        // Keep only ACME-related options
        Object.keys(pluginOptions).forEach(key => {
          if (!key.startsWith('acme')) {
            delete pluginOptions[key];
          }
        });
        break;

      case SourcePlugin.VAULT:
        // Keep only Vault-related options
        Object.keys(pluginOptions).forEach(key => {
          if (!key.startsWith('vault')) {
            delete pluginOptions[key];
          }
        });
        break;
    }

    return {
      name: formValue.name,
      description: formValue.description || null,
      plugin: formValue.plugin,
      pluginOptions: pluginOptions,
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
}

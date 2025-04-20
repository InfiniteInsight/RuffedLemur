// frontend/RuffedLemur/src/app/plugins/components/plugin-detail/plugin-detail.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Plugin } from '../../../shared/models/plugin.model';
import { PluginService } from '../../services/plugin.service';
import { ErrorService } from '../../../core/services/error/error.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { FormValidationService } from '../../../shared/services/form-validation.service';
import { idToString } from '../../../shared/utils/type-guard';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-plugin-detail',
  templateUrl: './plugin-detail.component.html',
  styleUrls: ['./plugin-detail.component.scss']
})
export class PluginDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  pluginId: string | number;
  plugin: Plugin | null = null;
  isLoading = true;
  isSaving = false;
  isTestingConfig = false;
  error = '';
  configForm: FormGroup;
  formHasChanges = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pluginService: PluginService,
    private errorService: ErrorService,
    private authService: AuthService,
    private formValidationService: FormValidationService,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {
    const paramId = this.route.snapshot.paramMap.get('id');
    this.pluginId = paramId ?? '';
    this.configForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.loadPlugin();

    // Track form changes
    this.configForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.formHasChanges = true;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Check if the component can be deactivated
   * Used by the PendingChangesGuard
   */
  canDeactivate(): boolean {
    return !this.formHasChanges || this.isSaving;
  }

  /**
   * Load plugin details
   */
  loadPlugin(): void {
    this.isLoading = true;
    this.error = '';

    this.pluginService.getPlugin(this.pluginId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.plugin = data;
          this.createConfigForm(data.options || {});
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to load plugin details';
          this.errorService.handleError(err, 'Loading Plugin');
          this.isLoading = false;
        }
      });
  }

  /**
   * Create form controls for plugin configuration
   */
  createConfigForm(options: any): void {
    // Clear existing form
    this.configForm = this.fb.group({});

    // Exit if no options
    if (!options) {
      return;
    }

    // First, check if we have metadata about required fields
    // This would typically come from the API response
    const metadata = this.plugin?.metadata || {};

    // Create form controls for each option
    Object.keys(options).forEach(key => {
      const value = options[key];
      const validators = [];

      // Check if this field is required based on metadata
      if (metadata[key]?.required) {
        validators.push(Validators.required);
      }

      // Apply validators based on field name patterns
      if (key.toLowerCase().includes('required') ||
          key.toLowerCase().includes('name') ||
          key.toLowerCase().includes('key')) {
        validators.push(Validators.required);
      }

      // Apply validators based on value type
      if (typeof value === 'string') {
        // Email validation
        if (key.toLowerCase().includes('email')) {
          validators.push(Validators.email);
        }
        // URL validation
        else if (key.toLowerCase().includes('url') ||
                key.toLowerCase().includes('endpoint') ||
                key.toLowerCase().includes('uri')) {
          validators.push(Validators.pattern('^(http|https)://.*$'));
        }
        // Port validation
        else if (key.toLowerCase().includes('port')) {
          validators.push(Validators.min(1));
          validators.push(Validators.max(65535));
        }
        // IP address validation
        else if (key.toLowerCase().includes('ip')) {
          validators.push(Validators.pattern('^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$'));
        }
        // API Key validation - should be non-empty
        else if (key.toLowerCase().includes('api_key') ||
                key.toLowerCase().includes('apikey') ||
                key.toLowerCase().includes('token')) {
          validators.push(Validators.required);
          validators.push(Validators.minLength(8));
        }
        // Username validation
        else if (key.toLowerCase().includes('username') ||
                key.toLowerCase().includes('user_name')) {
          validators.push(Validators.minLength(3));
        }
        // Password validation
        else if (key.toLowerCase().includes('password') ||
                key.toLowerCase().includes('secret')) {
          validators.push(Validators.minLength(8));
        }
      }
      // Number validation
      else if (typeof value === 'number') {
        // Timeout validation - must be positive
        if (key.toLowerCase().includes('timeout') ||
            key.toLowerCase().includes('interval')) {
          validators.push(Validators.min(0));
        }
        // Count validation - must be positive
        else if (key.toLowerCase().includes('count') ||
                key.toLowerCase().includes('limit')) {
          validators.push(Validators.min(1));
        }
      }

      this.configForm.addControl(key, this.fb.control(value, validators));
    });

    // Reset the form change tracking
    this.formHasChanges = false;
  }

  /**
   * Save plugin configuration
   */
  onSubmit(): void {
    if (this.configForm.invalid) {
      this.formValidationService.markFormGroupTouched(this.configForm);
      const errors = this.formValidationService.getFormValidationErrors(this.configForm);
      this.errorService.showError('Please correct the validation errors before saving');
      return;
    }

    if (!this.plugin) {
      return;
    }

    this.isSaving = true;

    const updatedPlugin = {
      ...this.plugin,
      options: this.configForm.value
    };

    this.pluginService.updatePlugin(this.pluginId, updatedPlugin)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.plugin = data;
          this.isSaving = false;
          this.formHasChanges = false;
          this.errorService.showSuccess('Plugin configuration saved successfully');
        },
        error: (err) => {
          this.error = 'Failed to update plugin configuration';
          this.errorService.handleError(err, 'Updating Plugin');
          this.isSaving = false;
        }
      });
  }

  /**
   * Test plugin configuration
   */
  testConfig(): void {
    if (this.configForm.invalid) {
      this.formValidationService.markFormGroupTouched(this.configForm);
      const errors = this.formValidationService.getFormValidationErrors(this.configForm);
      this.errorService.showError('Please correct the validation errors before testing');
      return;
    }

    if (!this.plugin) {
      return;
    }

    this.isTestingConfig = true;

    this.pluginService.testPluginConfiguration(this.pluginId, this.configForm.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          this.isTestingConfig = false;
          if (success) {
            this.errorService.showSuccess('Plugin configuration test succeeded');
          } else {
            this.errorService.showError('Plugin configuration test failed');
          }
        },
        error: (err) => {
          this.error = 'Failed to test plugin configuration';
          this.errorService.handleError(err, 'Testing Plugin Configuration');
          this.isTestingConfig = false;
        }
      });
  }

  /**
   * Toggle plugin enabled status
   */
  togglePluginStatus(): void {
    if (!this.plugin) return;

    const action = this.plugin.enabled ?
      this.pluginService.disablePlugin(this.pluginId) :
      this.pluginService.enablePlugin(this.pluginId);

    const actionName = this.plugin.enabled ? 'disable' : 'enable';

    // Confirm before disabling
    if (this.plugin.enabled) {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '400px',
        data: {
          title: 'Disable Plugin',
          message: `Are you sure you want to disable the "${this.plugin.name}" plugin? This may affect system functionality.`,
          confirmButtonText: 'Disable',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }
      });

      dialogRef.afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe(result => {
          if (result) {
            this.executeStatusChange(action, actionName);
          }
        });
    } else {
      // Just enable without confirmation
      this.executeStatusChange(action, actionName);
    }
  }

  private executeStatusChange(action: Observable<Plugin>, actionName: string): void {
    action
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedPlugin) => {
          if (this.plugin) {
            this.plugin.enabled = updatedPlugin.enabled;
          }
          this.errorService.showSuccess(`Plugin ${actionName}d successfully`);
        },
        error: (err) => {
          const errorMsg = `Failed to ${actionName} plugin`;
          this.errorService.handleError(err, errorMsg);
        }
      });
  }

  /**
   * Check if user has permission to perform an action
   */
  canPerformAction(action: string): boolean {
    return this.authService.hasPermission(`plugin:${action}`);
  }

  /**
   * Get human-readable plugin type label
   */
  getPluginTypeLabel(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  /**
   * Get keys of form controls
   */
  getFormControlKeys(): string[] {
    return Object.keys(this.configForm.controls);
  }

  /**
   * Go back to plugin list
   */
  goBack(): void {
    // If form has changes, confirm before navigating away
    if (this.formHasChanges && !this.isSaving) {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '400px',
        data: {
          title: 'Unsaved Changes',
          message: 'You have unsaved changes. Are you sure you want to discard them?',
          confirmButtonText: 'Discard Changes',
          cancelButtonText: 'Stay Here',
          type: 'warning'
        }
      });

      dialogRef.afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe(result => {
          if (result) {
            this.router.navigate(['/plugins']);
          }
        });
    } else {
      this.router.navigate(['/plugins']);
    }
  }
}

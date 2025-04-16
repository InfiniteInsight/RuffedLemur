import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';

import {
  NotificationConfig,
  NotificationPlugin
} from '../../../shared/models/notification.model';
import { NotificationService } from '../../services/notification.service';
import { ErrorService } from '../../../core/services/error/error.service';

@Component({
  selector: 'app-notification-config-form',
  templateUrl: './notification-config-form.component.html',
  styleUrls: ['./notification-config-form.component.scss']
})
export class NotificationConfigFormComponent implements OnInit {
  configForm: FormGroup;
  configId: number | null = null;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  isTesting = false;
  testSuccess = false;
  testError = '';
  error = '';

  pluginTypes = Object.values(NotificationPlugin);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService,
    private errorService: ErrorService
  ) {
    // Initialize form with empty values
    this.configForm = this.createForm();

    // Check if we are in edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.configId = +id;
      this.isEditMode = true;
    }
  }

  ngOnInit(): void {
    if (this.isEditMode && this.configId) {
      this.loadConfig(this.configId);
    }

    // React to plugin type changes to show appropriate options
    this.configForm.get('plugin')?.valueChanges.subscribe(plugin => {
      this.updatePluginOptions(plugin);
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      plugin: [NotificationPlugin.EMAIL, [Validators.required]],
      active: [true],
      interval: [this.fb.array([30]), [Validators.required]],  // Default interval of 30 days
      smtpServer: [''],
      smtpPort: [587],
      smtpUser: [''],
      smtpPassword: [''],
      pluginOptions: this.fb.group({
        // Email specific options
        senderEmail: [''],
        senderName: [''],

        // Slack specific options
        webhookUrl: [''],
        channel: [''],

        // Teams specific options
        teamsWebhookUrl: [''],

        // Webhook specific options
        apiUrl: [''],
        apiKey: [''],

        // SMS specific options
        phoneNumbers: this.fb.array([]),
        smsProvider: ['']
      })
    });
  }

  updatePluginOptions(plugin: NotificationPlugin): void {
    // Clear validations from all fields first
    const pluginOptions = this.configForm.get('pluginOptions') as FormGroup;
    Object.keys(pluginOptions.controls).forEach(key => {
      pluginOptions.get(key)?.clearValidators();
      pluginOptions.get(key)?.updateValueAndValidity();
    });

    this.configForm.get('smtpServer')?.clearValidators();
    this.configForm.get('smtpPort')?.clearValidators();

    // Set validators based on plugin type
    switch(plugin) {
      case NotificationPlugin.EMAIL:
        this.configForm.get('smtpServer')?.setValidators([Validators.required]);
        this.configForm.get('smtpPort')?.setValidators([Validators.required]);
        pluginOptions.get('senderEmail')?.setValidators([Validators.required, Validators.email]);
        break;

      case NotificationPlugin.SLACK:
        pluginOptions.get('webhookUrl')?.setValidators([Validators.required]);
        break;

      case NotificationPlugin.TEAMS:
        pluginOptions.get('teamsWebhookUrl')?.setValidators([Validators.required]);
        break;

      case NotificationPlugin.WEBHOOK:
        pluginOptions.get('apiUrl')?.setValidators([Validators.required]);
        break;

      case NotificationPlugin.SMS:
        pluginOptions.get('smsProvider')?.setValidators([Validators.required]);
        break;
    }

    // Update validity
    this.configForm.get('smtpServer')?.updateValueAndValidity();
    this.configForm.get('smtpPort')?.updateValueAndValidity();
    Object.keys(pluginOptions.controls).forEach(key => {
      pluginOptions.get(key)?.updateValueAndValidity();
    });
  }

  loadConfig(id: number): void {
    this.isLoading = true;

    this.notificationService.getNotificationConfig(id).subscribe({
      next: (config) => {
        // Handle intervals array
        const intervalsArray = this.configForm.get('interval') as FormArray;
        while (intervalsArray.length) {
          intervalsArray.removeAt(0);
        }

        config.interval.forEach(interval => {
          intervalsArray.push(this.fb.control(interval));
        });

        // Handle phone numbers if present (for SMS)
        if (config.pluginOptions && config.pluginOptions.phoneNumbers) {
          const phoneArray = this.configForm.get('pluginOptions.phoneNumbers') as FormArray;
          while (phoneArray.length) {
            phoneArray.removeAt(0);
          }

          config.pluginOptions.phoneNumbers.forEach((phone: string) => {
            phoneArray.push(this.fb.control(phone));
          });
        }

        // Patch form values, excluding arrays which we've handled separately
        this.configForm.patchValue({
          name: config.name,
          description: config.description || '',
          plugin: config.plugin,
          active: config.active,
          smtpServer: config.smtpServer || '',
          smtpPort: config.stmpPort || 587,
          smtpUser: config.smtpUser || '',
          smtpPassword: '',  // Never return the actual password from the API
          pluginOptions: config.pluginOptions || {}
        });

        // Update plugin-specific options
        this.updatePluginOptions(config.plugin);

        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load notification configuration';
        this.errorService.logError(err);
        this.isLoading = false;
      }
    });
  }

  // Helper for interval days array
  get intervalArray() {
    return this.configForm.get('interval') as FormArray;
  }

  addInterval(): void {
    this.intervalArray.push(this.fb.control(''));
  }

  removeInterval(index: number): void {
    if (this.intervalArray.length > 1) {
      this.intervalArray.removeAt(index);
    }
  }

  // Helper for phone numbers array
  get phoneNumbersArray() {
    return this.configForm.get('pluginOptions.phoneNumbers') as FormArray;
  }

  addPhoneNumber(): void {
    this.phoneNumbersArray.push(this.fb.control(''));
  }

  removePhoneNumber(index: number): void {
    this.phoneNumbersArray.removeAt(index);
  }

  testConfiguration(): void {
    if (this.configForm.invalid) {
      this.markFormGroupTouched(this.configForm);
      return;
    }

    this.isTesting = true;
    this.testSuccess = false;
    this.testError = '';

    const configData = this.prepareConfigData();

    // For SMTP testing
    if (configData.plugin === NotificationPlugin.EMAIL) {
      this.notificationService.testSmtpConnection(configData).subscribe({
        next: () => {
          this.isTesting = false;
          this.testSuccess = true;
        },
        error: (err) => {
          this.testError = 'SMTP connection test failed';
          this.errorService.logError(err);
          this.isTesting = false;
        }
      });
    }
    // For other plugin testing
    else {
      this.notificationService.testNotificationConfig(configData).subscribe({
        next: () => {
          this.isTesting = false;
          this.testSuccess = true;
        },
        error: (err) => {
          this.testError = 'Configuration test failed';
          this.errorService.logError(err);
          this.isTesting = false;
        }
      });
    }
  }

  onSubmit(): void {
    if (this.configForm.invalid) {
      this.markFormGroupTouched(this.configForm);
      return;
    }

    this.isSaving = true;
    const configData = this.prepareConfigData();

    let saveObservable: Observable<NotificationConfig>;

    if (this.isEditMode && this.configId) {
      saveObservable = this.notificationService.updateNotificationConfig(this.configId, configData);
    } else {
      saveObservable = this.notificationService.createNotificationConfig(configData);
    }

    saveObservable.subscribe({
      next: () => {
        this.isSaving = false;
        this.router.navigate(['/notifications/configs']);
      },
      error: (err) => {
        this.error = 'Failed to save notification configuration';
        this.errorService.logError(err);
        this.isSaving = false;
      }
    });
  }

  prepareConfigData(): Partial<NotificationConfig> {
    const formValue = this.configForm.value;

    // Convert interval values to numbers
    const intervals = formValue.interval.map((val: string) => parseInt(val, 10));

    return {
      name: formValue.name,
      description: formValue.description || null,
      plugin: formValue.plugin,
      pluginOptions: formValue.pluginOptions,
      active: formValue.active,
      interval: intervals,
      smtpServer: formValue.smtpServer,
      stmpPort: formValue.smtpPort,
      smtpUser: formValue.smtpUser,
      smtpPassword: formValue.smtpPassword || null
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
    this.router.navigate(['/notifications/configs']);
  }
}

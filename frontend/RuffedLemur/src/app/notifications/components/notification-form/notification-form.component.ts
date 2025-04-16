import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  NotificationLevel,
  NotificationType
} from '../../../shared/models/notification.model';
import { NotificationService } from '../../services/notification.service';
import { ErrorService } from '../../../core/services/error/error.service';

@Component({
  selector: 'app-notification-form',
  templateUrl: './notification-form.component.html',
  styleUrls: ['./notification-form.component.scss']
})
export class NotificationFormComponent implements OnInit {
  notificationForm: FormGroup;
  isSending = false;
  error = '';
  notificationLevels = Object.values(NotificationLevel);
  notificationTypes = Object.values(NotificationType);
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private notificationService: NotificationService,
    private errorService: ErrorService
  ) {
    this.notificationForm = this.createForm();
  }

  ngOnInit(): void {
  }

  private createForm(): FormGroup {
    return this.fb.group({
      subject: ['', [Validators.required]],
      message: ['', [Validators.required]],
      type: [NotificationType.USER, [Validators.required]],
      level: [NotificationLevel.INFO, [Validators.required]],
      fromAddress: ['', [Validators.required, Validators.email]],
      toAddress: this.fb.array([
        this.fb.control('', [Validators.required, Validators.email])
      ])
    });
  }

  get toAddressArray() {
    return this.notificationForm.get('toAddress') as FormArray;
  }

  addRecipient() {
    this.toAddressArray.push(this.fb.control('', [Validators.required, Validators.email]));
  }

  removeRecipient(index: number) {
    if (this.toAddressArray.length > 1) {
      this.toAddressArray.removeAt(index);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedFile = input.files[0];
    }
  }

  clearFile() {
    this.selectedFile = null;
  }

  onSubmit() {
    if (this.notificationForm.invalid) {
      this.markFormGroupTouched(this.notificationForm);
      return;
    }

    this.isSending = true;

    const notificationData = this.prepareNotificationData();

    // First upload attachment if present
    if (this.selectedFile) {
      this.notificationService.uploadAttachment(this.selectedFile).subscribe({
        next: (fileData) => {
          // Attach the uploaded file info to notification
          notificationData.attachment = fileData;
          this.sendNotification(notificationData);
        },
        error: (err) => {
          this.error = 'Failed to upload attachment';
          this.errorService.logError(err);
          this.isSending = false;
        }
      });
    } else {
      // No attachment, just send the notification
      this.sendNotification(notificationData);
    }
  }

  private sendNotification(notificationData: any) {
    this.notificationService.sendNotification(notificationData).subscribe({
      next: () => {
        this.isSending = false;
        this.router.navigate(['/notifications']);
      },
      error: (err) => {
        this.error = 'Failed to send notification';
        this.errorService.logError(err);
        this.isSending = false;
      }
    });
  }

  prepareNotificationData() {
    const formValue = this.notificationForm.value;

    return {
      subject: formValue.subject,
      message: formValue.message,
      type: formValue.type,
      level: formValue.level,
      fromAddress: formValue.fromAddress,
      toAddress: formValue.toAddress,
      //attachment: formValue.attachment
      // Attachment will be added later after upload if exists
    };
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }

      if (control instanceof FormArray) {
        for (let i = 0; i < control.length; i++) {
          control.at(i).markAsTouched();
        }
      }
    });
  }

  cancel() {
    this.router.navigate(['/notifications']);
  }

  getLevelDescription(level: NotificationLevel): string {
    switch (level) {
      case NotificationLevel.INFO:
        return 'For reports and summaries';
      case NotificationLevel.WARNING:
        return 'For large numbers of certificates expiring at once';
      case NotificationLevel.ERROR:
        return 'For email bounces or other errors';
      case NotificationLevel.SUCCESS:
        return 'For certificate issuance/renewals';
      case NotificationLevel.EXPIRATION:
        return 'For expiration notifications';
      default:
        return '';
    }
  }
}

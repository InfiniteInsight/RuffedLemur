import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-error-display',
  template: `
    <div *ngIf="errorMessage" class="error-container" [ngClass]="severityClass">
      <mat-icon class="error-icon">{{ icon }}</mat-icon>
      <div class="error-content">
        <div class="error-message">{{ errorMessage }}</div>
        <div *ngIf="detailMessage" class="error-detail">{{ detailMessage }}</div>
      </div>
      <div class="error-actions">
        <button *ngIf="showRetry" mat-button color="primary" (click)="onRetry.emit()">
          <mat-icon>refresh</mat-icon> Retry
        </button>
        <button mat-icon-button (click)="onDismiss.emit()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .error-container {
      display: flex;
      align-items: center;
      padding: 16px;
      margin-bottom: 16px;
      border-radius: 4px;
      background-color: #ffebee;
      color: #c62828;
    }

    .warning {
      background-color: #fff8e1;
      color: #f57f17;
    }

    .info {
      background-color: #e3f2fd;
      color: #1565c0;
    }

    .error-icon {
      margin-right: 16px;
      font-size: 24px;
      height: 24px;
      width: 24px;
    }

    .error-content {
      flex: 1;
    }

    .error-message {
      font-weight: 500;
    }

    .error-detail {
      font-size: 14px;
      margin-top: 4px;
      opacity: 0.8;
    }

    .error-actions {
      display: flex;
      align-items: center;
    }
  `]
})
export class ErrorDisplayComponent {
  @Input() errorMessage = '';
  @Input() detailMessage = '';
  @Input() severity: 'error' | 'warning' | 'info' = 'error';
  @Input() showRetry = false;

  @Output() onRetry = new EventEmitter<void>();
  @Output() onDismiss = new EventEmitter<void>();

  get severityClass(): string {
    return this.severity;
  }

  get icon(): string {
    switch (this.severity) {
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'error';
    }
  }
}

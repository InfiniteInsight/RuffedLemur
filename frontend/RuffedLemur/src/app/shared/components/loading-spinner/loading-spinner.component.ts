import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  template: `
    <div class="loading-container" [class.overlay]="overlay" [style.height.px]="height">
      <mat-spinner [diameter]="diameter"></mat-spinner>
      <div *ngIf="message" class="loading-message">{{ message }}</div>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100px;
    }

    .overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.7);
      z-index: 10;
    }

    .loading-message {
      margin-top: 16px;
      color: #555;
      font-size: 14px;
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() diameter = 40;
  @Input() overlay = false;
  @Input() message = '';
  @Input() height = 200;
}

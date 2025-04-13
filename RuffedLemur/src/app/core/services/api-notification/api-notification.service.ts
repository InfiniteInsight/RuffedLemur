// src/app/core/services/notification/api-notification.service.ts

import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ApiNotificationService {
  // Default configuration for notifications
  private defaultConfig: MatSnackBarConfig = {
    duration: 5000,
    horizontalPosition: 'right',
    verticalPosition: 'bottom'
  };

  constructor(private snackBar: MatSnackBar) {}

  /**
   * Show a success notification
   * @param message The message to display
   * @param action Optional action text
   * @param config Optional snackbar configuration
   */
  success(message: string, action: string = 'Close', config?: MatSnackBarConfig): void {
    this.show(message, action, {
      ...this.defaultConfig,
      ...config,
      panelClass: ['success-notification']
    });
  }

  /**
   * Show an error notification
   * @param message The message to display
   * @param action Optional action text
   * @param config Optional snackbar configuration
   */
  error(message: string, action: string = 'Close', config?: MatSnackBarConfig): void {
    this.show(message, action, {
      ...this.defaultConfig,
      ...config,
      panelClass: ['error-notification'],
      duration: 10000 // Longer duration for errors
    });
  }

  /**
   * Show a warning notification
   * @param message The message to display
   * @param action Optional action text
   * @param config Optional snackbar configuration
   */
  warn(message: string, action: string = 'Close', config?: MatSnackBarConfig): void {
    this.show(message, action, {
      ...this.defaultConfig,
      ...config,
      panelClass: ['warning-notification']
    });
  }

  /**
   * Show an info notification
   * @param message The message to display
   * @param action Optional action text
   * @param config Optional snackbar configuration
   */
  info(message: string, action: string = 'Close', config?: MatSnackBarConfig): void {
    this.show(message, action, {
      ...this.defaultConfig,
      ...config,
      panelClass: ['info-notification']
    });
  }

  /**
   * Show a notification with custom configuration
   * @param message The message to display
   * @param action Optional action text
   * @param config Optional snackbar configuration
   */
  private show(message: string, action: string, config: MatSnackBarConfig): void {
    this.snackBar.open(message, action, config);
  }
}

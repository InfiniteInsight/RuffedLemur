// Path: frontend/RuffedLemur/src/app/core/guards/pending-changes.guard.ts
import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { map } from 'rxjs/operators';

export interface ComponentCanDeactivate {
  canDeactivate: () => boolean | Observable<boolean>;
}

@Injectable({
  providedIn: 'root'
})
export class PendingChangesGuard implements CanDeactivate<ComponentCanDeactivate> {
  constructor(private dialog: MatDialog) {}

  canDeactivate(component: ComponentCanDeactivate): Observable<boolean> | boolean {
    // If the component has a canDeactivate method, use it
    if (component.canDeactivate()) {
      return true;
    }

    // Otherwise, show a confirmation dialog
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Are you sure you want to leave this page?',
        confirmButtonText: 'Leave Page',
        cancelButtonText: 'Stay on Page',
        type: 'warning'
      }
    });

    return dialogRef.afterClosed().pipe(
      map(result => !!result)
    );
  }
}

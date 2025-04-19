// frontend/RuffedLemur/src/app/endpoints/components/endpoint-detail/endpoint-detail.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { Endpoint } from '../../../shared/models/endpoint.model';
import { Certificate } from '../../../shared/models/certificate.model';
import { EndpointService } from '../../services/endpoint.service';
import { ErrorService } from '../../../core/services/error/error.service';
import { ApiNotificationService } from '../../../core/services/api-notification/api-notification.service';
import { isStringId, idToString } from '../../../shared/utils/type-guard';

@Component({
  selector: 'app-endpoint-detail',
  templateUrl: './endpoint-detail.component.html',
  styleUrls: ['./endpoint-detail.component.scss']
})
export class EndpointDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  endpoint: Endpoint | null = null;
  certificates: Certificate[] = [];
  isLoading = true;
  isLoadingCertificates = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private endpointService: EndpointService,
    private errorService: ErrorService,
    private notificationService: ApiNotificationService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEndpoint(id);
    } else {
      this.error = 'Endpoint ID not provided';
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadEndpoint(id: string | number): void {
    this.isLoading = true;
    this.error = '';

    this.endpointService.getEndpoint(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.endpoint = data;
          this.isLoading = false;
          if (data.active) {
            this.loadCertificates(id);
          }
        },
        error: (err) => {
          this.error = 'Failed to load endpoint details';
          this.errorService.logError(err);
          this.notificationService.error('Failed to load endpoint details');
          this.isLoading = false;
        }
      });
  }

  loadCertificates(id: string | number): void {
    this.isLoadingCertificates = true;

    this.endpointService.getCertificatesByEndpoint(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.certificates = data;
          this.isLoadingCertificates = false;
        },
        error: (err) => {
          this.errorService.logError(err);
          this.isLoadingCertificates = false;
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/endpoints']);
  }

  goToEdit(): void {
    if (this.endpoint) {
      this.router.navigate(['/endpoints', this.endpoint.id, 'edit']);
    }
  }

  toggleActive(): void {
    if (!this.endpoint) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: this.endpoint.active ? 'Deactivate Endpoint' : 'Activate Endpoint',
        message: `Are you sure you want to ${this.endpoint.active ? 'deactivate' : 'activate'} "${this.endpoint.name}"?`,
        confirmButtonText: this.endpoint.active ? 'Deactivate' : 'Activate',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result && this.endpoint) {
          const updatedEndpoint: Partial<Endpoint> = {
            ...this.endpoint,
            active: !this.endpoint.active
          };

          this.endpointService.updateEndpoint(this.endpoint.id!, updatedEndpoint)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (data) => {
                this.endpoint = data;
                const action = data.active ? 'activated' : 'deactivated';
                this.notificationService.success(`Endpoint "${data.name}" ${action} successfully`);

                if (data.active) {
                  this.loadCertificates(data.id!);
                }
              },
              error: (err) => {
                this.errorService.logError(err);
                this.notificationService.error(`Failed to update endpoint status`);
              }
            });
        }
      });
  }

  deleteEndpoint(): void {
    if (!this.endpoint) return;

    if (this.endpoint.active) {
      this.notificationService.error('Cannot delete an active endpoint. Deactivate it first.');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Endpoint',
        message: `Are you sure you want to delete "${this.endpoint.name}"? This action cannot be undone.`,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'danger'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result && this.endpoint) {
          this.endpointService.deleteEndpoint(this.endpoint.id!)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.notificationService.success(`Endpoint "${this.endpoint!.name}" deleted successfully`);
                this.router.navigate(['/endpoints']);
              },
              error: (err) => {
                this.errorService.logError(err);
                this.notificationService.error(`Failed to delete endpoint "${this.endpoint!.name}"`);
              }
            });
        }
      });
  }
}

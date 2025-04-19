// frontend/RuffedLemur/src/app/endpoints/components/endpoint-list/endpoint-list.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { Endpoint } from '../../../shared/models/endpoint.model';
import { EndpointService } from '../../services/endpoint.service';
import { ErrorService } from '../../../core/services/error/error.service';
import { ApiNotificationService } from '../../../core/services/api-notification/api-notification.service';

@Component({
  selector: 'app-endpoint-list',
  templateUrl: './endpoint-list.component.html',
  styleUrls: ['./endpoint-list.component.scss']
})
export class EndpointListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  endpoints: Endpoint[] = [];
  displayedColumns: string[] = ['name', 'type', 'owner', 'active', 'certificateCount', 'actions'];
  isLoading = true;
  error = '';

  // Pagination
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;
  pageSizeOptions = [5, 10, 25, 50, 100, 150, 200, 250, 500, 1000 ];

  // Filtering
  filterText = '';

  constructor(
    private endpointService: EndpointService,
    private errorService: ErrorService,
    private notificationService: ApiNotificationService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadEndpoints();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadEndpoints(): void {
    this.isLoading = true;
    this.error = '';

    this.endpointService.getEndpoints({
      page: this.currentPage,
      size: this.pageSize,
      filter: this.filterText
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.endpoints = data.items;
        this.totalItems = data.total;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load endpoints';
        this.errorService.logError(err);
        this.notificationService.error('Failed to load endpoints');
        this.isLoading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadEndpoints();
  }

  applyFilter(): void {
    this.currentPage = 0; // Reset to first page when filtering
    this.loadEndpoints();
  }

  clearFilter(): void {
    this.filterText = '';
    this.applyFilter();
  }

  deleteEndpoint(endpoint: Endpoint): void {
    if (endpoint.active) {
      this.notificationService.error('Cannot delete an active endpoint. Deactivate it first.');
      return;
    }

    // Replace native confirm with MatDialog
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Endpoint',
        message: `Are you sure you want to delete "${endpoint.name}"? This action cannot be undone.`,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'danger'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.endpointService.deleteEndpoint(endpoint.id!)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.loadEndpoints();
                this.notificationService.success(`Endpoint "${endpoint.name}" deleted successfully`);
              },
              error: (err) => {
                this.errorService.logError(err);
                this.notificationService.error(`Failed to delete endpoint "${endpoint.name}"`);
              }
            });
        }
      });
  }
}

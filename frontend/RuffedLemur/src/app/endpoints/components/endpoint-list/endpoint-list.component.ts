// src/app/endpoints/components/endpoint-list/endpoint-list.component.ts
import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Endpoint } from '../../../shared/models/endpoint.model';
import { EndpointService } from '../../services/endpoint.service';
import { ErrorService } from '../../../core/services/error/error.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';




@Component({
  selector: 'app-endpoint-list',
  templateUrl: './endpoint-list.component.html',
  styleUrls: ['./endpoint-list.component.scss']
})
export class EndpointListComponent implements OnInit {
  endpoints: Endpoint[] = [];
  displayedColumns: string[] = ['name', 'type', 'owner', 'team', 'active', 'certificateCount', 'actions'];
  isLoading = true;
  error = '';

  // Pagination
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;
  pageSizeOptions = [5, 10, 25, 50, 100, 150, 200, 250, 500];

  // Filtering
  filterText = '';

  constructor(
    private endpointService: EndpointService,
    private errorService: ErrorService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadEndpoints();
  }

  loadEndpoints(): void {
    this.isLoading = true;
    this.endpointService.getEndpoints({
      page: this.currentPage,
      size: this.pageSize,
      filter: this.filterText
    }).subscribe({
      next: (data) => {
        this.endpoints = data.items;
        this.totalItems = data.total;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load endpoints';
        this.errorService.logError(err);
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
    if (confirm(`Are you sure you want to delete "${endpoint.name}"? This action cannot be undone.`)) {
      this.endpointService.deleteEndpoint(endpoint.id!).subscribe({
        next: () => {
          this.loadEndpoints();
          // Show success notification
        },
        error: (err) => {
          this.errorService.logError(err);
          // Show error notification
        }
      });
    }
  }
}

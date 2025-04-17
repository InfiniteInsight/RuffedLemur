// frontend/RuffedLemur/src/app/authorities/components/authority-list/authority-list.component.ts
import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Authority } from '../../../shared/models/authority.model';
import { AuthorityService } from '../../services/authority.service';
import { ErrorService } from '../../../core/services/error/error.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-authority-list',
  templateUrl: './authority-list.component.html',
  styleUrls: ['./authority-list.component.scss']
})
export class AuthorityListComponent implements OnInit {
  // Component properties
  authorities: Authority[] = [];
  displayedColumns: string[] = ['name', 'owner', 'active', 'certificates', 'createdAt', 'actions'];
  isLoading = true;
  error = '';

  // Pagination
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;
  pageSizeOptions = [5, 10, 25, 50];

  // Filtering
  filterText = '';

  constructor(
    private authorityService: AuthorityService,
    private errorService: ErrorService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadAuthorities();
  }

  loadAuthorities(): void {
    this.isLoading = true;
    this.error = '';

    this.authorityService.getAuthorities({
      page: this.currentPage,
      size: this.pageSize,
      filter: this.filterText
    }).subscribe({
      next: (data) => {
        // Handle both paginated and non-paginated responses
        if (Array.isArray(data)) {
          // If data is a direct array of authorities
          this.authorities = data;
          this.totalItems = data.length;
        } else if (data && 'items' in data && Array.isArray(data.items)) {
          // If data is a paginated response with items property
          this.authorities = data.items;
          this.totalItems = data.total;
        } else {
          // Fallback if response format is unexpected
          this.authorities = [];
          this.totalItems = 0;
          console.warn('Unexpected response format from authority service', data);
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load authorities';
        this.isLoading = false;
        // Error is already handled in the service
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadAuthorities();
  }

  applyFilter(): void {
    this.currentPage = 0; // Reset to the first page when filtering
    this.loadAuthorities();
  }

  clearFilter(): void {
    this.filterText = '';
    this.applyFilter();
  }

  exportAuthority(id: number, format: 'pem' | 'der'): void {
    this.authorityService.exportAuthorityChain(id, format).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `authority-${id}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        this.snackBar.open(`Authority exported successfully in ${format.toUpperCase()} format`, 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
      },
      error: (err) => {
        this.snackBar.open(`Failed to export authority: ${err.message}`, 'Close', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
        // The error service handling is done within the authority service
      }
    });
  }

  deleteAuthority(authority: Authority): void {
    if (confirm(`Are you sure you want to delete "${authority.name}"? This action cannot be undone`)) {
      this.authorityService.deleteAuthority(authority.id!).subscribe({
        next: () => {
          this.loadAuthorities();
          this.snackBar.open(`Authority "${authority.name}" has been deleted`, 'Close', {
            duration: 3000,
            panelClass: 'success-snackbar'
          });
        },
        error: (err) => {
          this.snackBar.open(`Failed to delete authority: ${err.message}`, 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
          // The error service handling is done within the authority service
        }
      });
    }
  }
}

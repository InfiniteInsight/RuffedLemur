import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Authority } from '../../../shared/models/authority.model';
import { AuthorityService } from '../../services/authority.service';
import { ErrorService } from '../../../core/services/error/error.service';

@Component({
  selector: 'app-authority-list',
  templateUrl: './authority-list.component.html',
  styleUrls: ['./authority-list.component.scss']
})

export class AuthorityListComponent implements OnInit {

  authorities: Authority[] = [];
  displayedColumns: string[] = ['name', 'owner', 'active', 'certificates', 'createdAt', 'actions'];
  isLoading = true;
  error = '';

  // Pagination
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;
  pageSizeOptions = [5, 10, 25, 50];

  //filtering
  filterText = '';

  constructor(
    private authorityService: AuthorityService,
    private errorService: ErrorService
  ) { }

  ngOnInit(): void {
    this.loadAuthorities();
  }

  loadAuthorities(): void {
    this.isLoading = true;

    this.authorityService.getAuthorities({
      page: this.currentPage,
      size: this.pageSize,
      filter: this.filterText
    }).subscribe({
      next: (data) => {
        // Handle both paginated and non-paginated responses
        if (Array.isArray(data)) {
          this.authorities = data;
          this.totalItems = data.length;
        } else if (data && data.items) {
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
        this.errorService.logError(err);
        this.isLoading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadAuthorities();
  }

  applyFilter(): void {
    this.currentPage = 0; //reset to the first page when filtering
    this.loadAuthorities();
  }

  clearFilter(): void {
    this.filterText = '';
    this.applyFilter();

  }

  exportAuthority(id: number, format: 'pem' | 'der'): void {
    this.authorityService.exportAuthorityChain(id, format),subscribe({
      next: (blob: any) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `authority-${id}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      },
      error: (err: any) => {
        this.errorService.logError(err)
      }
    });
  }

  deleteAuthority(authority: Authority): void {
    if(confirm(`Are you sure you want to delete "${authority.name}"? This action cannot be undone`)) {
      this.authorityService.deleteAuthority(authority.id!).subscribe({
        next: () => {
          this.loadAuthorities();
          //to do: show success message
        },
        error: (err) => {
          this.errorService.logError(err);
          //to do: show error message
        }
      });
    }
  }




}

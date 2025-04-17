import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { User } from '../../../shared/models/admin.model';
import { AdminService } from '../../services/admin.service';
import { ErrorService } from '../../../core/services/error/error.service';
import { AuthService } from '../../../core/services/auth/auth.service';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  displayedColumns: string[] = ['username', 'email', 'fullName', 'roles', 'active', 'actions', 'team'];
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
    private adminService: AdminService,
    private errorService: ErrorService,
    private dialog: MatDialog,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.adminService.getUsers({
      page: this.currentPage,
      size: this.pageSize,
      filter: this.filterText
    }).subscribe({
      next: (data) => {
        this.users = data.items;
        this.totalItems = data.total;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load users';
        this.errorService.logError(err);
        this.isLoading = false;
      }
    });
  }

  canPerformAction(action: string): boolean {
    return this.authService.hasRole('ADMIN') ||
           this.authService.hasPermission(`user:${action}`);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  applyFilter(): void {
    this.currentPage = 0; // Reset to first page when filtering
    this.loadUsers();
  }

  clearFilter(): void {
    this.filterText = '';
    this.applyFilter();
  }

  toggleUserStatus(user: User): void {
    const updatedUser = {
      ...user,
      active: !user.active
    };

    this.adminService.updateUser(user.id!, { active: !user.active }).subscribe({
      next: (data) => {
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users[index].active = data.active;
        }
      },
      error: (err) => {
        this.errorService.logError(err);
        // Show error notification
      }
    });
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) {
      this.adminService.deleteUser(user.id!).subscribe({
        next: () => {
          this.loadUsers();
          // Show success notification
        },
        error: (err) => {
          this.errorService.logError(err);
          // Show error notification
        }
      });
    }
  }

  getFullName(user: User): string {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return 'N/A';
  }

  getRolesList(user: User): string {
    if (!user.roles || user.roles.length === 0) {
      return 'No roles';
    }

    return user.roles.map(role => role.name).join(', ');
  }
}

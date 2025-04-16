import { Component, OnInit } from '@angular/core';
import { Role } from '../../../shared/models/admin.model';
import { AdminService } from '../../services/admin.service';
import { ErrorService } from '../../../core/services/error/error.service';

@Component({
  selector: 'app-role-management',
  templateUrl: './role-management.component.html',
  styleUrls: ['./role-management.component.scss']
})
export class RoleManagementComponent implements OnInit {
  roles: Role[] = [];
  displayedColumns: string[] = ['name', 'description', 'permissions', 'actions'];
  isLoading = true;
  error = '';

  constructor(
    private adminService: AdminService,
    private errorService: ErrorService
  ) { }

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.isLoading = true;

    this.adminService.getRoles().subscribe({
      next: (data) => {
        this.roles = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load roles';
        this.errorService.logError(err);
        this.isLoading = false;
      }
    });
  }

  deleteRole(role: Role): void {
    if (confirm(`Are you sure you want to delete the role "${role.name}"? This may affect users with this role.`)) {
      this.adminService.deleteRole(role.id!).subscribe({
        next: () => {
          this.loadRoles();
        },
        error: (err) => {
          this.error = 'Failed to delete role';
          this.errorService.logError(err);
        }
      });
    }
  }

  getPermissionsList(role: Role): string {
    if (!role.permissions || role.permissions.length === 0) {
      return 'No permissions';
    }

    // If there are too many permissions, show first few and count
    if (role.permissions.length > 3) {
      const firstThree = role.permissions.slice(0, 3).map(p => p.name).join(', ');
      return `${firstThree} +${role.permissions.length - 3} more`;
    }

    return role.permissions.map(p => p.name).join(', ');
  }
}

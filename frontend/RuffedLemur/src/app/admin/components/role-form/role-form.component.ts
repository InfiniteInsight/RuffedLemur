import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';

import { Role, Permission } from '../../../shared/models/admin.model';
import { AdminService } from '../../services/admin.service';
import { ErrorService } from '../../../core/services/error/error.service';

@Component({
  selector: 'app-role-form',
  templateUrl: './role-form.component.html',
  styleUrls: ['./role-form.component.scss']
})
export class RoleFormComponent implements OnInit {
  roleForm: FormGroup;
  roleId: number | null = null;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  error = '';
  allPermissions: Permission[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private adminService: AdminService,
    private errorService: ErrorService
  ) {
    // Initialize form with empty values
    this.roleForm = this.createForm();

    // Check if we are in edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.roleId = +id;
      this.isEditMode = true;
    }
  }

  ngOnInit(): void {
    // Load all available permissions
    this.loadPermissions();

    // If in edit mode, load role data
    if (this.isEditMode && this.roleId) {
      this.loadRole(this.roleId);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      permissions: [[]]
    });
  }

  loadPermissions(): void {
    this.adminService.getPermissions().subscribe({
      next: (data) => {
        this.allPermissions = data;
      },
      error: (err) => {
        this.error = 'Failed to load permissions';
        this.errorService.logError(err);
      }
    });
  }

  loadRole(id: number): void {
    this.isLoading = true;

    this.adminService.getRole(id).subscribe({
      next: (role) => {
        // Extract permission IDs for the form
        const permissionIds = role.permissions.map(perm => perm.id);

        // Patch form values
        this.roleForm.patchValue({
          name: role.name,
          description: role.description || '',
          permissions: permissionIds
        });

        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load role details';
        this.errorService.logError(err);
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.roleForm.invalid) {
      this.markFormGroupTouched(this.roleForm);
      return;
    }

    this.isSaving = true;
    const roleData = this.prepareRoleData();

    let saveObservable: Observable<Role>;

    if (this.isEditMode && this.roleId) {
      saveObservable = this.adminService.updateRole(this.roleId, roleData);
    } else {
      saveObservable = this.adminService.createRole(roleData);
    }

    saveObservable.subscribe({
      next: () => {
        this.isSaving = false;
        this.router.navigate(['/admin/roles']);
      },
      error: (err) => {
        this.error = this.isEditMode ? 'Failed to update role' : 'Failed to create role';
        this.errorService.logError(err);
        this.isSaving = false;
      }
    });
  }

  prepareRoleData(): Partial<Role> {
    const formValue = this.roleForm.value;

    // Convert permission IDs to permission objects for the API
    const permissions = formValue.permissions.map((permId: number) => {
      return { id: permId };
    });

    return {
      name: formValue.name,
      description: formValue.description || null,
      permissions: permissions
    };
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/roles']);
  }
}

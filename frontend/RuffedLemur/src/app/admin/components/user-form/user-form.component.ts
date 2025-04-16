import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';

import { User, Role } from '../../../shared/models/admin.model';
import { AdminService } from '../../services/admin.service';
import { ErrorService } from '../../../core/services/error/error.service';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  userId: number | null = null;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  error = '';
  roles: Role[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private adminService: AdminService,
    private errorService: ErrorService
  ) {
    // Initialize form with empty values
    this.userForm = this.createForm();

    // Check if we are in edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.userId = +id;
      this.isEditMode = true;
    }
  }

  ngOnInit(): void {
    // Load available roles
    this.loadRoles();

    // If in edit mode, load user data
    if (this.isEditMode && this.userId) {
      this.loadUser(this.userId);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      firstName: [''],
      lastName: [''],
      roles: [[]],
      active: [true]
    });
  }

  loadRoles(): void {
    this.adminService.getRoles().subscribe({
      next: (data) => {
        this.roles = data;
      },
      error: (err) => {
        this.error = 'Failed to load roles';
        this.errorService.logError(err);
      }
    });
  }

  loadUser(id: number): void {
    this.isLoading = true;

    this.adminService.getUser(id).subscribe({
      next: (user) => {
        // Extract role IDs for the form
        const roleIds = user.roles.map(role => role.id);

        // Patch form values
        this.userForm.patchValue({
          username: user.username,
          email: user.email,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          roles: roleIds,
          active: user.active
        });

        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load user details';
        this.errorService.logError(err);
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.markFormGroupTouched(this.userForm);
      return;
    }

    this.isSaving = true;
    const userData = this.prepareUserData();

    let saveObservable: Observable<User>;

    if (this.isEditMode && this.userId) {
      saveObservable = this.adminService.updateUser(this.userId, userData);
    } else {
      saveObservable = this.adminService.createUser(userData);
    }

    saveObservable.subscribe({
      next: () => {
        this.isSaving = false;
        this.router.navigate(['/admin/users']);
      },
      error: (err) => {
        this.error = this.isEditMode ? 'Failed to update user' : 'Failed to create user';
        this.errorService.logError(err);
        this.isSaving = false;
      }
    });
  }

  prepareUserData(): Partial<User> {
    const formValue = this.userForm.value;

    // Convert role IDs to role objects for the API
    const roles = formValue.roles.map((roleId: number) => {
      return { id: roleId };
    });

    return {
      username: formValue.username,
      email: formValue.email,
      firstName: formValue.firstName || null,
      lastName: formValue.lastName || null,
      roles: roles,
      active: formValue.active
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
    if (this.isEditMode) {
      this.router.navigate(['/admin/users']);
    } else {
      this.router.navigate(['/admin/users']);
    }
  }

  compareRoles(role1: any, role2: any): boolean {
    return role1 && role2 ? role1 === role2 : role1 === role2;
  }
}

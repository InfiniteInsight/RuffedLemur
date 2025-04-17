// frontend/RuffedLemur/src/app/admin/admin-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../core/guards/auth.guard';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { UserFormComponent } from './components/user-form/user-form.component';
import { RoleManagementComponent } from './components/role-management/role-management.component';
import { RoleFormComponent } from './components/role-form/role-form.component';
import { SystemSettingsComponent } from './components/system-settings/system-settings.component';
import { SystemLogsComponent } from './components/system-logs/system-logs.component';

const routes: Routes = [
  {
    path: '',
    component: AdminDashboardComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'dashboard',
    component: AdminDashboardComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'users',
    component: UserManagementComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'users/new',
    component: UserFormComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'users/:id',
    component: UserFormComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'roles',
    component: RoleManagementComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'roles/new',
    component: RoleFormComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'roles/:id',
    component: RoleFormComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'settings',
    component: SystemSettingsComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'logs',
    component: SystemLogsComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }

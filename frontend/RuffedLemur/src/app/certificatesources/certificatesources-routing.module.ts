// frontend/RuffedLemur/src/app/certificatesources/certificatesources-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CertificateSourceListComponent } from './components/certificate-sources-list/certificatesources-list.component';
import { CertificateSourceFormComponent } from './components/certificate-sources-form/certificatesources-form.component';
import { CertificateSourceDetailComponent } from './components/certificate-sources-detail/certificatesources-detail.component';
import { AuthGuard } from '../core/guards/auth.guard';
import { PendingChangesGuard } from '../core/guards/pending-changes.guard';

const routes: Routes = [
  {
    path: '',
    component: CertificateSourceListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'new',
    component: CertificateSourceFormComponent,
    canActivate: [AuthGuard],
    canDeactivate: [PendingChangesGuard]
  },
  {
    path: ':id',
    component: CertificateSourceDetailComponent,
    canActivate: [AuthGuard]
  },
  {
    path: ':id/edit',
    component: CertificateSourceFormComponent,
    canActivate: [AuthGuard],
    canDeactivate: [PendingChangesGuard],
    data: { isEdit: true }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CertificatesourcesRoutingModule { }

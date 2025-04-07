// src/app/certificates/certificates.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CertificateListComponent } from './components/certificate-list/certificate-list.component';
import { CertificateDetailComponent } from './components/certificate-detail/certificate-detail.component';
import { CertificateFormComponent } from './components/certificate-form/certificate-form.component';
import { AuthGuard } from '../core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: CertificateListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'new',
    component: CertificateFormComponent,
    canActivate: [AuthGuard]
  },
  {
    path: ':id',
    component: CertificateDetailComponent,
    canActivate: [AuthGuard]
    // src/app/certificates/certificates.module.ts (continued)
  },
  {
    path: ':id/edit',
    component: CertificateFormComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  declarations: [
    CertificateListComponent,
    CertificateDetailComponent,
    CertificateFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule
  ]
})
export class CertificatesModule { }

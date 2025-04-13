// src/app/certificatesources/certificatesources.module.ts

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Material imports
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
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';

// Components
import { CertificateSourceListComponent } from './components/certificate-sources-list/certificatesources-list.component'
import { CertificateSourceFormComponent } from './components/certificate-sources-form/certificatesources-form.component'
import { CertificateSourceDetailComponent } from './components/certificate-sources-detail/certificatesources-detail.component';

// Guards
import { AuthGuard } from '../core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: CertificateSourceListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'new',
    component: CertificateSourceFormComponent,
    canActivate: [AuthGuard]
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
    data: { isEdit: true }
  }
];

@NgModule({
  declarations: [
    CertificateSourceListComponent,
    CertificateSourceFormComponent,
    CertificateSourceDetailComponent
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
    MatTooltipModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatCheckboxModule,
    MatRadioModule
  ]
})
export class CertificateSourcesModule { }

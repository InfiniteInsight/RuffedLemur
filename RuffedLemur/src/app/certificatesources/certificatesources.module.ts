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

// Components
import { CertificateSourceListComponent } from './components/certificate-source-list/certificate-source-list.component';
import { CertificateSourceFormComponent } from './components/certificate-source-form/certificate-source-form.component';

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
    component: CertificateSourceFormComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  declarations: [
    CertificateSourceListComponent,
    CertificateSourceFormComponent
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
    MatSlideToggleModule
  ]
})
export class CertificateSourcesModule { }

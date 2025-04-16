// src/app/authorities/authorities.module.ts
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
import { MatChipsModule } from '@angular/material/chips';

// Components
import { AuthorityListComponent } from './components/authority-list/authority-list.component';
import { AuthorityDetailComponent } from './components/authority-detail/authority-detail.component';
import { AuthorityFormComponent } from './components/authority-form/authority-form.component';

// Guards
import { AuthGuard } from '../core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: AuthorityListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'new',
    component: AuthorityFormComponent,
    canActivate: [AuthGuard]
  },
  {
    path: ':id',
    component: AuthorityDetailComponent,
    canActivate: [AuthGuard]
  },
  {
    path: ':id/edit',
    component: AuthorityFormComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  declarations: [
    AuthorityListComponent,
    AuthorityDetailComponent,
    AuthorityFormComponent
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
    MatChipsModule
  ]
})
export class AuthoritiesModule { }

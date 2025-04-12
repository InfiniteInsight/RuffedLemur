// src/app/notifications/notifications.module.ts

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
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';

// Components
import { NotificationListComponent } from './components/notification-list/notification-list.component';
import { NotificationDetailComponent } from './components/notification-detail/notification-detail.component';
import { NotificationFormComponent } from './components/notification-form/notification-form.component';
import { NotificationConfigListComponent } from './components/notification-config-list/notification-config-list.component';
import { NotificationConfigFormComponent } from './components/notification-config-form/notification-config-form.component';
import { CsvReportGeneratorComponent } from './components/csv-report-generator/csv-report-generator.component';
import { CsvReportListComponent } from './components/csv-report-list/csv-report-list.component';

// Guards
import { AuthGuard } from '../core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: NotificationListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'new',
    component: NotificationFormComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'configs',
    component: NotificationConfigListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'configs/new',
    component: NotificationConfigFormComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'configs/:id',
    component: NotificationConfigFormComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'reports',
    component: CsvReportListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'reports/new',
    component: CsvReportGeneratorComponent,
    canActivate: [AuthGuard]
  },
  {
    path: ':id',
    component: NotificationDetailComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  declarations: [
    NotificationListComponent,
    NotificationDetailComponent,
    NotificationFormComponent,
    NotificationConfigListComponent,
    NotificationConfigFormComponent,
    CsvReportGeneratorComponent,
    CsvReportListComponent
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
    MatChipsModule,
    MatTabsModule,
    MatSlideToggleModule,
    MatCheckboxModule
  ]
})
export class NotificationsModule { }

// frontend/RuffedLemur/src/app/plugins/plugins.module.ts
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
import { MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatSnackBarModule } from '@angular/material/snack-bar';

// Guards
import { AuthGuard } from '../core/guards/auth.guard';
import { PendingChangesGuard } from '../core/guards/pending-changes.guard';

// Components
import { PluginListComponent } from './components/plugin-list/plugin-list.component';
import { PluginDetailComponent } from './components/plugin-detail/plugin-detail.component';
import { PluginInstallDialogComponent } from './components/plugin-install-dialog/plugin-install-dialog.component';

// Services
import { FormValidationService } from '../shared/services/form-validation.service';

const routes: Routes = [
  {
    path: '',
    component: PluginListComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Plugins',
      roles: ['admin', 'plugin_manager']
    }
  },
  {
    path: ':id',
    component: PluginDetailComponent,
    canActivate: [AuthGuard],
    canDeactivate: [PendingChangesGuard],
    data: {
      title: 'Plugin Configuration',
      roles: ['admin', 'plugin_manager']
    }
  }
];

@NgModule({
  declarations: [
    PluginListComponent,
    PluginDetailComponent,
    PluginInstallDialogComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),

    // Material modules
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
    MatDialogModule,
    MatListModule,
    MatSnackBarModule
  ],
  providers: [
    FormValidationService
  ]
})
export class PluginsModule { }

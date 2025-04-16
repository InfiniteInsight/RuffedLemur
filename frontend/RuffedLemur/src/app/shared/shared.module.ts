// src/app/shared/shared.module.ts

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { ErrorDisplayComponent } from './components/error-display/error-display.component';

@NgModule({
  declarations: [
    LoadingSpinnerComponent,
    ErrorDisplayComponent
  ],
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule
  ],
  exports: [
    // Modules
    CommonModule,
    ReactiveFormsModule,

    // Components
    LoadingSpinnerComponent,
    ErrorDisplayComponent
  ]
})
export class SharedModule { }

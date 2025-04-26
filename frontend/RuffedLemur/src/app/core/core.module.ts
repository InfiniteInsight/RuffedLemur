// src/app/core/core.module.ts

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
//import { HttpClientModule } from '@angular/common/http';

// Material imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';

// Components
import { MainLayoutComponent } from './components/layout/main-layout/main-layout.component';
import { HeaderComponent } from './components/navigation/header/header.component';
import { SidebarComponent } from './components/navigation/sidebar/sidebar.component';
import { FooterComponent } from './components/navigation/footer/footer.component';
import { LoadingComponent } from './components/loading/loading.component';
import { UnauthorizedComponent } from './components/unauthorized/unauthorized.component';

@NgModule({
  declarations: [
    MainLayoutComponent,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    LoadingComponent,
    UnauthorizedComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    //HttpClientModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatListModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  exports: [
    MainLayoutComponent,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    LoadingComponent,
    UnauthorizedComponent
  ]
})
export class CoreModule { }

// src/app/app-routing.module.ts

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UnauthorizedComponent } from './core/components/unauthorized/unauthorized.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'certificates',
    loadChildren: () => import('./certificates/certificates.module').then(m => m.CertificatesModule)
  },
  {
    path: 'authorities',
    loadChildren: () => import('./authorities/authorities.module').then(m => m.AuthoritiesModule)
  },
  {
    path: 'endpoints',
    loadChildren: () => import('./endpoints/endpoints.module').then(m => m.EndpointsModule)
  },
  {
    path: 'notifications',
    loadChildren: () => import('./notifications/notifications.module').then(m => m.NotificationsModule)
  },
  {
    path: 'certificatesources',
    loadChildren: () => import('./certificatesources/certificatesources.module').then(m => m.CertificateSourcesModule)
  },
  {
    path: 'plugins',
    loadChildren: () => import('./plugins/plugins.module').then(m => m.PluginsModule)
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'unauthorized',
    component: UnauthorizedComponent
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

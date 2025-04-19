// frontend/RuffedLemur/src/app/dashboard/components/expiring-certs-widget/expiring-certs-widget.component.ts

import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ExpiringCertificate } from '../../../shared/models/dashboard.model';

@Component({
  selector: 'app-expiring-certs-widget',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './expiring-certs-widget.component.html',
  styleUrls: ['./expiring-certs-widget.component.scss']
})
export class ExpiringCertsWidgetComponent implements OnInit {
  @Input() certificates: ExpiringCertificate[] = [];
  @Input() loading = false;
  @Input() error = '';
  @Input() daysToShow = 30;

  displayedColumns: string[] = ['name', 'commonName', 'expirationDate', 'daysUntilExpiration', 'actions'];

  constructor() { }

  ngOnInit(): void { }

  // Helper method to determine severity class based on days until expiration
  getSeverityClass(days: number): string {
    if (days <= 3) return 'critical';
    if (days <= 7) return 'warning';
    return 'normal';
  }
}

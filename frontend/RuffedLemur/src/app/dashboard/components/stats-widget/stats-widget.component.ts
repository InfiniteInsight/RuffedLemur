// frontend/RuffedLemur/src/app/dashboard/components/stats-widget/stats-widget.component.ts

import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CertificateStats } from '../../../shared/models/dashboard.model';

@Component({
  selector: 'app-stats-widget',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './stats-widget.component.html',
  styleUrls: ['./stats-widget.component.scss']
})
export class StatsWidgetComponent implements OnInit {
  @Input() stats: CertificateStats | null = null;
  @Input() loading = false;
  @Input() error = '';

  constructor() { }

  ngOnInit(): void { }

  // Helper method to calculate percentage
  getPercentage(value: number, total: number): number {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  }
}

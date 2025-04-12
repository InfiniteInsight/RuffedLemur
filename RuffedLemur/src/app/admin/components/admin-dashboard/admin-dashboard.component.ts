// src/app/admin/components/admin-dashboard/admin-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service'
import { ErrorService } from '../../../core/services/error/error.service'

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  systemInfo: any = null;
  isLoading = true;
  error = '';

  constructor(
    private adminService: AdminService,
    private errorService: ErrorService
  ) { }

  ngOnInit(): void {
    this.loadSystemInfo();
  }

  loadSystemInfo(): void {
    this.isLoading = true;
    this.adminService.getSystemInfo().subscribe({
      next: (data) => {
        this.systemInfo = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load system information';
        this.errorService.logError(err);
        this.isLoading = false;
      }
    });
  }
}

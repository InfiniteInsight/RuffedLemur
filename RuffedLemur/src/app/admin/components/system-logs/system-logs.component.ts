import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { AdminService } from '../../services/admin.service';
import { ErrorService } from '../../../core/services/error/error.service';
import { animate, state, style, transition, trigger } from '@angular/animations';


// Define a basic Log Entry interface
interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  source: string;
  message: string;
  details?: any;
}

@Component({
  selector: 'app-system-logs',
  templateUrl: './system-logs.component.html',
  styleUrls: ['./system-logs.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0'})),
      state('expanded', style({ height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class SystemLogsComponent implements OnInit {
  logs: LogEntry[] = [];
  displayedColumns: string[] = ['timestamp', 'level', 'source', 'message', 'actions'];
  isLoading = true;
  error = '';
  expandedLog: string | null = null;

  // Pagination
  totalItems = 0;
  pageSize = 25;
  currentPage = 0;
  pageSizeOptions = [10, 25, 50, 100, 150, 200, 250, 500, 1000];

  // Filtering
  filterText = '';
  logLevels = ['ERROR', 'WARNING', 'INFO', 'DEBUG'];
  selectedLevel: string | null = null;

  constructor(
    private adminService: AdminService,
    private errorService: ErrorService
  ) { }

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.isLoading = true;

    // Prepare filter parameters
    const params: any = {
      page: this.currentPage,
      size: this.pageSize,
    };

    if (this.filterText) {
      params.filter = this.filterText;
    }

    if (this.selectedLevel) {
      params.level = this.selectedLevel;
    }

    this.adminService.getLogs(params).subscribe({
      next: (data) => {
        this.logs = data.items;
        this.totalItems = data.total;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load system logs';
        this.errorService.logError(err);
        this.isLoading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadLogs();
  }

  applyFilter(): void {
    this.currentPage = 0; // Reset to first page when filtering
    this.loadLogs();
  }

  clearFilter(): void {
    this.filterText = '';
    this.selectedLevel = null;
    this.applyFilter();
  }

  filterByLevel(level: string | null): void {
    this.selectedLevel = level;
    this.applyFilter();
  }

  toggleDetails(logId: string): void {
    if (this.expandedLog === logId) {
      this.expandedLog = null;
    } else {
      this.expandedLog = logId;
    }
  }

  // Helper methods for styling and formatting
  getLevelClass(level: string): string {
    level = level.toLowerCase();
    switch (level) {
      case 'error': return 'error-level';
      case 'warning': return 'warning-level';
      case 'info': return 'info-level';
      case 'debug': return 'debug-level';
      default: return '';
    }
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  formatJson(json: any): string {
    return JSON.stringify(json, null, 2);
  }

  isExpansionDetailRow = (i: number, row: any) => row.hasOwnProperty('detailRow');
}

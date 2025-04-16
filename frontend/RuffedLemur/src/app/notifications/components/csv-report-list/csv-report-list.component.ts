import { Component, OnInit } from '@angular/core';
import { CSVReportService, CSVReportResult } from '../../../shared/services/csv-report.service';
import { ErrorService } from '../../../core/services/error/error.service';

@Component({
  selector: 'app-csv-report-list',
  templateUrl: './csv-report-list.component.html',
  styleUrls: ['./csv-report-list.component.scss']
})
export class CsvReportListComponent implements OnInit {
  reports: CSVReportResult[] = [];
  isLoading = true;
  error = '';
  displayedColumns: string[] = ['filename', 'count', 'sent', 'actions'];

  constructor(
    private csvReportService: CSVReportService,
    private errorService: ErrorService
  ) { }

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.isLoading = true;
    this.csvReportService.getReports().subscribe({
      next: (data) => {
        this.reports = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load reports';
        this.errorService.logError(err);
        this.isLoading = false;
      }
    });
  }

  downloadReport(reportId: string, filename: string): void {
    this.csvReportService.downloadReport(reportId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (err) => {
        this.error = 'Failed to download report';
        this.errorService.logError(err);
      }
    });
  }

  getReportIdFromUrl(url: string): string {
    // Extract report ID from URL
    // This is a simple implementation - actual extraction would depend on URL structure
    const segments = url.split('/');
    return segments[segments.length - 2];
  }
}

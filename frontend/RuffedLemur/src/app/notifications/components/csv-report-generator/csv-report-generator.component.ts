import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { CSVReportService, CSVReportConfig } from '../../../shared/services/csv-report.service';
import { ErrorService } from '../../../core/services/error/error.service';
import { Authority } from '../../../shared/models/authority.model';
import { AuthorityService } from '../../../authorities/services/authority.service';

@Component({
  selector: 'app-csv-report-generator',
  templateUrl: './csv-report-generator.component.html',
  styleUrls: ['./csv-report-generator.component.scss']
})
export class CsvReportGeneratorComponent implements OnInit {
  reportForm: FormGroup;
  isLoading = false;
  isGenerating = false;
  error = '';
  success = '';
  downloadUrl = '';
  generatedFilename = '';
  recordCount = 0;

  authorities: Authority[] = [];

  // Available columns for the CSV report
  availableColumns = [
    { name: 'name', label: 'Certificate Name', default: true },
    { name: 'commonName', label: 'Common Name', default: true },
    { name: 'owner', label: 'Owner', default: true },
    { name: 'notBefore', label: 'Start Date', default: true },
    { name: 'notAfter', label: 'Expiration Date', default: true },
    { name: 'daysUntilExpiration', label: 'Days Until Expiration', default: true },
    { name: 'issuer', label: 'Issuer', default: true },
    { name: 'authority', label: 'Authority', default: false },
    { name: 'domains', label: 'Domains', default: false },
    { name: 'active', label: 'Status', default: true },
  ];

  reportTypes = [
    { value: 'expiring-certificates', label: 'Expiring Certificates' },
    { value: 'certificates-by-owner', label: 'Certificates by Owner' },
    { value: 'certificates-by-authority', label: 'Certificates by Authority' }
  ];

  constructor(
    private fb: FormBuilder,
    private csvReportService: CSVReportService,
    private authorityService: AuthorityService,
    private errorService: ErrorService
  ) {
    this.reportForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadAuthorities();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      reportType: ['expiring-certificates', Validators.required],
      filename: ['certificate-report.csv', [Validators.required]],
      days: [30, [Validators.min(1), Validators.max(365)]],
      owners: [[]],
      authorities: [[]],
      columns: this.createColumnsArray(),
      sendEmail: [false],
      emailConfig: this.fb.group({
        recipients: this.fb.array([this.fb.control('', [Validators.email])]),
        subject: ['Certificate Expiration Report'],
        body: ['Please find attached a report of certificates that are expiring soon.']
      })
    });
  }

  private createColumnsArray(): FormArray {
    const columnsArray = this.fb.array([]);

    this.availableColumns.forEach(column => {
      columnsArray.push(this.fb.control(column.default));
    });

    return columnsArray;
  }

  get selectedColumns(): string[] {
    const columnsArray = this.reportForm.get('columns') as FormArray;

    return this.availableColumns
      .filter((column, index) => columnsArray.at(index).value)
      .map(column => column.name);
  }

  get recipientsArray(): FormArray {
    return this.reportForm.get('emailConfig.recipients') as FormArray;
  }

  addRecipient(): void {
    this.recipientsArray.push(this.fb.control('', [Validators.email]));
  }

  removeRecipient(index: number): void {
    if (this.recipientsArray.length > 1) {
      this.recipientsArray.removeAt(index);
    }
  }

  loadAuthorities(): void {
    this.isLoading = true;
    this.authorityService.getAuthorities().subscribe({
      next: (data) => {
        // Handle both paginated and non-paginated responses
        if (Array.isArray(data)) {
          this.authorities = data;
        } else if (data && data.items) {
          this.authorities = data.items;
        } else {
          this.authorities = [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load authorities';
        this.errorService.logError(err);
        this.isLoading = false;
      }
    });
  }

  generateReport(): void {
    if (this.reportForm.invalid) {
      this.markFormGroupTouched(this.reportForm);
      return;
    }

    const formValue = this.reportForm.value;

    // Prepare configuration
    const config: CSVReportConfig = {
      includeColumns: this.selectedColumns,
      filename: formValue.filename,
    };

    // Add optional parameters based on report type
    if (formValue.reportType === 'expiring-certificates') {
      config.days = formValue.days;
    }

    if (formValue.owners && formValue.owners.length > 0) {
      config.owners = formValue.owners;
    }

    if (formValue.authorities && formValue.authorities.length > 0) {
      config.authorities = formValue.authorities;
    }

    // Add email configuration if sending email
    if (formValue.sendEmail) {
      config.sendEmail = true;
      config.recipients = formValue.emailConfig.recipients.filter(email => email);
      config.emailSubject = formValue.emailConfig.subject;
      config.emailBody = formValue.emailConfig.body;
    }

    this.isGenerating = true;
    this.error = '';
    this.success = '';
    this.downloadUrl = '';

    // Call appropriate service method based on report type
    let reportObservable;

    switch(formValue.reportType) {
      case 'expiring-certificates':
        reportObservable = this.csvReportService.generateExpiringCertificatesReport(config);
        break;
      case 'certificates-by-owner':
        reportObservable = this.csvReportService.generateCertificatesByOwnerReport(config);
        break;
      case 'certificates-by-authority':
        reportObservable = this.csvReportService.generateCertificatesByAuthorityReport(config);
        break;
      default:
        this.error = 'Invalid report type selected';
        this.isGenerating = false;
        return;
    }

    reportObservable.subscribe({
      next: (result) => {
        this.isGenerating = false;
        this.generatedFilename = result.filename;
        this.recordCount = result.count;

        if (result.url) {
          this.downloadUrl = result.url;
        }

        if (formValue.sendEmail && result.sent) {
          this.success = `Report successfully generated and sent to ${result.recipients?.join(', ')}`;
        } else {
          this.success = `Report successfully generated with ${result.count} records`;
        }
      },
      error: (err) => {
        this.isGenerating = false;
        this.error = 'Failed to generate report';
        this.errorService.logError(err);
      }
    });
  }

  downloadReport(): void {
    if (!this.downloadUrl) return;

    const link = document.createElement('a');
    link.href = this.downloadUrl;
    link.download = this.generatedFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }

      if (control instanceof FormArray) {
        for (let i = 0; i < control.length; i++) {
          control.at(i).markAsTouched();
        }
      }
    });
  }

  updateEmailValidation(): void {
    const sendEmail = this.reportForm.get('sendEmail')?.value;
    const emailConfig = this.reportForm.get('emailConfig');

    if (sendEmail) {
      emailConfig?.enable();
    } else {
      emailConfig?.disable();
    }
  }

  getReportTypeLabel(): string {
    const reportType = this.reportForm.get('reportType')?.value;
    const reportTypeObj = this.reportTypes.find(type => type.value === reportType);
    return reportTypeObj ? reportTypeObj.label : '';
  }
}

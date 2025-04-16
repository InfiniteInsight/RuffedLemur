import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Endpoint } from '../../../shared/models/endpoint.model';
import { EndpointService } from '../../services/endpoint.service';
import { ErrorService } from '../../../core/services/error/error.service';

@Component({
  selector: 'app-endpoint-detail',
  templateUrl: './endpoint-detail.component.html',
  styleUrls: ['./endpoint-detail.component.scss']
})
export class EndpointDetailComponent implements OnInit {
  endpointId: number;
  endpoint: Endpoint | null = null;
  certificates: any[] = [];
  isLoading = true;
  isLoadingCertificates = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private endpointService: EndpointService,
    private errorService: ErrorService
  ) {
    this.endpointId = +this.route.snapshot.paramMap.get('id')!;
  }

  ngOnInit(): void {
    this.loadEndpoint();
  }

  loadEndpoint(): void {
    this.isLoading = true;
    this.endpointService.getEndpoint(this.endpointId).subscribe({
      next: (data) => {
        this.endpoint = data;
        this.isLoading = false;
        this.loadCertificates();
      },
      error: (err) => {
        this.error = 'Failed to load endpoint details';
        this.errorService.logError(err);
        this.isLoading = false;
      }
    });
  }

  loadCertificates(): void {
    this.isLoadingCertificates = true;
    this.endpointService.getCertificatesByEndpoint(this.endpointId).subscribe({
      next: (data) => {
        this.certificates = data;
        this.isLoadingCertificates = false;
      },
      error: (err) => {
        this.errorService.logError(err);
        this.isLoadingCertificates = false;
      }
    });
  }

  toggleActive(): void {
    if (!this.endpoint) return;

    this.endpointService.updateEndpoint(this.endpointId, { active: !this.endpoint.active }).subscribe({
      next: (data) => {
        this.endpoint = data;
        // Show success notification
      },
      error: (err) => {
        this.errorService.logError(err);
        // Show error notification
      }
    });
  }

  deleteEndpoint(): void {
    if (!this.endpoint || this.endpoint.active) return;

    if (confirm('Are you sure you want to delete this endpoint? This action cannot be undone.')) {
      this.endpointService.deleteEndpoint(this.endpointId).subscribe({
        next: () => {
          this.router.navigate(['/endpoints']);
          // Show success notification
        },
        error: (err) => {
          this.errorService.logError(err);
          // Show error notification
        }
      });
    }
  }

  goToEdit(): void {
    this.router.navigate(['/endpoints', this.endpointId, 'edit']);
  }

  goBack(): void {
    this.router.navigate(['/endpoints']);
  }
}

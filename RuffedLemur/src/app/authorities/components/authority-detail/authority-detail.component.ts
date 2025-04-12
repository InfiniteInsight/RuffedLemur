// src/app/authorities/components/authority-detail/authority-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Authority } from '../../../shared/models/authority.model';
import { AuthorityService } from '../../services/authority.service';
import { ErrorService } from '../../../core/services/error/error.service';

@Component({
  selector: 'app-authority-detail',
  templateUrl: './authority-detail.component.html',
  styleUrls: ['./authority-detail.component.scss']
})
export class AuthorityDetailComponent implements OnInit {
  authorityId: number;
  authority: Authority | null = null;
  isLoading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authorityService: AuthorityService,
    private errorService: ErrorService
  ) {
    this.authorityId = +this.route.snapshot.paramMap.get('id')!;
  }

  ngOnInit(): void {
    this.loadAuthority();
  }

  loadAuthority(): void {
    this.isLoading = true;
    this.authorityService.getAuthority(this.authorityId).subscribe({
      next: (data) => {
        this.authority = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load authority details';
        this.errorService.logError(err);
        this.isLoading = false;
      }
    });
  }

  exportAuthority(format: 'pem' | 'der'): void {
    this.authorityService.exportAuthorityChain(this.authorityId, format).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `authority-${this.authorityId}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      },
      error: (err) => {
        this.errorService.logError(err);
        // Show error notification
      }
    });
  }

  toggleActive(): void {
    if (!this.authority) return;

    const updated = {
      ...this.authority,
      active: !this.authority.active
    };

    this.authorityService.updateAuthority(this.authorityId, { active: !this.authority.active }).subscribe({
      next: (data) => {
        this.authority = data;
        // Show success message
      },
      error: (err) => {
        this.errorService.logError(err);
        // Show error message
      }
    });
  }

  deleteAuthority(): void {
    if (confirm('Are you sure you want to delete this authority? This action cannot be undone.')) {
      this.authorityService.deleteAuthority(this.authorityId).subscribe({
        next: () => {
          this.router.navigate(['/authorities']);
          // Show success message
        },
        error: (err) => {
          this.errorService.logError(err);
          // Show error message
        }
      });
    }
  }

  goToEdit(): void {
    this.router.navigate(['/authorities', this.authorityId, 'edit']);
  }

  goBack(): void {
    this.router.navigate(['/authorities']);
  }
}

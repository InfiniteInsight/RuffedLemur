// frontend/RuffedLemur/src/app/authorities/components/authority-detail/authority-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Authority } from '../../../shared/models/authority.model';
import { AuthorityService } from '../../services/authority.service';
import { ErrorService } from '../../../core/services/error/error.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    private errorService: ErrorService,
    private snackBar: MatSnackBar
  ) {
    this.authorityId = +this.route.snapshot.paramMap.get('id')!;
  }

  ngOnInit(): void {
    this.loadAuthority();
  }

  loadAuthority(): void {
    this.isLoading = true;
    this.error = '';

    this.authorityService.getAuthority(this.authorityId).subscribe({
      next: (data) => {
        this.authority = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load authority details';
        this.isLoading = false;
        // The error service handling is done within the authority service
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

        this.snackBar.open(`Authority exported successfully in ${format.toUpperCase()} format`, 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
      },
      error: (err) => {
        this.snackBar.open(`Failed to export authority: ${err.message}`, 'Close', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
        // The error service handling is done within the authority service
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
        this.snackBar.open(
          `Authority ${data.active ? 'activated' : 'deactivated'} successfully`,
          'Close',
          { duration: 3000, panelClass: 'success-snackbar' }
        );
      },
      error: (err) => {
        this.snackBar.open(`Failed to update authority: ${err.message}`, 'Close', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
        // The error service handling is done within the authority service
      }
    });
  }

  deleteAuthority(): void {
    if (confirm('Are you sure you want to delete this authority? This action cannot be undone.')) {
      this.authorityService.deleteAuthority(this.authorityId).subscribe({
        next: () => {
          this.snackBar.open('Authority deleted successfully', 'Close', {
            duration: 3000,
            panelClass: 'success-snackbar'
          });
          this.router.navigate(['/authorities']);
        },
        error: (err) => {
          this.snackBar.open(`Failed to delete authority: ${err.message}`, 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
          // The error service handling is done within the authority service
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

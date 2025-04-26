import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { SidebarService } from '../../../services/sidebar/sidebar.service';
import { ErrorService } from '../../../services/error/error.service';
import { Subject, subscribeOn, takeUntil } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  imports: [ CommonModule, RouterModule, MatListModule, MatIconModule, MatDividerModule ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  standalone: true
})
export class SidebarComponent implements OnInit {
  isOpen = false;
  private destroy$ = new Subject<void>();

  constructor(
    private sidebarService: SidebarService,
    private errorService: ErrorService
  ) {}

  ngOnInit(): void {
    // Subscribe to sidebar state changes
    this.sidebarService.sidebarVisible$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (isOpen) => {
          this.isOpen = isOpen;
        },
        error: (error) => {
          this.errorService.handleError(error, 'Sidebar Subscription');
        }
      });
  }

  ngOnDestroy(): void {
    // Clean up subscriptions when component is destroyed
    this.destroy$.next();
    this.destroy$.complete();
  }
}


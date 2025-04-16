// src/app/app.component.ts

import { Component, OnInit } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { LoadingService } from './core/services/loading/loading.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'RuffledLemur';

  constructor(
    private router: Router,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.setupRouterEvents();
  }

  private setupRouterEvents(): void {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        // Show loading spinner when navigation starts
        this.loadingService.setLoading(true, 'navigation');
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        // Hide loading spinner when navigation completes
        this.loadingService.setLoading(false, 'navigation');
      }
    });
  }
}

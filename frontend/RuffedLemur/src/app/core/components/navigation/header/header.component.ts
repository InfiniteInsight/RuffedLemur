import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../../services/auth/auth.service';
import { SidebarService } from '../../../services/sidebar/sidebar.service';
import { ErrorService } from '../../../services/error/error.service';

@Component({
  selector: 'app-header',
  imports: [ MatToolbarModule, MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  standalone: true
})
export class HeaderComponent {
  constructor(
    private router: Router,
    private authService: AuthService,
    private layoutService: SidebarService,
    private errorService: ErrorService
  ) {}

  toggleSidebar() {
    this.layoutService.toggleSidebar();

  }

  logout() {
    this.authService.logout().subscribe({
    next: () => {
      this.router.navigate(['/auth/login']);
    },
    error: (error) => {
      this.errorService.handleError(error, 'Logout');
      // Navigate to the login page even if the logout API call fails
      this.router.navigate(['/auth/login'])
    }
  });
 }
}

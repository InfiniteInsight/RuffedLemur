import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  constructor(private router: Router) {}

  toggleSidebar() {
    //TO DO: to be implemented with a shared service later
    console.log('Toggle Sidebar placeholder');
  }

  logout() {
    //TO DO: to be implemented with auth service later
    this.router.navigate(['/auth/login']);
  }
}

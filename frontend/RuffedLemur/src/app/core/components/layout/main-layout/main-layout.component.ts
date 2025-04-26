import { Component } from '@angular/core';
import { HeaderComponent } from '../../navigation/header/header.component';
import { FooterComponent } from '../../navigation/footer/footer.component';
import { SidebarComponent } from '../../navigation/sidebar/sidebar.component';
import { RouterOutlet } from '@angular/router';
import { ErrorService } from '../../../services/error/error.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, SidebarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  standalone: true
})
export class MainLayoutComponent {
  constructor(private errorService: ErrorService) {}
}


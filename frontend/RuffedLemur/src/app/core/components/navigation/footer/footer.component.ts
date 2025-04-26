import { Component, OnInit } from '@angular/core';
import { ErrorService } from '../../../services/error/error.service';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  standalone: true
})
export class FooterComponent implements OnInit {
  currentYear: number = new Date().getFullYear();

  constructor(private errorService: ErrorService) { }

  ngOnInit(): void {

  }

}

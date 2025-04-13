// src/app/core/components/loading/loading.component.ts

import { Component, OnInit } from '@angular/core';
import { LoadingService } from '../../services/loading/loading.service';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss']
})
export class LoadingComponent implements OnInit {
  loading$ = this.loadingService.isLoading$;

  constructor(private loadingService: LoadingService) {}

  ngOnInit(): void {}
}

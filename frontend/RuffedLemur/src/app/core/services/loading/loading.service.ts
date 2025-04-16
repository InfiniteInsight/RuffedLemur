// src/app/core/services/loading/loading.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  // Tracks active requests by URL
  private loadingMap = new Map<string, boolean>();

  // BehaviorSubject to track overall loading state
  private isLoadingSubject = new BehaviorSubject<boolean>(false);

  // Observable that components can subscribe to
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();

  // Get current loading state
  public get isLoading(): boolean {
    return this.isLoadingSubject.value;
  }

  /**
   * Set loading state for a specific URL
   * @param loading Whether the URL is loading
   * @param url The URL being loaded
   */
  setLoading(loading: boolean, url: string): void {
    if (loading) {
      this.loadingMap.set(url, loading);
      this.isLoadingSubject.next(true);
    } else if (!loading && this.loadingMap.has(url)) {
      this.loadingMap.delete(url);
      this.isLoadingSubject.next(this.loadingMap.size > 0);
    }
  }

  /**
   * Check if a specific URL is loading
   * @param url The URL to check
   */
  isLoadingUrl(url: string): boolean {
    return this.loadingMap.has(url);
  }

  /**
   * Get an observable that emits true when a specific URL is loading
   * @param url The URL to observe
   */
  isLoadingUrl$(url: string): Observable<boolean> {
    return this.isLoading$.pipe(
      map(() => this.isLoadingUrl(url))
    );
  }

  /**
   * Reset the loading state (useful for navigation changes)
   */
  resetLoading(): void {
    this.loadingMap.clear();
    this.isLoadingSubject.next(false);
  }
}

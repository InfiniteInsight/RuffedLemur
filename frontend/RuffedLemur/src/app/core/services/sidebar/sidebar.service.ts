import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private sidebarVisibleSubject = new BehaviorSubject<boolean>(true);
  public sidebarVisible$ = this.sidebarVisibleSubject.asObservable();

  constructor() {}

  toggleSidebar(): void {
    this.sidebarVisibleSubject.next(!this.sidebarVisibleSubject.value);
  }

  getSidebarState(): boolean {
    return this.sidebarVisibleSubject.value;
  }

  setSidebarState(isVisible: boolean): void {
    this.sidebarVisibleSubject.next(isVisible);
  }

  open() {
    this.sidebarVisibleSubject.next(true);
  }

  close() {
    this.sidebarVisibleSubject.next(false);
  }
}

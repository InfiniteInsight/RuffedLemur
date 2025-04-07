import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpiringCertsWidgetComponent } from './expiring-certs-widget.component';

describe('ExpiringCertsWidgetComponent', () => {
  let component: ExpiringCertsWidgetComponent;
  let fixture: ComponentFixture<ExpiringCertsWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpiringCertsWidgetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpiringCertsWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

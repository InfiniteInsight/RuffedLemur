import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificatesourcesDetailComponent } from './certificatesources-detail.component';

describe('CertificatesourcesDetailComponent', () => {
  let component: CertificatesourcesDetailComponent;
  let fixture: ComponentFixture<CertificatesourcesDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificatesourcesDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertificatesourcesDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

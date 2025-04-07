import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificatesourcesListComponent } from './certificatesources-list.component';

describe('CertificatesourcesListComponent', () => {
  let component: CertificatesourcesListComponent;
  let fixture: ComponentFixture<CertificatesourcesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificatesourcesListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertificatesourcesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

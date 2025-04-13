import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificatesourcesFormComponent } from './certificatesources-form.component';

describe('CertificatesourcesFormComponent', () => {
  let component: CertificatesourcesFormComponent;
  let fixture: ComponentFixture<CertificatesourcesFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificatesourcesFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertificatesourcesFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

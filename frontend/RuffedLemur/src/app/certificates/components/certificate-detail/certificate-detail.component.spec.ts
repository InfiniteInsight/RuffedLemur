// src/app/certificates/components/certificate-detail/certificate-detail.component.spec.ts

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, convertToParamMap } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { of } from 'rxjs';

import { CertificateDetailComponent } from './certificate-detail.component';
import { CertificateService } from '../../services/certificate.service';
import { ErrorService } from '../../../core/services/error/error.service';
import { Certificate } from '../../../shared/models/certificate.model';
import * as typeGuards from '../../../shared/utils/type-guard';

describe('CertificateDetailComponent', () => {
  let component: CertificateDetailComponent;
  let fixture: ComponentFixture<CertificateDetailComponent>;
  let certificateServiceSpy: jasmine.SpyObj<CertificateService>;
  let errorServiceSpy: jasmine.SpyObj<ErrorService>;
  let idToNumberSpy: jasmine.Spy;

  const mockCertificate: Certificate = {
    id: 123,
    name: 'Test Certificate',
    commonName: 'test.example.com',
    owner: 'Test Owner',
    body: 'certificate body',
    active: true,
    is_ca: false,
    revoked: false,
    rotation: false,
    has_private_key: true,
    domains: ['test.example.com'],
    authorityId: '1',
    notBefore: '2023-01-01T00:00:00Z',
    notAfter: '2024-01-01T00:00:00Z',
    serial: "05:0B:44:5E:08:89:E9:3A:87:E7:A3:F8:EF:D6:AF:34:68:07"
  };

  beforeEach(async () => {
    certificateServiceSpy = jasmine.createSpyObj('CertificateService', ['getCertificate', 'revokeCertificate', 'exportCertificate']);
    errorServiceSpy = jasmine.createSpyObj('ErrorService', ['handleError', 'showSuccess']);

    // Spy on the idToNumber function
    idToNumberSpy = spyOn(typeGuards, 'idToNumber').and.callThrough();

    await TestBed.configureTestingModule({
      declarations: [CertificateDetailComponent],
      providers: [
        provideRouter([]), // Use provideRouter instead of RouterTestingModule
        { provide: CertificateService, useValue: certificateServiceSpy },
        { provide: ErrorService, useValue: errorServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: '123' })
            }
          }
        }
      ],
      imports: [MatDialogModule]
    }).compileComponents();

    certificateServiceSpy.getCertificate.and.returnValue(of(mockCertificate));

    fixture = TestBed.createComponent(CertificateDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should convert ID parameter using idToNumber', () => {
    expect(idToNumberSpy).toHaveBeenCalledWith('123');
    expect(component.certificateId).toBe(123);
  });

  it('should load certificate data on init', () => {
    expect(certificateServiceSpy.getCertificate).toHaveBeenCalledWith(123);
    expect(component.certificate).toEqual(mockCertificate);
  });

  it('should determine certificate status correctly', () => {
    // Set up different scenarios
    const activeCert = { ...mockCertificate };
    const expiredCert = {
      ...mockCertificate,
      notAfter: '2000-01-01T00:00:00Z' // Past date
    };
    const revokedCert = {
      ...mockCertificate,
      active: false
    };

    // Test active certificate
    component.certificate = activeCert;
    expect(component.getCertificateStatus()).toBe('Active');

    // Test expired certificate
    component.certificate = expiredCert;
    expect(component.getCertificateStatus()).toBe('Expired');

    // Test revoked certificate
    component.certificate = revokedCert;
    expect(component.getCertificateStatus()).toBe('Revoked');
  });

  it('should handle null certificate', () => {
    component.certificate = null;
    expect(component.getCertificateStatus()).toBe('');
  });
});

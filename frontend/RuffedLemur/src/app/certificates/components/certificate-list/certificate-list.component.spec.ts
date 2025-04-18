// src/app/certificates/components/certificate-list/certificate-list.component.spec.ts

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { of } from 'rxjs';

import { CertificateListComponent } from './certificate-list.component';
import { CertificateService } from '../../services/certificate.service';
import { ErrorService } from '../../../core/services/error/error.service';
import { Certificate } from '../../../shared/models/certificate.model';
import * as typeGuards from '../../../shared/utils/type-guard';

describe('CertificateListComponent', () => {
  let component: CertificateListComponent;
  let fixture: ComponentFixture<CertificateListComponent>;
  let certificateServiceSpy: jasmine.SpyObj<CertificateService>;
  let errorServiceSpy: jasmine.SpyObj<ErrorService>;
  let idToNumberSpy: jasmine.Spy;

  const mockCertificates = [
    {
      id: '123',
      name: 'Test Certificate 1',
      commonName: 'test1.example.com',
      owner: 'Test Owner',
      body: 'certificate body',
      active: true,
      is_ca: false,
      revoked: false,
      rotation: false,
      has_private_key: true,
      domains: ['test1.example.com'],
      authorityId: '1',
      notBefore: '2023-01-01T00:00:00Z',
      notAfter: '2024-01-01T00:00:00Z'
    },
    {
      id: '456',
      name: 'Test Certificate 2',
      commonName: 'test2.example.com',
      owner: 'Test Owner',
      body: 'certificate body',
      active: false,
      is_ca: false,
      revoked: true,
      rotation: false,
      has_private_key: true,
      domains: ['test2.example.com'],
      authorityId: '1',
      notBefore: '2023-01-01T00:00:00Z',
      notAfter: '2024-01-01T00:00:00Z'
    }
  ] as Certificate[];

  beforeEach(async () => {
    certificateServiceSpy = jasmine.createSpyObj('CertificateService', [
      'getCertificates',
      'revokeCertificate',
      'exportCertificate'
    ]);
    errorServiceSpy = jasmine.createSpyObj('ErrorService', ['handleError', 'showSuccess']);

    // Spy on the idToNumber function
    idToNumberSpy = spyOn(typeGuards, 'idToNumber').and.callThrough();

    await TestBed.configureTestingModule({
      declarations: [CertificateListComponent],
      imports: [
        RouterTestingModule,
        MatDialogModule
      ],
      providers: [
        { provide: CertificateService, useValue: certificateServiceSpy },
        { provide: ErrorService, useValue: errorServiceSpy }
      ]
    }).compileComponents();

    certificateServiceSpy.getCertificates.and.returnValue(of({
      items: mockCertificates,
      total: mockCertificates.length,
      page: 0,
      size: 10
    }));

    fixture = TestBed.createComponent(CertificateListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load certificates on init', () => {
    expect(certificateServiceSpy.getCertificates).toHaveBeenCalled();
    expect(component.certificates.length).toBe(2);
    expect(component.totalItems).toBe(2);
  });

  it('should determine certificate status correctly', () => {
    expect(component.getCertificateStatus(mockCertificates[0])).toBe('Active');
    expect(component.getCertificateStatus(mockCertificates[1])).toBe('Revoked');
  });

  it('should use idToNumber when revoking a certificate', () => {
    // Set up the dialog open method to return an object that when afterClosed() is called, returns an observable of true
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true) });
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpyObj);

    certificateServiceSpy.revokeCertificate.and.returnValue(of(mockCertificates[0]));

    // Call the openRevokeDialog method
    component.openRevokeDialog(mockCertificates[0]);

    // Verify that idToNumber was called with the correct ID
    expect(idToNumberSpy).toHaveBeenCalledWith('123');

    // Verify that revokeCertificate was called with the converted ID
    expect(certificateServiceSpy.revokeCertificate).toHaveBeenCalledWith(123, 'Manual revocation');
  });
});

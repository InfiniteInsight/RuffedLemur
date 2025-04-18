// src/app/core/services/api/api.service.spec.ts

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService, StandardApiResponse, SimpleApiResponse } from './api.service';
import { ErrorService } from '../error/error.service';
import { environment } from '../../../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  let errorServiceSpy: jasmine.SpyObj<ErrorService>;

  beforeEach(() => {
    const errorSpy = jasmine.createSpyObj('ErrorService', ['logError', 'handleError']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        { provide: ErrorService, useValue: errorSpy }
      ]
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
    errorServiceSpy = TestBed.inject(ErrorService) as jasmine.SpyObj<ErrorService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('processResponse', () => {
    // This uses the protected method, so we need to access it via any
    // This is one of the rare cases where using any in tests is acceptable
    const processResponse = (service as any).processResponse.bind(service);

    it('should extract data from standard API response', () => {
      const response: StandardApiResponse<string> = {
        status: 'success',
        data: 'test data',
        message: 'Success message'
      };

      expect(processResponse(response)).toBe('test data');
    });

    it('should throw error for error response', () => {
      const response: StandardApiResponse<string> = {
        status: 'error',
        data: 'error data',
        error: 'Error message'
      };

      expect(() => processResponse(response)).toThrowError('Error message');
    });

    it('should extract data from simple API response', () => {
      const response: SimpleApiResponse<string> = {
        data: 'test data'
      };

      expect(processResponse(response)).toBe('test data');
    });

    it('should return direct response if not wrapped', () => {
      const response = 'direct response';
      expect(processResponse(response)).toBe('direct response');
    });

    it('should handle null response', () => {
      expect(processResponse(null)).toBeNull();
    });

    it('should handle undefined response', () => {
      expect(processResponse(undefined)).toBeUndefined();
    });
  });

  describe('isStandardApiResponse', () => {
    const isStandardApiResponse = (service as any).isStandardApiResponse.bind(service);

    it('should return true for standard API response', () => {
      const response = {
        status: 'success',
        data: 'test data'
      };
      expect(isStandardApiResponse(response)).toBeTrue();
    });

    it('should return false for non-standard response', () => {
      expect(isStandardApiResponse({ data: 'test' })).toBeFalse();
      expect(isStandardApiResponse({ status: 'success' })).toBeFalse();
      expect(isStandardApiResponse('string')).toBeFalse();
      expect(isStandardApiResponse(null)).toBeFalse();
      expect(isStandardApiResponse(undefined)).toBeFalse();
    });
  });

  describe('isSimpleApiResponse', () => {
    const isSimpleApiResponse = (service as any).isSimpleApiResponse.bind(service);

    it('should return true for simple API response', () => {
      const response = {
        data: 'test data'
      };
      expect(isSimpleApiResponse(response)).toBeTrue();
    });

    it('should return false for non-simple response', () => {
      expect(isSimpleApiResponse({ status: 'success', data: 'test' })).toBeFalse();
      expect(isSimpleApiResponse({ status: 'success' })).toBeFalse();
      expect(isSimpleApiResponse('string')).toBeFalse();
      expect(isSimpleApiResponse(null)).toBeFalse();
      expect(isSimpleApiResponse(undefined)).toBeFalse();
    });
  });

  describe('HTTP Methods', () => {
    interface TestData {
      id: number;
      name: string;
    }

    const testData: TestData = {
      id: 1,
      name: 'Test Data'
    };

    it('should make a GET request and process standard response', () => {
      const endpoint = 'test-endpoint';
      const standardResponse: StandardApiResponse<TestData> = {
        status: 'success',
        data: testData
      };

      service.get<TestData>(endpoint).subscribe(data => {
        expect(data).toEqual(testData);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/${endpoint}`);
      expect(req.request.method).toBe('GET');
      req.flush(standardResponse);
    });

    it('should make a GET request and process simple response', () => {
      const endpoint = 'test-endpoint';
      const simpleResponse: SimpleApiResponse<TestData> = {
        data: testData
      };

      service.get<TestData>(endpoint).subscribe(data => {
        expect(data).toEqual(testData);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/${endpoint}`);
      expect(req.request.method).toBe('GET');
      req.flush(simpleResponse);
    });

    it('should make a GET request and process direct response', () => {
      const endpoint = 'test-endpoint';

      service.get<TestData>(endpoint).subscribe(data => {
        expect(data).toEqual(testData);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/${endpoint}`);
      expect(req.request.method).toBe('GET');
      req.flush(testData);
    });

    it('should make a POST request and process response', () => {
      const endpoint = 'test-endpoint';
      const standardResponse: StandardApiResponse<TestData> = {
        status: 'success',
        data: testData
      };
      const body = { name: 'New Test' };

      service.post<TestData>(endpoint, body).subscribe(data => {
        expect(data).toEqual(testData);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/${endpoint}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush(standardResponse);
    });

    it('should make a PUT request and process response', () => {
      const endpoint = 'test-endpoint/1';
      const standardResponse: StandardApiResponse<TestData> = {
        status: 'success',
        data: testData
      };
      const body = { name: 'Updated Test' };

      service.put<TestData>(endpoint, body).subscribe(data => {
        expect(data).toEqual(testData);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/${endpoint}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(body);
      req.flush(standardResponse);
    });

    it('should make a DELETE request and process response', () => {
      const endpoint = 'test-endpoint/1';
      const standardResponse: StandardApiResponse<boolean> = {
        status: 'success',
        data: true
      };

      service.delete<boolean>(endpoint).subscribe(data => {
        expect(data).toBeTrue();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/${endpoint}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(standardResponse);
    });

    it('should handle errors in HTTP requests', () => {
      const endpoint = 'test-endpoint';
      const errorResponse = {
        status: 404,
        statusText: 'Not Found'
      };

      service.get<TestData>(endpoint).subscribe({
        next: () => fail('Expected an error, not success'),
        error: error => {
          expect(error).toBeTruthy();
          expect(error.message).toContain('Not Found');
          expect(errorServiceSpy.logError).toHaveBeenCalled();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/${endpoint}`);
      req.flush('Not found', errorResponse);
    });

    it('should handle API error responses', () => {
      const endpoint = 'test-endpoint';
      const errorResponse: StandardApiResponse<any> = {
        status: 'error',
        data: null,
        error: 'Validation failed',
        code: 422
      };

      service.get<TestData>(endpoint).subscribe({
        next: () => fail('Expected an error, not success'),
        error: error => {
          expect(error).toBeTruthy();
          expect(error.message).toBe('Validation failed');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/${endpoint}`);
      req.flush(errorResponse);
    });
  });

  describe('buildHttpParams', () => {
    const buildHttpParams = (service as any).buildHttpParams.bind(service);

    it('should create HttpParams from object', () => {
      const params = buildHttpParams({ page: 1, size: 10, filter: 'test' });
      expect(params.get('page')).toBe('1');
      expect(params.get('size')).toBe('10');
      expect(params.get('filter')).toBe('test');
    });

    it('should handle null/undefined values', () => {
      const params = buildHttpParams({
        defined: 'value',
        nullValue: null,
        undefinedValue: undefined
      });
      expect(params.get('defined')).toBe('value');
      expect(params.has('nullValue')).toBeFalse();
      expect(params.has('undefinedValue')).toBeFalse();
    });

    it('should handle empty params', () => {
      expect(buildHttpParams()).toBeTruthy();
      expect(buildHttpParams(null)).toBeTruthy();
      expect(buildHttpParams({})).toBeTruthy();
    });
  });

  describe('buildHttpOptions', () => {
    const buildHttpOptions = (service as any).buildHttpOptions.bind(service);

    it('should create default options', () => {
      const options = buildHttpOptions();
      expect(options.headers.get('Content-Type')).toBe('application/json');
    });

    it('should merge custom headers', () => {
      const options = buildHttpOptions({
        headers: {
          'Authorization': 'Bearer token',
          'X-Custom-Header': 'Custom Value'
        }
      });
      expect(options.headers.get('Content-Type')).toBe('application/json');
      expect(options.headers.get('Authorization')).toBe('Bearer token');
      expect(options.headers.get('X-Custom-Header')).toBe('Custom Value');
    });

    it('should add background request header', () => {
      const options = buildHttpOptions({ background: true });
      expect(options.headers.get('X-Background-Request')).toBe('true');
    });

    it('should include responseType', () => {
      const options = buildHttpOptions({ responseType: 'blob' });
      expect(options.responseType).toBe('blob');
    });

    it('should include withCredentials', () => {
      const options = buildHttpOptions({ withCredentials: true });
      expect(options.withCredentials).toBeTrue();
    });
  });
});

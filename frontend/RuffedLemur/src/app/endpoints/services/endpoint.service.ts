// src/app/endpoints/services/endpoint.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Endpoint } from '../../shared/models/endpoint.model';
import { Certificate } from '../../shared/models/certificate.model';
import { isStringId, isNumberId, idToString, idToNumber } from '../../shared/utils/type-guard';
import { AuthService } from '../../core/services/auth/auth.service';


interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

interface EndpointListParams {
  page?: number;
  size?: number;
  filter?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class EndpointService {
  private apiUrl = `${environment.apiUrl}/endpoints`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  getEndpoints(params: EndpointListParams = {}): Observable<PaginatedResponse<Endpoint>> {
    let httpParams = new HttpParams();

    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }

    if (params.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }

    if (params.filter) {
      httpParams = httpParams.set('filter', params.filter);
    }

    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
      if (params.order) {
        httpParams = httpParams.set('order', params.order);
      }
    }

    return this.http.get<PaginatedResponse<Endpoint>>(this.apiUrl, { params: httpParams });
  }

  getEndpoint(id: string | number): Observable<Endpoint> {
    return this.http.get<Endpoint>(`${this.apiUrl}/${idToString(id)}`);
  }

  createEndpoint(endpoint: Partial<Endpoint>): Observable<Endpoint> {
    return this.authService.getCsrfToken().pipe(
      switchMap(csrfResponse => {
        return this.http.post<Endpoint>(
          this.apiUrl,
          endpoint,
          {
            headers: {
              'X-CSRF-TOKEN': csrfResponse.token
            },
            withCredentials: true
          }
        );
      })
    );
  }

  updateEndpoint(id: string | number, endpoint: Partial<Endpoint>): Observable<Endpoint> {
    return this.authService.getCsrfToken().pipe(
      switchMap(csrfResponse => {
        return this.http.put<Endpoint>(
          `${this.apiUrl}/${idToString(id)}`,
          endpoint,
          {
            headers: {
              'X-CSRF-TOKEN': csrfResponse.token
            },
            withCredentials: true
          }
        );
      })
    );
  }

  deleteEndpoint(id: string | number): Observable<void> {
    return this.authService.getCsrfToken().pipe(
      switchMap(csrfResponse => {
        return this.http.delete<void>(
          `${this.apiUrl}/${idToString(id)}`,
          {
            headers: {
              'X-CSRF-TOKEN': csrfResponse.token
            },
            withCredentials: true
          }
        );
      })
    );
  }

  getEndpointTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/types`);
  }

  getCertificatesByEndpoint(id: string | number): Observable<Certificate[]> {
    return this.http.get<Certificate[]>(`${this.apiUrl}/${idToString(id)}/certificates`);
  }
}



import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { CertificateStats, CertificateByAuthority, ExpiringCertificate, CertificateByOwner, CertificateByDomain, CertificateByTeam, CertificateBySource, CertificateByTime } from "../../shared/models/dashboard.model";
import { ExpiringCertsWidgetComponent } from "../components/expiring-certs-widget/expiring-certs-widget.component";

@Injectable({
  providedIn: 'root'
})

export class DashboardService {

  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) { }

  getCertificateStats(): Observable<CertificateStats> {
    return this.http.get<CertificateStats>(`${this.apiUrl}/stats`);
  }

  getCertificateByAuthority(): Observable<CertificateByAuthority[]> {
    return this.http.get<CertificateByAuthority[]>(`${this.apiUrl}/expiring-by-authority`);
  }


  getExpiringCertificateByOwner(owner: string): Observable<CertificateByOwner[]> {
    return this.http.get<CertificateByOwner[]>(`${this.apiUrl}/expiring-by-owner`, {
      params: { owner }
    })
  }

  getExpiringCertificateByDomain(domain: string): Observable<CertificateByDomain[]> {
    return this.http.get<CertificateByDomain[]>(`${this.apiUrl}/expiring-by-domain`, {
      params: { domain }
    })
  }

  getExpiringertificateByTeam(team: string): Observable<CertificateByTeam[]> {
    return this.http.get<CertificateByTeam[]>(`${this.apiUrl}/expiring-by-team`, {
      params: { team }
    })
  }

 getExpiringCertificateBySource(source: string): Observable<CertificateBySource[]> {
  return this.http.get<CertificateBySource[]>(`${this.apiUrl}/expiring-by-source`, {
    params: { source }
  })
 }

 getCertificateByTime(timeSpanStart: Date, timeSpanEnd: Date): Observable<CertificateByTime[]> {
  return this.http.get<CertificateByTime[]>(`${this.apiUrl}/certificate-by-timespan`, {
    params: {timespanStart: timeSpanStart.toString(), timespanEnd: timeSpanEnd.toString()}
  })
 }

  getExpiringCertificates(days: number = 30): Observable<ExpiringCertificate[]> {
    return this.http.get<ExpiringCertificate[]>(`${this.apiUrl}/expiring`, {
      params: { days: days.toString() }
    });
  }

    //TO DO: getExpiringCertificateOnHoliday(), getExpiringCertificateOnWeekend(), getCertificatesWithLifeTimeGreaterThan()
}

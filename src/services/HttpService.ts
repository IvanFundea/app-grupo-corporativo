import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  private baseUrl: string = environment.apiPath;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene el token desde localStorage. 
   * Asegúrate de que tu AuthService lo guarde ahí correctamente después del login.
   */
  // private getToken(): string {
  //   return localStorage.getItem('token') || '';
  // }

  // private setHeaders(extraHeaders: { [key: string]: string } = {}): HttpHeaders {
  //   let headers = new HttpHeaders({
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${this.getToken()}`,
  //     ...extraHeaders
  //   });

  //   return headers;
  // }

  public get<T>(url: string, params?: { [key: string]: any }): Observable<HttpResponse<T>> {
    const options = {
      // headers: this.setHeaders(),
      params: params ? new HttpParams({ fromObject: params }) : undefined,
      observe: 'response' as const
    };

    return this.http.get<T>(this.baseUrl + url, options);
  }

  public post<T>(url: string, data: any): Observable<HttpResponse<T>> {
    return this.http.post<T>(this.baseUrl + url, data, {
      // headers: this.setHeaders(),
      observe: 'response'
    });
  }

  public put<T>(url: string, data: any): Observable<HttpResponse<T>> {
    return this.http.put<T>(this.baseUrl + url, data, {
      // headers: this.setHeaders(),
      observe: 'response'
    });
  }

  public delete<T>(url: string, data?: any): Observable<HttpResponse<T>> {
    
    return this.http.request<T>('delete', this.baseUrl + url, {
      // headers: this.setHeaders(),
      observe: 'response' as const,
      body: data
    });
  }

  public patch<T>(url: string, data: any): Observable<HttpResponse<T>> {
    return this.http.patch<T>(this.baseUrl + url, data, {
      // headers: this.setHeaders(),
      observe: 'response'
    });
  }
}

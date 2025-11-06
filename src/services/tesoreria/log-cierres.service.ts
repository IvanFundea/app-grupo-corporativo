import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpService } from '../HttpService';
import { firstValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ApiResponse } from '../../interfaces/api-response';
import { LogCierres } from '../../interfaces/tesoreria';

export type LogCierresResponse = ApiResponse<LogCierres>;
export type LogCierresListResponse = ApiResponse<LogCierres[]>;

@Injectable({ providedIn: 'root' })
export class LogCierresService extends HttpService {
  private readonly endpoints = { base: '/tesoreria/log-cierres' };

  constructor(http: HttpClient, private toastr: ToastrService) {
    super(http);
  }

  async findAll({ page = 1, limit = 10 } = {}): Promise<LogCierresListResponse | null> {
    try {
      const resp = await firstValueFrom(this.get<LogCierresListResponse>(`${this.endpoints.base}`, { page, limit }));
      if (resp.body?.success) return resp.body;
      return null;
    } catch (error: any) {
      console.log('LogCierresService.findAll error:', error);
      this.toastr.error(error?.error?.message || 'Error al obtener cierres', 'Error');
      return null;
    }
  }

  async create(usuario: string): Promise<LogCierresResponse | null> {
    try {
      const resp = await firstValueFrom(this.post<LogCierresResponse>(`${this.endpoints.base}`, { usuario }));
      if (resp.body?.success) {
        this.toastr.success(resp.body.message || 'Cierre registrado', 'Éxito');
        return resp.body;
      }
      return null;
    } catch (error: any) {
      console.log('LogCierresService.create error:', error);
      this.toastr.error(error?.error?.message || 'Error al registrar cierre', 'Error');
      return null;
    }
  }
}

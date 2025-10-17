import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpService } from '../HttpService';
import { firstValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ITipoTransaccion, TipoTransaccionTipo } from '../../interfaces/tesoreria';
import { ApiResponse } from '../../interfaces/api-response';

type TipoTransaccionResponse = ApiResponse<ITipoTransaccion>;
type TipoTransaccionListResponse = ApiResponse<ITipoTransaccion[]>;

@Injectable({ providedIn: 'root' })
export class TipoTransaccionService extends HttpService {
  private readonly endpoints = { tipoTransaccion: '/tesoreria/tipo-transaccion' };

  constructor(http: HttpClient, private toastr: ToastrService) {
    super(http);
  }

  async getTipoTransacciones({ page = 1, limit = 10, busqueda = '', all = false } = {}): Promise<TipoTransaccionListResponse | null> {
    try {
      let params: any = { page, limit, busqueda };
      if (all) params = { ...params, todos: all };
      const resp = await firstValueFrom(this.get<TipoTransaccionListResponse>(`${this.endpoints.tipoTransaccion}`, params));
      if (resp.body?.success) return resp.body;
      return null;
    } catch (error: any) {
      console.log('TipoTransaccionService.getTipoTransacciones error:', error);
      this.toastr.error(error?.error?.message || 'Error al obtener transacciones', 'Error');
      return null;
    }
  }

  async getTipoTransaccion(id: string): Promise<TipoTransaccionResponse | null> {
    try {
      const resp = await firstValueFrom(this.get<TipoTransaccionResponse>(`${this.endpoints.tipoTransaccion}/${id}`));
      if (resp.body?.success) return resp.body;
      return null;
    } catch (error: any) {
      console.log('TipoTransaccionService.getTipoTransaccion error:', error);
      this.toastr.error(error?.error?.message || 'Error al obtener transacción', 'Error');
      return null;
    }
  }

  async createTipoTransaccion(data: Omit<ITipoTransaccion, 'tipoTransaccionId'>): Promise<TipoTransaccionResponse | null> {
    try {
      const { nombre, tipo } = data;
      const resp = await firstValueFrom(this.post<TipoTransaccionResponse>(`${this.endpoints.tipoTransaccion}`, { nombre, tipo }));
      if (resp.body?.success) {
        this.toastr.success(resp.body.message, 'Éxito');
        return resp.body;
      }
      return null;
    } catch (error: any) {
      console.log('TipoTransaccionService.createTipoTransaccion error:', error);
      this.toastr.error(error?.error?.message || 'Error al crear transacción', 'Error');
      return null;
    }
  }

  async updateTipoTransaccion(data: ITipoTransaccion): Promise<TipoTransaccionResponse | null> {
    try {
      const { tipoTransaccionId, nombre, tipo } = data;
      const resp = await firstValueFrom(this.put<TipoTransaccionResponse>(`${this.endpoints.tipoTransaccion}/${tipoTransaccionId}`, { nombre, tipo }));
      if (resp.body?.success) {
        this.toastr.success(resp.body.message, 'Éxito');
        return resp.body;
      }
      return null;
    } catch (error: any) {
      console.log('TipoTransaccionService.updateTipoTransaccion error:', error);
      this.toastr.error(error?.error?.message || 'Error al actualizar transacción', 'Error');
      return null;
    }
  }

  async deleteTipoTransaccion(id: string): Promise<TipoTransaccionResponse | null> {
    try {
      const resp = await firstValueFrom(this.delete<TipoTransaccionResponse>(`${this.endpoints.tipoTransaccion}/${id}`));
      if (resp.body?.success) {
        this.toastr.success(resp.body.message, 'Éxito');
        return resp.body;
      }
      return null;
    } catch (error: any) {
      console.log('TipoTransaccionService.deleteTipoTransaccion error:', error);
      this.toastr.error(error?.error?.message || 'Error al eliminar transacción', 'Error');
      return null;
    }
  }
}

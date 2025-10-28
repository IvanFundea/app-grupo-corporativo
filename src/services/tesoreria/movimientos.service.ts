import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpService } from '../HttpService';
import { firstValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ApiResponse } from '../../interfaces/api-response';
import { IMovimientoBancarioDet } from '../../interfaces/tesoreria';


export type MovimientoDetResponse = ApiResponse<IMovimientoBancarioDet>;
export type MovimientoDetListResponse = ApiResponse<IMovimientoBancarioDet[]>;
import { IMovimientoBancarioCab } from '../../interfaces/tesoreria';
export type MovimientoCabResponse = ApiResponse<IMovimientoBancarioCab>;

@Injectable({ providedIn: 'root' })
export class MovimientosService extends HttpService {
  private readonly endpoints = { base: '/tesoreria/movimiento-bancario' };

  constructor(http: HttpClient, private toastr: ToastrService) {
    super(http);
  }

  // Crear detalle enviando empresa/cuenta/moneda, el backend crea/obtiene cabecera internamente
  async createDetalle(dto: {
    empresaId: string;
    cuentaBancariaId: string;
    tipoMonedaBanco: string;
    tipoTransaccionId: string;
    valor: number;
    usrIngreso: string;
  }): Promise<MovimientoDetResponse | null> {
    try {
      const resp = await firstValueFrom(this.post<MovimientoDetResponse>(`${this.endpoints.base}/detalle`, dto));
      if (resp.body?.success) return resp.body;
      return null;
    } catch (error: any) {
      console.log('MovimientosService.createDetalle error:', error);
      this.toastr.error(error?.error?.message || 'Error al crear detalle', 'Error');
      return null;
    }
  }

  // Listar detalles del día por empresa y cuenta bancaria (asumiendo soporte en backend vía query params)
  async findDetallesDelDia(empresaId: string, cuentaBancariaId: string, fechaISO?: string): Promise<MovimientoDetListResponse | null> {
    try {
      const params: any = { empresaId, cuentaBancariaId };
      if (fechaISO) params.fecha = fechaISO;
      const resp = await firstValueFrom(this.get<MovimientoDetListResponse>(`${this.endpoints.base}/detalles-filtros`, params));
      if (resp.body?.success) return resp.body;
      return null;
    } catch (error: any) {
      console.log('MovimientosService.findDetallesDelDia error:', error);
      this.toastr.error(error?.error?.message || 'Error al obtener detalles del día', 'Error');
      return null;
    }
  }

  async removeDetalle(id: string, usuario: string): Promise<MovimientoDetResponse | null> {
    try {
      const resp = await firstValueFrom(this.delete<MovimientoDetResponse>(`${this.endpoints.base}/detalle/${id}`, { usuario }));
      if (resp.body?.success) return resp.body;
      return null;
    } catch (error: any) {
      console.log('MovimientosService.removeDetalle error:', error);
      this.toastr.error(error?.error?.message || 'Error al eliminar detalle', 'Error');
      return null;
    }
  }

  // Obtener la cabecera asociada a una cuenta en una fecha (puede no existir)
  async listarCabeceraPorFecha(cuentaBancariaId: string, fecha: string, empresaId?: string): Promise<MovimientoCabResponse | null> {
    try {
      const params: any = { cuentaBancariaId, fecha };
      if (empresaId) params.empresaId = empresaId;
      const resp = await firstValueFrom(this.get<MovimientoCabResponse>(`${this.endpoints.base}/cabeceras-por-fecha`, params));
      if (resp.body?.success) return resp.body;
      return null;
    } catch (error: any) {
      console.log('MovimientosService.listarCabeceraPorFecha error:', error);
      this.toastr.error(error?.error?.message || 'Error al obtener cabecera por fecha', 'Error');
      return null;
    }
  }
}

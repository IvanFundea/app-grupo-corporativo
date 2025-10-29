import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpService } from '../HttpService';
import { firstValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ApiResponse } from '../../interfaces/api-response';
import { IMovimientoBancarioCompleto, IMovimientoBancarioDet } from '../../interfaces/tesoreria';


export type MovimientoDetResponse = ApiResponse<IMovimientoBancarioDet>;
export type MovimientoDetListResponse = ApiResponse<IMovimientoBancarioDet[]>;
import { IMovimientoBancarioCab } from '../../interfaces/tesoreria';
export type MovimientoCabResponse = ApiResponse<IMovimientoBancarioCab>;
export type MovimientoCompletoResponse = ApiResponse<IMovimientoBancarioCompleto>;

@Injectable({ providedIn: 'root' })
export class MovimientosService extends HttpService {
  private readonly endpoints = { 
    base: '/tesoreria/movimiento-bancario',
    cabeceraExistente: '/tesoreria/movimiento-bancario/cabecera-filtros'
  };

  constructor(http: HttpClient, private toastr: ToastrService) {
    super(http);
  }

  // Crear detalle usando cabeceraId (backend ya no requiere empresa/banco)
  async createDetalle(dto: {
    cabeceraId: string;
    tipoTransaccionId: string;
    valor: number;
    flotante?: boolean;
    descripcion?: string;
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
  async findDetallesDelDia(cabeceraId: string,): Promise<MovimientoDetListResponse | null> {
    try {
      const resp = await firstValueFrom(this.get<MovimientoDetListResponse>(`${this.endpoints.base}/detalles/${cabeceraId}`));
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
      const resp = await firstValueFrom(this.get<MovimientoCabResponse>(`${this.endpoints.cabeceraExistente}`, params));
      if (resp.body?.success) return resp.body;
      return null;
    } catch (error: any) {
      console.log('MovimientosService.listarCabeceraPorFecha error:', error);
      this.toastr.error(error?.error?.message || 'Error al obtener cabecera por fecha', 'Error');
      return null;
    }
  }

  // Crear o recuperar cabecera para una fecha específica/empresa/cuenta
  async getOrCreateCabeceraPorFecha(dto: {
    empresaId: string;
    cuentaBancariaId: string;
    fecha: string; // YYYY-MM-DD
    tipoMonedaBanco?: string; // requerido solo si no existe y se va a crear
  }): Promise<MovimientoCompletoResponse | null> {
    try {
      const resp = await firstValueFrom(
        this.post<MovimientoCompletoResponse>(`${this.endpoints.base}/cabecera/por-fecha`, dto)
      );
      if (resp.body?.success) return resp.body;
      return null;
    } catch (error: any) {
      console.log('MovimientosService.getOrCreateCabeceraPorFecha error:', error);
      this.toastr.error(error?.error?.message || 'Error al obtener/crear cabecera', 'Error');
      return null;
    }
  }
}

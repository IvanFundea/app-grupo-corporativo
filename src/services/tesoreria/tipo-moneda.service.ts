import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpService } from '../HttpService';
import { firstValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ITipoMoneda } from '../../interfaces/tesoreria';
import { ApiResponse } from '../../interfaces/api-response';

// Tipos específicos para las respuestas del servicio
type TipoMonedaResponse = ApiResponse<ITipoMoneda>;
type TipoMonedaListResponse = ApiResponse<ITipoMoneda[]>;

@Injectable({
  providedIn: 'root'
})
export class TipoMonedaService extends HttpService {

  private readonly endpoints = {
    tipoMoneda: '/tesoreria/tipo-moneda',
  };

  constructor(http: HttpClient, private toastr: ToastrService) {
    super(http); // pasa HttpClient al servicio base
  }

  async getTipoMonedas({ page = 1, limit = 10, busqueda = '', all = false } = {}): Promise<TipoMonedaListResponse | null> {
    try {
      let params: any = {
        page,
        limit,
        busqueda
      }
      if (all) {
        params = {...params, todos: all};
      }
      const resp = await firstValueFrom(this.get<TipoMonedaListResponse>(`${this.endpoints.tipoMoneda}`, params));
      if (resp.body?.success) {        
        // this.toastr.success(resp.body.message, 'Success');      
        return resp.body;
      }

      return null;
    } catch (error: any) {
      console.log("🚀 ~ TipoMonedaService ~ getTipoMonedas ~ error:", error)
      this.toastr.error(error?.error?.message || 'Error al obtener tipos de moneda', 'Error');
      return null;
    }
  }

  async getTipoMoneda(tipoMonedaId: string): Promise<TipoMonedaResponse | null> {
    try {
      const resp = await firstValueFrom(this.get<TipoMonedaResponse>(`${this.endpoints.tipoMoneda}/${tipoMonedaId}`));
      if (resp.body?.success) {
        return resp.body;
      }

      return null;
    } catch (error: any) {
      console.log("🚀 ~ TipoMonedaService ~ getTipoMoneda ~ error:", error)
      this.toastr.error(error?.error?.message || 'Error al obtener tipo de moneda', 'Error');
      return null;
    }
  }

  async updateTipoMoneda(tipoMonedaUpdate: ITipoMoneda): Promise<TipoMonedaResponse | null> {
    try {
      // Preparamos los datos para actualizar
      const { tipoMonedaId, descripcion, simbolo } = tipoMonedaUpdate;
      const resp = await firstValueFrom(this.put<TipoMonedaResponse>(`${this.endpoints.tipoMoneda}/${tipoMonedaId}`, {
        descripcion,
        simbolo
      }));
      if (resp.body?.success) {
        this.toastr.success(resp.body.message, 'Éxito');
        return resp.body;
      }

      return null;
    } catch (error: any) {
      console.log("🚀 ~ TipoMonedaService ~ updateTipoMoneda ~ error:", error)
      this.toastr.error(error?.error?.message || 'Error al actualizar tipo de moneda', 'Error');
      return null;
    }
  }

  async createTipoMoneda(createTipoMoneda: Omit<ITipoMoneda, 'tipoMonedaId'>): Promise<TipoMonedaResponse | null> {
    try {
      // Obtenemos solo lo necesario para crear el tipo de moneda
      const { descripcion, simbolo } = createTipoMoneda;
      const resp = await firstValueFrom(this.post<TipoMonedaResponse>(`${this.endpoints.tipoMoneda}`, {
        descripcion,
        simbolo
      }));
      if (resp.body?.success) {
        this.toastr.success(resp.body.message, 'Éxito');
        return resp.body;
      }

      return null;
    } catch (error: any) {
      console.log("🚀 ~ TipoMonedaService ~ createTipoMoneda ~ error:", error)
      this.toastr.error(error?.error?.message || 'Error al crear tipo de moneda', 'Error');
      return null;
    }
  }

  async deleteTipoMoneda(tipoMonedaId: string): Promise<TipoMonedaResponse | null> {
    try {
      const resp = await firstValueFrom(this.delete<TipoMonedaResponse>(`${this.endpoints.tipoMoneda}/${tipoMonedaId}`));
      if (resp.body?.success) {
        this.toastr.success(resp.body.message, 'Éxito');
        return resp.body;
      }

      return null;
    } catch (error: any) {
      console.log("🚀 ~ TipoMonedaService ~ deleteTipoMoneda ~ error:", error)
      this.toastr.error(error?.error?.message || 'Error al eliminar tipo de moneda', 'Error');
      return null;
    }
  }
}
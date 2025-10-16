import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpService } from '../HttpService';
import { firstValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ApiResponse } from '../../interfaces/api-response';
import { IPuesto } from '../../interfaces/auth';

// Tipos específicos para las respuestas del servicio
type PuestoResponse = ApiResponse<IPuesto>;
type PuestoListResponse = ApiResponse<IPuesto[]>;

@Injectable({
  providedIn: 'root'
})
export class PuestoService extends HttpService {

  private readonly endpoints = {
    empresa: '/auth/puestos',
  };

  constructor(http: HttpClient, private toastr: ToastrService) {
    super(http); // pasa HttpCsolient al servicio base
  }

  async getPuestos({ page = 1, limit = 10, busqueda = '', all = false } = {}): Promise<PuestoListResponse | null> {
    try {
      let params: any = {
        page,
        limit,
        busqueda
      }
      if (all) {
        params = {...params, todos: all};
      }
      const resp = await firstValueFrom(this.get<PuestoListResponse>(`${this.endpoints.empresa}`, params));
      if (resp.body?.success) {        
        // this.toastr.success(resp.body.message, 'Success');      
        return resp.body;
      }

      return null;
    } catch (error: any) {
      console.log("🚀 ~ RolService ~ getRoles ~ error:", error)
      this.toastr.error(error?.error?.message || 'Error al obtener roles', 'Error');
      return null;
    }
  }

  async getPuesto(puestoId: string): Promise<PuestoResponse | null> {
    try {
      const resp = await firstValueFrom(this.get<PuestoResponse>(`${this.endpoints.empresa}/${puestoId}`));
      if (resp.body?.success) {
        return resp.body;
      }

      return null;
    } catch (error: any) {
      console.log("🚀 ~ PuestoService ~ getPuesto ~ error:", error)
      this.toastr.error(error?.error?.message || 'Error al obtener puesto', 'Error');
      return null;
    }
  }

  async updatePuesto(puestoUpdate: IPuesto): Promise<PuestoResponse | null> {
    try {
      // Preparamos los datos para actualizar
      const { puestoId, nombre } = puestoUpdate;
      const resp = await firstValueFrom(this.put<PuestoResponse>(`${this.endpoints.empresa}/${puestoId}`, {
        nombre
      }));          
      if (resp.body?.success) {
        this.toastr.success(resp.body.message, 'Éxito');
        return resp.body;
      }

      return null;
    } catch (error: any) {
      console.log("🚀 ~ PuestoService ~ updatePuesto ~ error:", error)
      this.toastr.error(error?.error?.message || 'Error al actualizar puesto', 'Error');
      return null;
    }
  }

  async createPuesto(createPuesto: Omit<IPuesto, 'puestoId'>): Promise<PuestoResponse | null> {
    try {
      // Obtenemos solo lo necesario para crear el puesto
      const { nombre } = createPuesto;
      const resp = await firstValueFrom(this.post<PuestoResponse>(`${this.endpoints.empresa}`, {
        nombre
      }));
      if (resp.body?.success) {
        this.toastr.success(resp.body.message, 'Éxito');
        return resp.body;
      }

      return null;
    } catch (error: any) {
      console.log("🚀 ~ RolService ~ createRol ~ error:", error)
      this.toastr.error(error?.error?.message || 'Error al crear rol', 'Error');
      return null;
    }
  }

  async deletePuesto(puestoId: string): Promise<PuestoResponse | null> {
    try {
      const resp = await firstValueFrom(this.delete<PuestoResponse>(`${this.endpoints.empresa}/${puestoId}`));
      if (resp.body?.success) {
        this.toastr.success(resp.body.message, 'Éxito');
        return resp.body;
      }

      return null;
    } catch (error: any) {
      console.log("🚀 ~ PuestoService ~ deletePuesto ~ error:", error)
      this.toastr.error(error?.error?.message || 'Error al eliminar puesto', 'Error');
      return null;
    }
  }

}
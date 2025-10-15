import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpService } from '../HttpService';
import { firstValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { IEmpresa } from '../../interfaces/tesoreria';
import { ApiResponse } from '../../interfaces/api-response';
import { IRol } from '../../interfaces/auth';

// Tipos específicos para las respuestas del servicio
type RolResponse = ApiResponse<IRol>;
type RolListResponse = ApiResponse<IRol[]>;

@Injectable({
  providedIn: 'root'
})
export class RolService extends HttpService {

  private readonly endpoints = {
    empresa: '/auth/roles',
  };

  constructor(http: HttpClient, private toastr: ToastrService) {
    super(http); // pasa HttpClient al servicio base
  }

  async getRoles({ page = 1, limit = 10, busqueda = '', all = false } = {}): Promise<RolListResponse | null> {
    try {
      let params: any = {
        page,
        limit,
        busqueda
      }
      if (all) {
        params = {...params, todos: all};
      }
      const resp = await firstValueFrom(this.get<RolListResponse>(`${this.endpoints.empresa}`, params));
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

  async getRol(rolId: string): Promise<RolResponse | null> {
    try {
      const resp = await firstValueFrom(this.get<RolResponse>(`${this.endpoints.empresa}/${rolId}`));
      if (resp.body?.success) {
        return resp.body;
      }

      return null;
    } catch (error: any) {
      console.log("🚀 ~ RolService ~ getRol ~ error:", error)
      this.toastr.error(error?.error?.message || 'Error al obtener rol', 'Error');
      return null;
    }
  }

  async updateRol(rolUpdate: IRol): Promise<RolResponse | null> {
    try {
      // Preparamos los datos para actualizar
      const { rolId, nombre, activo, invitado } = rolUpdate;
      const resp = await firstValueFrom(this.put<RolResponse>(`${this.endpoints.empresa}/${rolId}`, {
        nombre,
        activo,
        invitado,
      }));          
      if (resp.body?.success) {
        this.toastr.success(resp.body.message, 'Éxito');
        return resp.body;
      }

      return null;
    } catch (error: any) {
      console.log("🚀 ~ RolService ~ updateRol ~ error:", error)
      this.toastr.error(error?.error?.message || 'Error al actualizar rol', 'Error');
      return null;
    }
  }

  async createRol(createRol: Omit<IRol, 'rolId'>): Promise<RolResponse | null> {
    try {
      // Obtenemos solo lo necesario para crear el rol
      const { nombre } = createRol;
      const resp = await firstValueFrom(this.post<RolResponse>(`${this.endpoints.empresa}`, {
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

  async deleteRol(rolId: string): Promise<RolResponse | null> {
    try {
      const resp = await firstValueFrom(this.delete<RolResponse>(`${this.endpoints.empresa}/${rolId}`));
      if (resp.body?.success) {
        this.toastr.success(resp.body.message, 'Éxito');
        return resp.body;
      }

      return null;
    } catch (error: any) {
      console.log("🚀 ~ RolService ~ deleteRol ~ error:", error)
      this.toastr.error(error?.error?.message || 'Error al eliminar rol', 'Error');
      return null;
    }
  }

}
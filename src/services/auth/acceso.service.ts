import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpService } from '../HttpService';
import { firstValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ApiResponse } from '../../interfaces/api-response';
import { IAcceso } from '../../interfaces/auth';

export type AccesoResponse = ApiResponse<IAcceso>;
export type AccesoListResponse = ApiResponse<IAcceso[]>;

@Injectable({ providedIn: 'root' })
export class AccesoService extends HttpService {
  private readonly endpoints = { base: '/auth/accesos' };

  constructor(http: HttpClient, private toastr: ToastrService) {
    super(http);
  }

  async getAccesosByRol(rolId: string): Promise<AccesoListResponse | null> {
    try {
      const resp = await firstValueFrom(this.get<AccesoListResponse>(`${this.endpoints.base}/${rolId}/rol`));
      if (resp.body?.success) return resp.body;
      return null;
    } catch (error: any) {
      console.log('AccesoService.getAccesosByRol error:', error);
      this.toastr.error(error?.error?.message || 'Error al obtener accesos del rol', 'Error');
      return null;
    }
  }

  async createAcceso(dto: Omit<IAcceso, 'accesoId' | 'created_at' | 'updated_at' | 'deleted_at' | 'menu' | 'rol' | 'subMenus'>): Promise<AccesoResponse | null> {
    try {
      const resp = await firstValueFrom(this.post<AccesoResponse>(`${this.endpoints.base}`, dto));
      if (resp.body?.success) {
        this.toastr.success(resp.body.message || 'Acceso asignado', 'Éxito');
        return resp.body;
      }
      return null;
    } catch (error: any) {
      console.log('AccesoService.createAcceso error:', error);
      this.toastr.error(error?.error?.message || 'Error al crear acceso', 'Error');
      return null;
    }
  }

  async updateAcceso(acceso: IAcceso): Promise<AccesoResponse | null> {
    try {
      const { accesoId, ordenMenu, showApp, showWeb, activo, mainMenuId, menuId, rolId } = acceso as IAcceso;
      const resp = await firstValueFrom(
        this.put<AccesoResponse>(`${this.endpoints.base}/${accesoId}`, { ordenMenu, showApp, showWeb, activo, mainMenuId, menuId, rolId })
      );
      if (resp.body?.success) {
        this.toastr.success(resp.body.message || 'Acceso actualizado', 'Éxito');
        return resp.body;
      }
      return null;
    } catch (error: any) {
      console.log('AccesoService.updateAcceso error:', error);
      this.toastr.error(error?.error?.message || 'Error al actualizar acceso', 'Error');
      return null;
    }
  }

  async deleteAcceso(accesoId: string): Promise<AccesoResponse | null> {
    try {
      const resp = await firstValueFrom(this.delete<AccesoResponse>(`${this.endpoints.base}/${accesoId}`));
      if (resp.body?.success) {
        this.toastr.success(resp.body.message || 'Acceso eliminado', 'Éxito');
        return resp.body;
      }
      return null;
    } catch (error: any) {
      console.log('AccesoService.deleteAcceso error:', error);
      this.toastr.error(error?.error?.message || 'Error al eliminar acceso', 'Error');
      return null;
    }
  }
}

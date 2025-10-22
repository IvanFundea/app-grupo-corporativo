import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpService } from '../HttpService';
import { firstValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ApiResponse } from '../../interfaces/api-response';
import { IMenu } from '../../interfaces/auth';

// Tipos de respuesta
export type MenuResponse = ApiResponse<IMenu>;
export type MenuListResponse = ApiResponse<IMenu[]>;

@Injectable({ providedIn: 'root' })
export class MenuService extends HttpService {
  private readonly endpoints = {
    menus: '/auth/menus',
  };

  constructor(http: HttpClient, private toastr: ToastrService) {
    super(http);
  }

  async getMenus({ page = 1, limit = 10, busqueda = '', all = false } = {}): Promise<MenuListResponse | null> {
    try {
      let params: any = { page, limit, busqueda };
      if (all) params = { ...params, todos: all };
      const resp = await firstValueFrom(this.get<MenuListResponse>(`${this.endpoints.menus}`, params));
      if (resp.body?.success) return resp.body;
      return null;
    } catch (error: any) {
      console.log('🚀 ~ MenuService ~ getMenus ~ error:', error);
      this.toastr.error(error?.error?.message || 'Error al obtener menús', 'Error');
      return null;
    }
  }

  async getMenu(menuId: string): Promise<MenuResponse | null> {
    try {
      const resp = await firstValueFrom(this.get<MenuResponse>(`${this.endpoints.menus}/${menuId}`));
      if (resp.body?.success) return resp.body;
      return null;
    } catch (error: any) {
      console.log('🚀 ~ MenuService ~ getMenu ~ error:', error);
      this.toastr.error(error?.error?.message || 'Error al obtener menú', 'Error');
      return null;
    }
  }

  async createMenu(menu: Omit<IMenu, 'menuId' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<MenuResponse | null> {
    try {
      const { label, descripcion, color, icono, pathApp, pathWeb, principal, activo } = menu;
      const resp = await firstValueFrom(this.post<MenuResponse>(`${this.endpoints.menus}`, {
        label, descripcion, color, icono, pathApp, pathWeb, principal, activo
      }));
      if (resp.body?.success) {
        this.toastr.success(resp.body.message, 'Éxito');
        return resp.body;
      }
      return null;
    } catch (error: any) {
      console.log('🚀 ~ MenuService ~ createMenu ~ error:', error);
      this.toastr.error(error?.error?.message || 'Error al crear menú', 'Error');
      return null;
    }
  }

  async updateMenu(menu: IMenu): Promise<MenuResponse | null> {
    try {
      const { menuId, label, descripcion, color, icono, pathApp, pathWeb, principal, activo } = menu;
      const resp = await firstValueFrom(this.put<MenuResponse>(`${this.endpoints.menus}/${menuId}`, {
        label, descripcion, color, icono, pathApp, pathWeb, principal, activo
      }));
      if (resp.body?.success) {
        this.toastr.success(resp.body.message, 'Éxito');
        return resp.body;
      }
      return null;
    } catch (error: any) {
      console.log('🚀 ~ MenuService ~ updateMenu ~ error:', error);
      this.toastr.error(error?.error?.message || 'Error al actualizar menú', 'Error');
      return null;
    }
  }

  async deleteMenu(menuId: string): Promise<MenuResponse | null> {
    try {
      const resp = await firstValueFrom(this.delete<MenuResponse>(`${this.endpoints.menus}/${menuId}`));
      if (resp.body?.success) {
        this.toastr.success(resp.body.message, 'Éxito');
        return resp.body;
      }
      return null;
    } catch (error: any) {
      console.log('🚀 ~ MenuService ~ deleteMenu ~ error:', error);
      this.toastr.error(error?.error?.message || 'Error al eliminar menú', 'Error');
      return null;
    }
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpService } from '../HttpService';
import { ApiResponse } from '../../interfaces/api-response';
import { firstValueFrom } from 'rxjs';
import { IConfig, TipoConfiguracion } from '../../interfaces/auth';
import { ToastrService } from 'ngx-toastr';

export interface GetConfigsParams {
  page?: number;
  limit?: number;
  busqueda?: string;
  all?: boolean;
}

// Tipos de respuesta
export type ConfigResponse = ApiResponse<IConfig>;
export type ConfigListResponse = ApiResponse<IConfig[]>;

@Injectable({ providedIn: 'root' })
export class ConfigService extends HttpService {
  private readonly endpoints = {
    configs: '/auth/config',
  };

  constructor(http: HttpClient, private toastr: ToastrService) {
    super(http);
  }

  async getConfigs({ page = 1, limit = 10, busqueda = '', all = false }: GetConfigsParams = {}): Promise<ConfigListResponse | null> {
    try {
      let params: any = { page, limit, busqueda };
      if (all) params = { ...params, todos: all };
      const resp = await firstValueFrom(this.get<ConfigListResponse>(`${this.endpoints.configs}`, params));
      if (resp.body?.success) return resp.body;
      return null;
    } catch (error: any) {
      console.log('🚀 ~ ConfigService ~ getConfigs ~ error:', error);
      this.toastr.error(error?.error?.message || 'Error al obtener configuraciones', 'Error');
      return null;
    }
  }

  async getConfig(configId: string): Promise<ConfigResponse | null> {
    try {
      const resp = await firstValueFrom(this.get<ConfigResponse>(`${this.endpoints.configs}/${configId}`));
      if (resp.body?.success) return resp.body;
      return null;
    } catch (error: any) {
      console.log('🚀 ~ ConfigService ~ getConfig ~ error:', error);
      this.toastr.error(error?.error?.message || 'Error al obtener configuración', 'Error');
      return null;
    }
  }

  async createConfig(payload: Omit<IConfig, 'configId' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<ConfigResponse | null> {
    try {
      const { llave, tipo, valor, descripcion, activo } = payload;
      const resp = await firstValueFrom(this.post<ConfigResponse>(`${this.endpoints.configs}`, { llave, tipo, valor, descripcion, activo }));
      if (resp.body?.success) {
        this.toastr.success(resp.body.message, 'Éxito');
        return resp.body;
      }
      return null;
    } catch (error: any) {
      console.log('🚀 ~ ConfigService ~ createConfig ~ error:', error);
      this.toastr.error(error?.error?.message || 'Error al crear configuración', 'Error');
      return null;
    }
  }

  async updateConfig(configId: string, payload: Partial<Omit<IConfig, 'configId' | 'created_at' | 'updated_at' | 'deleted_at'>>): Promise<ConfigResponse | null> {
    try {
      const { llave, tipo, valor, descripcion, activo } = payload;
      const resp = await firstValueFrom(this.put<ConfigResponse>(`${this.endpoints.configs}/${configId}`, { llave, tipo, valor, descripcion, activo }));
      if (resp.body?.success) {
        this.toastr.success(resp.body.message, 'Éxito');
        return resp.body;
      }
      return null;
    } catch (error: any) {
      console.log('🚀 ~ ConfigService ~ updateConfig ~ error:', error);
      this.toastr.error(error?.error?.message || 'Error al actualizar configuración', 'Error');
      return null;
    }
  }

  async deleteConfig(configId: string): Promise<ConfigResponse | null> {
    try {
      const resp = await firstValueFrom(this.delete<ConfigResponse>(`${this.endpoints.configs}/${configId}`));
      if (resp.body?.success) {
        this.toastr.success(resp.body.message, 'Éxito');
        return resp.body;
      }
      return null;
    } catch (error: any) {
      console.log('🚀 ~ ConfigService ~ deleteConfig ~ error:', error);
      this.toastr.error(error?.error?.message || 'Error al eliminar configuración', 'Error');
      return null;
    }
  }
}

export type { IConfig, TipoConfiguracion };

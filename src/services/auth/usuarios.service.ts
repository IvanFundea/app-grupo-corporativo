import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpService } from '../HttpService';
import { firstValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ApiResponse } from '../../interfaces/api-response';
import { IUsuario } from '../../interfaces/auth';

type UsuarioResponse = ApiResponse<IUsuario>;
type UsuarioListResponse = ApiResponse<IUsuario[]>;

@Injectable({ providedIn: 'root' })
export class UsuariosService extends HttpService {
  private readonly endpoints = {
    usuarios: '/auth/usuarios',
  };

  constructor(http: HttpClient, private toastr: ToastrService) {
    super(http);
  }

  async getUsuarios({ page = 1, limit = 10, busqueda = '', all = false } = {}): Promise<UsuarioListResponse | null> {
    try {
      let params: any = { page, limit, busqueda };
      if (all) params = { ...params, todos: all };
      const resp = await firstValueFrom(this.get<UsuarioListResponse>(`${this.endpoints.usuarios}`, params));
      if (resp.body?.success) return resp.body;
      return null;
    } catch (error: any) {
      console.log('🚀 ~ UsuariosService ~ getUsuarios ~ error:', error);
      this.toastr.error(error?.error?.message || 'Error al obtener usuarios', 'Error');
      return null;
    }
  }

  async getUsuario(usuarioId: string): Promise<UsuarioResponse | null> {
    try {
      const resp = await firstValueFrom(this.get<UsuarioResponse>(`${this.endpoints.usuarios}/${usuarioId}`));
      if (resp.body?.success) return resp.body;
      return null;
    } catch (error: any) {
      console.log('🚀 ~ UsuariosService ~ getUsuario ~ error:', error);
      this.toastr.error(error?.error?.message || 'Error al obtener usuario', 'Error');
      return null;
    }
  }

  async createUsuario(usuario: Omit<IUsuario, 'usuarioId' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<UsuarioResponse | null> {
    try {
      const { nombre1, nombre2, nombre3, apellido1, apellido2, apellido3, userName, correo, rolId, puestoId, activo } = usuario;
      const resp = await firstValueFrom(this.post<UsuarioResponse>(`${this.endpoints.usuarios}`, {
        nombre1, nombre2, nombre3, apellido1, apellido2, apellido3, userName, correo, rolId, puestoId, activo
      }));
      if (resp.body?.success) {
        this.toastr.success(resp.body.message, 'Éxito');
        return resp.body;
      }
      return null;
    } catch (error: any) {
      console.log('🚀 ~ UsuariosService ~ createUsuario ~ error:', error);
      this.toastr.error(error?.error?.message || 'Error al crear usuario', 'Error');
      return null;
    }
  }

  async updateUsuario(usuario: IUsuario): Promise<UsuarioResponse | null> {
    try {
      const { usuarioId, nombre1, nombre2, nombre3, apellido1, apellido2, apellido3, userName, correo, rolId, puestoId, activo } = usuario;
      const resp = await firstValueFrom(this.put<UsuarioResponse>(`${this.endpoints.usuarios}/${usuarioId}`, {
        nombre1, nombre2, nombre3, apellido1, apellido2, apellido3, userName, correo, rolId, puestoId, activo
      }));
      if (resp.body?.success) {
        this.toastr.success(resp.body.message, 'Éxito');
        return resp.body;
      }
      return null;
    } catch (error: any) {
      console.log('🚀 ~ UsuariosService ~ updateUsuario ~ error:', error);
      this.toastr.error(error?.error?.message || 'Error al actualizar usuario', 'Error');
      return null;
    }
  }

  async deleteUsuario(usuarioId: string): Promise<UsuarioResponse | null> {
    try {
      const resp = await firstValueFrom(this.delete<UsuarioResponse>(`${this.endpoints.usuarios}/${usuarioId}`));
      if (resp.body?.success) {
        this.toastr.success(resp.body.message, 'Éxito');
        return resp.body;
      }
      return null;
    } catch (error: any) {
      console.log('🚀 ~ UsuariosService ~ deleteUsuario ~ error:', error);
      this.toastr.error(error?.error?.message || 'Error al eliminar usuario', 'Error');
      return null;
    }
  }
}

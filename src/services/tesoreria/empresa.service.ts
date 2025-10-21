import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpService } from '../HttpService';
import { firstValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { IEmpresa } from '../../interfaces/tesoreria';
import { IUsuario } from '../../interfaces/auth';
import { ApiResponse } from '../../interfaces/api-response';

// Tipos específicos para las respuestas del servicio
type EmpresaResponse = ApiResponse<IEmpresa>;
type EmpresaListResponse = ApiResponse<IEmpresa[]>;
type UsuarioListResponse = ApiResponse<IUsuario[]>;
type AsignacionResponse = ApiResponse<any>;

@Injectable({
  providedIn: 'root'
})
export class EmpresaService extends HttpService {

  private readonly endpoints = {
    empresa: '/tesoreria/empresa',
  };

  constructor(http: HttpClient, private toastr: ToastrService) {
    super(http); // pasa HttpClient al servicio base
  }

  async getEmpresas({ page = 1, limit = 10, busqueda = '', all = false } = {}): Promise<EmpresaListResponse | null> {
    try {
      let params: any = {
        page,
        limit,
        busqueda
      }
      if (all) {
        params = {...params, todos: all};
      }
      const resp = await firstValueFrom(this.get<EmpresaListResponse>(`${this.endpoints.empresa}`, params));
      if (resp.body?.success) {        
        // this.toastr.success(resp.body.message, 'Success');      
        return resp.body;
      }

      return null;
    } catch (error: any) {
      console.log("🚀 ~ EmpresaService ~ getEmpresas ~ error:", error)
      this.toastr.error(error?.error?.message || 'Error al obtener empresas', 'Error');
      return null;
    }
  }

  async getEmpresa(empresaId: string): Promise<EmpresaResponse | null> {
    try {
      const resp = await firstValueFrom(this.get<EmpresaResponse>(`${this.endpoints.empresa}/${empresaId}`));
      if (resp.body?.success) {
        return resp.body;
      }

      return null;
    } catch (error: any) {
      console.log("🚀 ~ EmpresaService ~ getEmpresa ~ error:", error)
      this.toastr.error(error?.error?.message || 'Error al obtener empresa', 'Error');
      return null;
    }
  }

  async updateEmpresa(empresaUpdate: IEmpresa): Promise<EmpresaResponse | null> {
    try {
      // Preparamos los datos para actualizar
      const { empresaId, nombre, direccion, nit, telefono, tipoMonedaId } = empresaUpdate;
      const resp = await firstValueFrom(this.put<EmpresaResponse>(`${this.endpoints.empresa}/${empresaId}`, {
        nombre,
        direccion,
        nit,
        telefono,
        tipoMonedaId
      }));
      if (resp.body?.success) {
        this.toastr.success(resp.body.message, 'Éxito');
        return resp.body;
      }

      return null;
    } catch (error: any) {
      console.log("🚀 ~ EmpresaService ~ updateEmpresa ~ error:", error)
      this.toastr.error(error?.error?.message || 'Error al actualizar empresa', 'Error');
      return null;
    }
  }

  async createEmpresa(createEmpresa: Omit<IEmpresa, 'empresaId'>): Promise<EmpresaResponse | null> {
    try {
      // Obtenemos solo lo necesario para crear la empresa
      const { nombre, direccion, nit, telefono, tipoMonedaId } = createEmpresa;
      const resp = await firstValueFrom(this.post<EmpresaResponse>(`${this.endpoints.empresa}`, {
        nombre,
        direccion,
        nit,
        telefono,
        tipoMonedaId
      }));
      if (resp.body?.success) {
        this.toastr.success(resp.body.message, 'Éxito');
        return resp.body;
      }

      return null;
    } catch (error: any) {
      console.log("🚀 ~ EmpresaService ~ createEmpresa ~ error:", error)
      this.toastr.error(error?.error?.message || 'Error al crear empresa', 'Error');
      return null;
    }
  }

  async deleteEmpresa(empresaId: string): Promise<EmpresaResponse | null> {
    try {
      const resp = await firstValueFrom(this.delete<EmpresaResponse>(`${this.endpoints.empresa}/${empresaId}`));
      if (resp.body?.success) {
        this.toastr.success(resp.body.message, 'Éxito');
        return resp.body;
      }

      return null;
    } catch (error: any) {
      console.log("🚀 ~ EmpresaService ~ deleteEmpresa ~ error:", error)
      this.toastr.error(error?.error?.message || 'Error al eliminar empresa', 'Error');
      return null;
    }
  }

  // Método adicional para obtener empresas por tipo de moneda
  async getEmpresasByTipoMoneda(tipoMonedaId: string): Promise<EmpresaListResponse | null> {
    try {
      const params = { tipoMonedaId };
      const resp = await firstValueFrom(this.get<EmpresaListResponse>(`${this.endpoints.empresa}/por-moneda`, params));
      if (resp.body?.success) {
        return resp.body;
      }

      return null;
    } catch (error: any) {
      console.log("🚀 ~ EmpresaService ~ getEmpresasByTipoMoneda ~ error:", error)
      this.toastr.error(error?.error?.message || 'Error al obtener empresas por tipo de moneda', 'Error');
      return null;
    }
  }

  // Empresas asignadas a un usuario
  async getEmpresasPorUsuario(usuarioId: string): Promise<EmpresaListResponse | null> {
    try {
      const resp = await firstValueFrom(this.get<EmpresaListResponse>(`${this.endpoints.empresa}/por-usuario/${usuarioId}`));
      if (resp.body?.success) {
        return resp.body;
      }
      return null;
    } catch (error: any) {
      console.log('🚀 ~ EmpresaService ~ getEmpresasPorUsuario ~ error:', error);
      this.toastr.error(error?.error?.message || 'Error al obtener empresas asignadas', 'Error');
      return null;
    }
  }

  // Listar usuarios asignados a una empresa
  async listarUsuariosAsignados(empresaId: string): Promise<UsuarioListResponse | null> {
    try {
      const resp = await firstValueFrom(this.get<UsuarioListResponse>(`${this.endpoints.empresa}/${empresaId}/usuarios`));
      if (resp.body?.success) {
        return resp.body;
      }
      return null;
    } catch (error: any) {
      console.log('🚀 ~ EmpresaService ~ listarUsuariosAsignados ~ error:', error);
      this.toastr.error(error?.error?.message || 'Error al listar usuarios asignados', 'Error');
      return null;
    }
  }

  // Asignar o desasignar usuario a una empresa
  async asignarUsuario(
    empresaId: string,
    dto: { usuarioId: string; asignar?: boolean; usuarioModifica: string }
  ): Promise<AsignacionResponse | null> {
    try {
      const resp = await firstValueFrom(
        this.post<AsignacionResponse>(`${this.endpoints.empresa}/${empresaId}/usuarios`, dto)
      );
      if (resp.body?.success) {
        this.toastr.success(resp.body.message || 'Operación realizada', 'Éxito');
        return resp.body;
      }
      return null;
    } catch (error: any) {
      console.log('🚀 ~ EmpresaService ~ asignarUsuario ~ error:', error);
      this.toastr.error(error?.error?.message || 'Error al actualizar asignación', 'Error');
      return null;
    }
  }
}
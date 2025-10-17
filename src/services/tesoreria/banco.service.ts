import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpService } from '../HttpService';
import { firstValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ApiResponse } from '../../interfaces/api-response';
import { IBanco } from '../../interfaces/tesoreria';

type BancoResponse = ApiResponse<IBanco>;
type BancoListResponse = ApiResponse<IBanco[]>;

@Injectable({ providedIn: 'root' })
export class BancoService extends HttpService {
  private readonly endpoints = {
    banco: '/tesoreria/banco',
  };

  constructor(http: HttpClient, private toastr: ToastrService) {
    super(http);
  }

  async getBancos({ page = 1, limit = 10, busqueda = '', all = false } = {}): Promise<BancoListResponse | null> {
    try {
      let params: any = { page, limit, busqueda };
      if (all) params = { ...params, todos: all };
      const resp = await firstValueFrom(this.get<BancoListResponse>(`${this.endpoints.banco}`, params));
      if (resp.body?.success) return resp.body;
      return null;
    } catch (error: any) {
      console.log('BancoService.getBancos error:', error);
      this.toastr.error(error?.error?.message || 'Error al obtener bancos', 'Error');
      return null;
    }
  }

  async getBanco(bancoId: string): Promise<BancoResponse | null> {
    try {
      const resp = await firstValueFrom(this.get<BancoResponse>(`${this.endpoints.banco}/${bancoId}`));
      if (resp.body?.success) return resp.body;
      return null;
    } catch (error: any) {
      console.log('BancoService.getBanco error:', error);
      this.toastr.error(error?.error?.message || 'Error al obtener banco', 'Error');
      return null;
    }
  }

  async createBanco(createBanco: Omit<IBanco, 'bancoId' | 'cuentasBancarias'>): Promise<BancoResponse | null> {
    try {
      const { nombre, nombreCorto } = createBanco;
      const resp = await firstValueFrom(this.post<BancoResponse>(`${this.endpoints.banco}`, { nombre, nombreCorto }));
      if (resp.body?.success) {
        this.toastr.success(resp.body.message, 'Éxito');
        return resp.body;
      }
      return null;
    } catch (error: any) {
      console.log('BancoService.createBanco error:', error);
      this.toastr.error(error?.error?.message || 'Error al crear banco', 'Error');
      return null;
    }
  }

  async updateBanco(banco: IBanco): Promise<BancoResponse | null> {
    try {
      const { bancoId, nombre, nombreCorto } = banco;
      const resp = await firstValueFrom(this.put<BancoResponse>(`${this.endpoints.banco}/${bancoId}`, { nombre, nombreCorto }));
      if (resp.body?.success) {
        this.toastr.success(resp.body.message, 'Éxito');
        return resp.body;
      }
      return null;
    } catch (error: any) {
      console.log('BancoService.updateBanco error:', error);
      this.toastr.error(error?.error?.message || 'Error al actualizar banco', 'Error');
      return null;
    }
  }

  async deleteBanco(bancoId: string): Promise<BancoResponse | null> {
    try {
      const resp = await firstValueFrom(this.delete<BancoResponse>(`${this.endpoints.banco}/${bancoId}`));
      if (resp.body?.success) {
        this.toastr.success(resp.body.message, 'Éxito');
        return resp.body;
      }
      return null;
    } catch (error: any) {
      console.log('BancoService.deleteBanco error:', error);
      this.toastr.error(error?.error?.message || 'Error al eliminar banco', 'Error');
      return null;
    }
  }
}

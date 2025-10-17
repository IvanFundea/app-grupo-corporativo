import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpService } from '../HttpService';
import { firstValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ApiResponse } from '../../interfaces/api-response';
import { ICuentaBancaria } from '../../interfaces/tesoreria';

type CuentaResponse = ApiResponse<ICuentaBancaria>;
type CuentaListResponse = ApiResponse<ICuentaBancaria[]>;

@Injectable({ providedIn: 'root' })
export class CuentaBancariaService extends HttpService {
  private readonly endpoints = {
    cuenta: '/tesoreria/cuenta-bancaria',
  };

  constructor(http: HttpClient, private toastr: ToastrService) {
    super(http);
  }

  async getCuentas({ page = 1, limit = 10, busqueda = '', all = false } = {}): Promise<CuentaListResponse | null> {
    try {
      let params: any = { page, limit, busqueda };
      if (all) params = { ...params, todos: all };
      const resp = await firstValueFrom(this.get<CuentaListResponse>(`${this.endpoints.cuenta}`, params));
      if (resp.body?.success) return resp.body;
      return null;
    } catch (error: any) {
      console.log('CuentaBancariaService.getCuentas error:', error);
      this.toastr.error(error?.error?.message || 'Error al obtener cuentas', 'Error');
      return null;
    }
  }

  async getCuenta(cuentaBancariaId: string): Promise<CuentaResponse | null> {
    try {
      const resp = await firstValueFrom(this.get<CuentaResponse>(`${this.endpoints.cuenta}/${cuentaBancariaId}`));
      if (resp.body?.success) return resp.body;
      return null;
    } catch (error: any) {
      console.log('CuentaBancariaService.getCuenta error:', error);
      this.toastr.error(error?.error?.message || 'Error al obtener cuenta', 'Error');
      return null;
    }
  }

  async createCuenta(createCuenta: Omit<ICuentaBancaria, 'cuentaBancariaId'>): Promise<CuentaResponse | null> {
    try {
      const { bancoId, empresaId, numero, tipoCuenta, tipoMonedaId, descripcion, saldoBanco } = createCuenta;
      const resp = await firstValueFrom(
        this.post<CuentaResponse>(`${this.endpoints.cuenta}`, { bancoId, empresaId, numero, tipoCuenta, tipoMonedaId, descripcion, saldoBanco })
      );
      if (resp.body?.success) {
        this.toastr.success(resp.body.message, 'Éxito');
        return resp.body;
      }
      return null;
    } catch (error: any) {
      console.log('CuentaBancariaService.createCuenta error:', error);
      this.toastr.error(error?.error?.message || 'Error al crear cuenta', 'Error');
      return null;
    }
  }

  async updateCuenta(cuenta: ICuentaBancaria): Promise<CuentaResponse | null> {
    try {
      const { cuentaBancariaId, bancoId, empresaId, numero, tipoCuenta, tipoMonedaId, descripcion, saldoBanco } = cuenta;
      const resp = await firstValueFrom(
        this.put<CuentaResponse>(`${this.endpoints.cuenta}/${cuentaBancariaId}`, { bancoId, empresaId, numero, tipoCuenta, tipoMonedaId, descripcion, saldoBanco })
      );
      if (resp.body?.success) {
        this.toastr.success(resp.body.message, 'Éxito');
        return resp.body;
      }
      return null;
    } catch (error: any) {
      console.log('CuentaBancariaService.updateCuenta error:', error);
      this.toastr.error(error?.error?.message || 'Error al actualizar cuenta', 'Error');
      return null;
    }
  }

  async deleteCuenta(cuentaBancariaId: string): Promise<CuentaResponse | null> {
    try {
      const resp = await firstValueFrom(this.delete<CuentaResponse>(`${this.endpoints.cuenta}/${cuentaBancariaId}`));
      if (resp.body?.success) {
        this.toastr.success(resp.body.message, 'Éxito');
        return resp.body;
      }
      return null;
    } catch (error: any) {
      console.log('CuentaBancariaService.deleteCuenta error:', error);
      this.toastr.error(error?.error?.message || 'Error al eliminar cuenta', 'Error');
      return null;
    }
  }
}

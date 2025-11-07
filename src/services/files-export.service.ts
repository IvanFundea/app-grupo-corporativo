import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../environments/environment';

/**
 * Servicio especializado para operaciones de archivos (exportaciones / descargas).
 * No extiende de HttpService porque requiere manejo distinto (responseType: 'blob').
 */
@Injectable({ providedIn: 'root' })
export class FilesExportService {
  private readonly endpoints = {
    exportCabecerasRango: '/files/export-cabeceras-rango'
  };

  constructor(private http: HttpClient, private toastr: ToastrService) {}

  /**
   * Descarga el Excel de cabeceras entre dos fechas. De momento solo envía las fechas.
   * Filtros opcionales (empresaId, cuentaBancariaId, bancoId) preparados para uso futuro.
   * @returns {Promise<{ blob: Blob; filename: string } | null>}
   */
  async descargarCabecerasRango(
    fechaInicio: string,
    fechaFin: string,
    opts: { empresaId?: string; cuentaBancariaId?: string; bancoId?: string } = {}
  ): Promise<{ blob: Blob; filename: string } | null> {
    try {
      if (!this.validISO(fechaInicio) || !this.validISO(fechaFin)) {
        this.toastr.error('Fechas inválidas. Formato esperado YYYY-MM-DD', 'Error');
        return null;
      }

      let params = new HttpParams()
        .set('fechaInicio', fechaInicio)
        .set('fechaFin', fechaFin);

      // Preparado para futura inclusión de filtros (no enviar todavía según requisito)
      // if (opts.empresaId) params = params.set('empresaId', opts.empresaId);
      // if (opts.cuentaBancariaId) params = params.set('cuentaBancariaId', opts.cuentaBancariaId);
      // if (opts.bancoId) params = params.set('bancoId', opts.bancoId);

      const url = environment.apiPath + this.endpoints.exportCabecerasRango;
      const token = this.getToken();
      const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});

      const resp = await firstValueFrom(
        this.http.get(url, {
          params,
          headers,
          observe: 'response',
          responseType: 'blob'
        })
      );

      const blob = resp.body as Blob;
      if (!blob || blob.size === 0) {
        this.toastr.warning('El archivo está vacío o no se generó correctamente', 'Advertencia');
        return null;
      }

      // Validar Content-Type cuando no sea Excel ni octet-stream e intentar leer mensaje de error
      const ct = (resp.headers.get('Content-Type') || resp.headers.get('content-type') || '').toLowerCase();
      const isExcel = ct.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') || ct.includes('application/vnd.ms-excel');
      const isOctet = ct.includes('application/octet-stream');
      if (ct && !isExcel && !isOctet) {
        try {
          const text = await blob.text();
          // Si es JSON de error del backend, mostrar mensaje
          try {
            const json = JSON.parse(text);
            const msg = json?.message || json?.error || 'El servidor no devolvió un archivo Excel.';
            this.toastr.error(msg, 'Error');
          } catch {
            this.toastr.error(text.substring(0, 200), 'Error');
          }
          return null;
        } catch {
          this.toastr.error('Respuesta no válida para archivo Excel', 'Error');
          return null;
        }
      }

      // Intentar obtener filename desde Content-Disposition
      let filename = `cabeceras_${fechaInicio}_a_${fechaFin}.xlsx`;
      const cd = resp.headers.get('Content-Disposition') || resp.headers.get('content-disposition');
      if (cd) {
        const match = /filename="?([^";]+)"?/i.exec(cd);
        if (match?.[1]) filename = match[1];
      }

      return { blob, filename };
    } catch (error: any) {
      console.log('FilesExportService.descargarCabecerasRango error:', error);
      this.toastr.error(error?.error?.message || 'Error al descargar Excel de cabeceras', 'Error');
      return null;
    }
  }

  /**
   * Conveniencia: dispara la descarga directamente creando un enlace temporal.
   */
  async guardarCabecerasRango(
    fechaInicio: string,
    fechaFin: string,
    opts: { empresaId?: string; cuentaBancariaId?: string; bancoId?: string } = {}
  ): Promise<boolean> {
    const result = await this.descargarCabecerasRango(fechaInicio, fechaFin, opts);
    if (!result) return false;
    try {
      const url = window.URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      this.toastr.success('Archivo descargado', 'Éxito');
      return true;
    } catch (e) {
      this.toastr.error('No se pudo iniciar la descarga', 'Error');
      return false;
    }
  }

  private validISO(val: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(val);
  }

  private getToken(): string {
    return localStorage.getItem('token') || '';
  }
}
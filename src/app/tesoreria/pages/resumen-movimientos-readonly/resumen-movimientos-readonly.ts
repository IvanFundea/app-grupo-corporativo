import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AuthService } from '../../../../services/auth/auth.service';
import { EmpresaService } from '../../../../services/tesoreria/empresa.service';
import { BancoService } from '../../../../services/tesoreria/banco.service';
import { CuentaBancariaService } from '../../../../services/tesoreria/cuenta-bancaria.service';
import { MovimientosService } from '../../../../services/tesoreria/movimientos.service';
import { TipoMonedaService } from '../../../../services/tesoreria/tipo-moneda.service';
import { TipoTransaccionService } from '../../../../services/tesoreria/tipo-transaccion.service';
import { IBanco, ICuentaBancaria, IEmpresa, ITipoMoneda, ITipoTransaccion, TipoTransaccionTipo } from '../../../../interfaces/tesoreria';
import { environment } from '../../../../environments/environment';
import { ConfigService } from '../../../../services/auth/config.service';
import { FilesExportService } from '../../../../services/files-export.service';
import { CustomIconComponent } from '../../../shared/components/custom-icon/custom-icon.component';

interface AccountRow {
  empresa: IEmpresa;
  banco: IBanco;
  cuenta: ICuentaBancaria;
}

interface CabeceraRow {
  cabeceraId: string;
  empresaId: string;
  empresaNombre: string;
  cuentaBancariaId: string;
  tipoMonedaBanco: string,
  bancoNombre: string;
  cuentaNumero: string;
  saldoAnterior: number;
  debitos: number;
  creditos: number;
  saldoDisponible: number;
  totalFlotante: number;
  saldoFinal: number;
}

@Component({
  selector: 'app-home-movimientos-readonly',
  standalone: true,
  imports: [RouterLink, DatePipe, CustomIconComponent],
  templateUrl: './resumen-movimientos-readonly.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ResumenMovimientosReadonlyPageComponent {
  private router = inject(Router);
  private auth = inject(AuthService);
  private empresaService = inject(EmpresaService);
  private bancoService = inject(BancoService);
  private cuentaService = inject(CuentaBancariaService);
  private movService = inject(MovimientosService);
  private monedaService = inject(TipoMonedaService);
  private configService = inject(ConfigService);
  private tipoTxService = inject(TipoTransaccionService);
  private filesExport = inject(FilesExportService);

  // Catálogos
  empresas = signal<IEmpresa[]>([]);
  bancos = signal<IBanco[]>([]);
  monedas = signal<ITipoMoneda[]>([]);
  tipos = signal<ITipoTransaccion[]>([]);
  // Cabeceras que se muestran en la tabla (por cuenta y fecha)
  cabeceras = signal<any[]>([]);

  // Todas las cuentas pertenecientes a las empresas del usuario
  cuentas = signal<ICuentaBancaria[]>([]);

  // Filtros
  selectedEmpresaId = signal<string>('');
  selectedBancoId = signal<string>('');
  // Rango de fechas (inicio y fin). Por compatibilidad, se usaba selectedFechaISO como "fecha final"
  startFechaISO = signal<string>('');
  endFechaISO = signal<string>('');
  fechaCierre = signal<string>('');  

  // Tabla
  rows = signal<AccountRow[]>([]);
  isLoading = signal<boolean>(false);
  isExporting = signal<boolean>(false);

  async ngOnInit() {
    const d = new Date();
    // d.setDate(d.getDate() - 1); // ayer por defecto
    // Obtener la cantidad de dias atras desde la tabla de configuraciones
    let resp = await this.configService.getConfigPorLlave('fecha_apertura');
    if (resp?.success) {
      const valor = resp?.data?.valor;
      if (typeof valor === 'string') {
        const posibleFecha = new Date(valor + 'T00:00:00');
        if (!isNaN(posibleFecha.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
          // Si valor es una fecha ISO (YYYY-MM-DD), usarla como fecha seleccionada
          // Le restamos un día a la fecha apertura para estimar la fecha de cierre
          d.setDate(posibleFecha.getDate() - 1);
        } else {
          // Si no es fecha, tratar como número de días atrás
          const diasAtras = Number(valor) || 2;
          d.setDate(d.getDate() - diasAtras);
        }
      } else {
        const diasAtras = Number(resp?.data?.valor) || 2;
        d.setDate(d.getDate() - diasAtras);
      }
    } else {
      d.setDate(d.getDate() - (environment.diasAtrasMovimientos || 2));
    }
    const endISO = d.toISOString().slice(0, 10);
    this.endFechaISO.set(endISO);
    this.fechaCierre.set(endISO);
    // Por defecto, la fecha inicial = fecha final (puedes ajustar a un rango mayor si se requiere)
    this.startFechaISO.set(endISO);
    this.loadInitial();
  }

  private async loadInitial() {
    this.isLoading.set(true);
    this.isLoading.set(false);  // ELIMINAR
    const user = this.auth.getUserStorage();
    const userId = user?.usuarioId || '';

    const [empResp, bancosResp, monResp, tiposResp] = await Promise.all([
      this.empresaService.getEmpresasPorUsuario(userId),
      this.bancoService.getBancos({ all: true }),
      this.monedaService.getTipoMonedas({ all: true }),
      this.tipoTxService.getTipoTransacciones({ all: true }),
    ]);

    if (empResp?.success) this.empresas.set(empResp.data || []);
    if (bancosResp?.success) this.bancos.set(bancosResp.data || []);
    if (monResp?.success) this.monedas.set(monResp.data || []);
    if (tiposResp?.success) this.tipos.set(tiposResp.data || []);

    // Cargar las cuentas de todas las empresas del usuario
    const cuentasAgrupadas: ICuentaBancaria[] = [];
    for (const e of this.empresas()) {
      const cr = await this.cuentaService.getCuentasByEmpresa(e.empresaId);
      if (cr?.success && cr.data) cuentasAgrupadas.push(...cr.data);
    }
    this.cuentas.set(cuentasAgrupadas);

    await this.refreshRows();
    this.isLoading.set(false);
  }


  async refreshRows() {
    this.isLoading.set(true);
    const inicio = this.startFechaISO();
    const fin = this.endFechaISO();

    const resp = await this.movService.listarCabecerasPorRango({ fechaInicio: inicio, fechaFin: fin });
    if (resp?.success) {
      const data = resp.data || [];
      
      this.cabeceras.set(data);
    } else {
      this.cabeceras.set([]);
    }
    this.isLoading.set(false);
  }

  onEmpresaChange(id: string) {
    this.selectedEmpresaId.set(id);
  }

  onBancoChange(id: string) {
    this.selectedBancoId.set(id);
  }

  onFechaInicialChange(val: string) {
    this.startFechaISO.set(val);
  }

  onFechaFinalChange(val: string) {
    this.endFechaISO.set(val);
  }

  // Acción explícita de búsqueda (de momento usa solo la fecha final)
  async onBuscar() {
    const inicio = this.startFechaISO();
    const fin = this.endFechaISO();
    if (inicio && fin && inicio > fin) {
      // Intercambiar si el usuario invirtió el rango
      this.startFechaISO.set(fin);
      this.endFechaISO.set(inicio);
    }
    await this.refreshRows();
  }

  async onExport() {
    const inicio = this.startFechaISO();
    const fin = this.endFechaISO();
    if (!inicio || !fin) return;
    let fi = inicio, ff = fin;
    if (fi > ff) {
      const tmp = fi; fi = ff; ff = tmp;
    }
    this.isExporting.set(true);
    try {
      await this.filesExport.guardarCabecerasRango(fi, ff);
    } finally {
      this.isExporting.set(false);
    }
  }


  irAModificar(row: CabeceraRow) {
    // Navegar a movimientos con contexto preseleccionado
    const fecha = this.endFechaISO();
    this.router.navigate(['/dashboard/tesoreria/movimientos'], {
      state: {
        empresaId: row.empresaId,
        cuentaBancariaId: row.cuentaBancariaId,
        fechaISO: fecha,
        cabeceraId: row.cabeceraId,
      }
    });
  }
}

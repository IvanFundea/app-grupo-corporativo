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
import { CustomIconComponent } from '../../../shared/components/custom-icon/custom-icon.component';
import { IBanco, ICuentaBancaria, IEmpresa, ITipoMoneda, ITipoTransaccion, TipoTransaccionTipo } from '../../../../interfaces/tesoreria';
import { environment } from '../../../../environments/environment';
import { ConfigService } from '../../../../services/auth/config.service';

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
  imports: [RouterLink, CustomIconComponent, DatePipe, DecimalPipe],
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

  // Catálogos
  empresas = signal<IEmpresa[]>([]);
  bancos = signal<IBanco[]>([]);
  monedas = signal<ITipoMoneda[]>([]);
  tipos = signal<ITipoTransaccion[]>([]);
  // Cabeceras que se muestran en la tabla (por cuenta y fecha)
  cabeceras = signal<CabeceraRow[]>([]);

  // Todas las cuentas pertenecientes a las empresas del usuario
  cuentas = signal<ICuentaBancaria[]>([]);

  // Filtros
  selectedEmpresaId = signal<string>('');
  selectedBancoId = signal<string>('');
  selectedFechaISO = signal<string>('');
  fechaCierreISO = signal<string>('');
  fechaDiaAnterior = computed(() => {
    const fechaStr = this.selectedFechaISO();
    // Defender: si no hay fecha o no es ISO (YYYY-MM-DD), no calcular
    if (!fechaStr || !/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) return '';
    const fecha = new Date(fechaStr + 'T00:00:00'); // forzar medianoche local para evitar desfases
    if (isNaN(fecha.getTime())) return '';
    fecha.setDate(fecha.getDate() - 1);
    // toISOString siempre UTC; mantenemos formato YYYY-MM-DD
    return fecha.toISOString().slice(0, 10);
  });

  // Tabla
  rows = signal<AccountRow[]>([]);
  isLoading = signal<boolean>(false);

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
    this.selectedFechaISO.set(d.toISOString().slice(0, 10));
    this.fechaCierreISO.set(d.toISOString().slice(0, 10));
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

  // Devuelve la lista de cuentas luego de aplicar filtros
  private get cuentasFiltradas(): ICuentaBancaria[] {
    const empresaId = this.selectedEmpresaId();
    const bancoId = this.selectedBancoId();
    return (this.cuentas() || []).filter(c =>
      (empresaId ? c.empresaId === empresaId : true) &&
      (bancoId ? c.bancoId === bancoId : true)
    );
  }

  async refreshRows() {
    this.isLoading.set(true);
    const fecha = this.selectedFechaISO();

    const empresasMap = new Map((this.empresas() || []).map(e => [e.empresaId, e] as [string, IEmpresa]));
    const bancosMap = new Map((this.bancos() || []).map(b => [b.bancoId, b] as [string, IBanco]));

    const cuentas = this.cuentasFiltradas;

    const newCabeceras: CabeceraRow[] = [];
    // Para cada cuenta obtener la cabecera de la fecha (si existe) y construir fila
    await Promise.all(cuentas.map(async (c) => {
      const cabResp = await this.movService.listarCabeceraPorFecha(c.cuentaBancariaId, fecha, c.empresaId);
      const empresa = empresasMap.get(c.empresaId)!;
      const banco = bancosMap.get(c.bancoId)!;
      const cuentaNumero = c.numero || '';
      const saldoBanco = c.saldoBanco || 0;

      if (cabResp?.success && cabResp.data) {
        const cab = cabResp.data;
        const saldoAnterior = (cab.saldoInicial as number) || 0;
        const debitos = (cab.totalDebitos as number) || 0;
        const creditos = (cab.totalCreditos as number) || 0;
        const flotante = cab.totalFlotante || 0;
        const saldoDisponible = (cab.saldoFinal as number) ?? (saldoAnterior + creditos - debitos + flotante);
        const cabReciente = await this.movService.cabeceraMasReciente(c.cuentaBancariaId, fecha, c.empresaId);
        newCabeceras.push({
          cabeceraId: cab.cabeceraId || ``,
          empresaId: c.empresaId,
          cuentaBancariaId: c.cuentaBancariaId,
          tipoMonedaBanco: c.tipoMonedaId || '',
          empresaNombre: empresa?.nombre || '',
          bancoNombre: banco?.nombre || '',
          cuentaNumero,
          saldoAnterior: saldoAnterior ? saldoAnterior : cabReciente?.data?.saldoFinal || 0,
          debitos,
          creditos,
          saldoDisponible,
          totalFlotante: flotante,
          saldoFinal: cab.saldoFinal ? cab.saldoFinal : cabReciente?.data?.saldoFinal || 0,
        });
      } else {
        // Cabecera no encontrada -> mostrar ceros        
        const cabReciente = await this.movService.cabeceraMasReciente(c.cuentaBancariaId, fecha, c.empresaId);
        newCabeceras.push({
          cabeceraId: ``,
          cuentaBancariaId: c.cuentaBancariaId,
          tipoMonedaBanco: c.tipoMonedaId,
          empresaId: c.empresaId,
          empresaNombre: empresa?.nombre || '',
          bancoNombre: banco?.nombre || '',
          cuentaNumero,
          saldoAnterior: cabReciente?.data?.saldoFinal || 0,
          debitos: 0,
          creditos: 0,
          saldoDisponible: 0,
          totalFlotante: 0,
          saldoFinal: cabReciente?.data?.saldoFinal || 0,
        });
      }
    }));

    // Orden básico por empresa y banco
    newCabeceras.sort((a, b) => (a.empresaNombre.localeCompare(b.empresaNombre) || a.bancoNombre.localeCompare(b.bancoNombre)));

    this.cabeceras.set(newCabeceras);
    this.isLoading.set(false);
  }

  onEmpresaChange(id: string) {
    this.selectedEmpresaId.set(id);
    this.refreshRows();
  }

  onBancoChange(id: string) {
    this.selectedBancoId.set(id);
    this.refreshRows();
  }

  onFechaChange(val: string) {
    // Espera fecha en formato YYYY-MM-DD
    this.selectedFechaISO.set(val);
    this.refreshRows();
  }

  getMonedaSimbolo(tipoMonedaId: string): string {
    const m = (this.monedas() || []).find(x => x.tipoMonedaId === tipoMonedaId);
    return m?.simbolo || '';
  }

  irAModificar(row: CabeceraRow) {
    // Navegar a movimientos con contexto preseleccionado
    const fecha = this.selectedFechaISO();
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

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

interface AccountRow {
  empresa: IEmpresa;
  banco: IBanco;
  cuenta: ICuentaBancaria;
  debitoFlotante: number;
  creditoFlotante: number;
  saldoProyectado: number;
}

interface RowTest {
  filaId: string,
  empresaNombre: string;
  bancoNombre: string;
  cuentaNumero: string;
  saldoAnterior: number;
  debitos: number;
  creditos: number;
  saldoDisponible: number;
  flotante: number;
  saldoBanco: number;
}

@Component({
  selector: 'app-home-movimientos',
  standalone: true,
  imports: [RouterLink, CustomIconComponent, DatePipe],
  templateUrl: './home-movimientos.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomeMovimientosPageComponent {
  private router = inject(Router);
  private auth = inject(AuthService);
  private empresaService = inject(EmpresaService);
  private bancoService = inject(BancoService);
  private cuentaService = inject(CuentaBancariaService);
  private movService = inject(MovimientosService);
  private monedaService = inject(TipoMonedaService);
  private tipoTxService = inject(TipoTransaccionService);

  // Catálogos
  empresas = signal<IEmpresa[]>([]);
  bancos = signal<IBanco[]>([]);
  monedas = signal<ITipoMoneda[]>([]);
  tipos = signal<ITipoTransaccion[]>([]);
  rowsNew = signal<RowTest[]>([
    {
      filaId: '1',
      empresaNombre: 'FUNDEA',
      bancoNombre: 'Industrial',
      cuentaNumero: '123456789',
      saldoAnterior: 1000,
      debitos: 200,
      creditos: 300,
      saldoDisponible: 1100,
      flotante: 100,
      saldoBanco: 1200
    },
    {
      filaId: '2',
      empresaNombre: 'FUNDEA',
      bancoNombre: 'GyT',
      cuentaNumero: '123456789',
      saldoAnterior: 1000,
      debitos: 200,
      creditos: 300,
      saldoDisponible: 1100,
      flotante: 100,
      saldoBanco: 1200
    },
    {
      filaId: '2',
      empresaNombre: 'FUNDEA',
      bancoNombre: 'Industrial',
      cuentaNumero: '123456789',
      saldoAnterior: 1000,
      debitos: 200,
      creditos: 300,
      saldoDisponible: 1100,
      flotante: 100,
      saldoBanco: 1200
    }
  ]);

  // Todas las cuentas pertenecientes a las empresas del usuario
  cuentas = signal<ICuentaBancaria[]>([]);

  // Filtros
  selectedEmpresaId = signal<string>('');
  selectedBancoId = signal<string>('');
  selectedFechaISO = signal<string>('');
  fechaDiaAnterior = computed(() => {
    const fechaStr = this.selectedFechaISO();
    const fecha = new Date(fechaStr);
    fecha.setDate(fecha.getDate() - 1);
    return fecha.toISOString().slice(0, 10);
  });

  // Tabla
  rows = signal<AccountRow[]>([]);
  isLoading = signal<boolean>(false);

  ngOnInit() {
    const d = new Date();
    d.setDate(d.getDate() - 1); // ayer por defecto
    this.selectedFechaISO.set(d.toISOString().slice(0, 10));
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
    console.log("CUENTAS: ",this.cuentas())

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
    this.isLoading.set(false);  // ELIMINAR
    const fecha = this.selectedFechaISO();
    const tiposMap = new Map(this.tipos().map(t => [t.tipoTransaccionId, t.tipo] as [string, TipoTransaccionTipo]));

    const empresasMap = new Map((this.empresas() || []).map(e => [e.empresaId, e] as [string, IEmpresa]));
    const bancosMap = new Map((this.bancos() || []).map(b => [b.bancoId, b] as [string, IBanco]));

    const cuentas = this.cuentasFiltradas;

    const newRows: AccountRow[] = [];
    // Cargar detalles del día para cada cuenta y construir resumen
    await Promise.all(cuentas.map(async (c) => {
      const det = await this.movService.findDetallesDelDia(c.empresaId, c.cuentaBancariaId, fecha);
      let deb = 0, cred = 0;
      if (det?.success && det.data) {
        for (const d of det.data) {
          const tipo = tiposMap.get(d.tipoTransaccionId);
          if (tipo === 'DEBITO') deb += (d.valor || 0);
          if (tipo === 'CREDITO') cred += (d.valor || 0);
        }
      }
      const empresa = empresasMap.get(c.empresaId)!;
      const banco = bancosMap.get(c.bancoId)!;
      const saldoBanco = c.saldoBanco || 0;
      const saldoProyectado = saldoBanco + cred - deb;
      newRows.push({ empresa, banco, cuenta: c, debitoFlotante: deb, creditoFlotante: cred, saldoProyectado });
    }));

    // Orden básico por empresa y banco
    newRows.sort((a, b) => (a.empresa.nombre.localeCompare(b.empresa.nombre) || a.banco.nombre.localeCompare(b.banco.nombre)));

    this.rows.set(newRows);
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

  irAModificar(row: AccountRow) {
    // Navegar a movimientos con contexto preseleccionado
    const fecha = this.selectedFechaISO();
    this.router.navigate(['/dashboard/tesoreria/movimientos'], {
      state: {
        empresaId: row.cuenta.empresaId,
        cuentaBancariaId: row.cuenta.cuentaBancariaId,
        fechaISO: fecha,
      }
    });
  }
}

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { CustomIconComponent } from '../../../shared/components/custom-icon/custom-icon.component';
import { AuthService } from '../../../../services/auth/auth.service';
import { EmpresaService } from '../../../../services/tesoreria/empresa.service';
import { CuentaBancariaService } from '../../../../services/tesoreria/cuenta-bancaria.service';
import { BancoService } from '../../../../services/tesoreria/banco.service';
import { TipoMonedaService } from '../../../../services/tesoreria/tipo-moneda.service';
import { TipoTransaccionService } from '../../../../services/tesoreria/tipo-transaccion.service';
import { MovimientosService } from '../../../../services/tesoreria/movimientos.service';
import { IEmpresa, ICuentaBancaria, ITipoMoneda, ITipoTransaccion, TipoTransaccionTipo, IBanco, IMovimientoBancarioDet } from '../../../../interfaces/tesoreria';

@Component({
  selector: 'app-movimientos-page',
  standalone: true,
  imports: [RouterLink, CustomIconComponent, DatePipe, DecimalPipe],
  templateUrl: './movimientos-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MovimientosPageComponent {
  private auth = inject(AuthService);
  private empresaService = inject(EmpresaService);
  private cuentaService = inject(CuentaBancariaService);
  private bancoService = inject(BancoService);
  private monedaService = inject(TipoMonedaService);
  private tipoTxService = inject(TipoTransaccionService);
  private movService = inject(MovimientosService);

  // Catálogos
  empresas = signal<IEmpresa[]>([]);
  cuentas = signal<ICuentaBancaria[]>([]);
  bancos = signal<IBanco[]>([]);
  monedas = signal<ITipoMoneda[]>([]);
  tipos = signal<ITipoTransaccion[]>([]);

  // Selecciones
  selectedEmpresaId = signal<string>('');
  selectedBancoId = signal<string>('');
  selectedCuentaId = signal<string>('');
  selectedTipoTransaccionId = signal<string>('');
  monto = signal<number | null>(null);

  detalles = signal<IMovimientoBancarioDet[]>([]);

  // UI state
  nowLabel = signal<string>('');
  isLoading = signal<boolean>(false);
  isAdding = signal<boolean>(false);

  ngOnInit() {
    this.nowLabel.set(new Date().toLocaleString());
    this.loadInitial();
  }

  private async loadInitial() {
    const user = this.auth.getUserStorage();
    const userId = user?.usuarioId || '';
    // Empresas asignadas
    const empResp = await this.empresaService.getEmpresasPorUsuario(userId);
    if (empResp?.success) this.empresas.set(empResp.data || []);

    // Bancos
    const bancosResp = await this.bancoService.getBancos({ all: true });
    if (bancosResp?.success) this.bancos.set(bancosResp.data || []);

    // Monedas y tipos transacción
    const [monResp, tiposResp] = await Promise.all([
      this.monedaService.getTipoMonedas({ all: true }),
      this.tipoTxService.getTipoTransacciones({ all: true })
    ]);
    if (monResp?.success) this.monedas.set(monResp.data || []);
    if (tiposResp?.success) this.tipos.set(tiposResp.data || []);
  }

  async onEmpresaChange(id: string) {
    this.selectedEmpresaId.set(id);
    this.selectedCuentaId.set('');
    this.selectedBancoId.set('');
    this.detalles.set([]);
    if (!id) return;
    // cargar cuentas por empresa
    const resp = await this.cuentaService.getCuentasByEmpresa(id);
    if (resp?.success) this.cuentas.set(resp.data || []);
  }

  // Cuentas filtradas por banco seleccionado (si existe)
  get cuentasFiltradas(): ICuentaBancaria[] {
    const bancoId = this.selectedBancoId();
    const todas = this.cuentas() || [];
    return bancoId ? todas.filter(c => c.bancoId === bancoId) : todas;
  }

  async onCuentaChange(id: string) {
    this.selectedCuentaId.set(id);
    this.detalles.set([]);
    if (!id || !this.selectedEmpresaId()) return;
    await this.loadDetallesDelDia();
  }

  private async loadDetallesDelDia() {
    if (!this.selectedEmpresaId() || !this.selectedCuentaId()) return;
    this.isLoading.set(true);
    const today = new Date().toISOString().slice(0, 10);
    const det = await this.movService.findDetallesDelDia(this.selectedEmpresaId(), this.selectedCuentaId(), today);
    if (det?.success) this.detalles.set(det.data || []);
    this.isLoading.set(false);
  }

  get currencySymbol(): string {
    const cuenta = (this.cuentas() || []).find(c => c.cuentaBancariaId === this.selectedCuentaId());
    const moneda = (this.monedas() || []).find(m => m.tipoMonedaId === (cuenta?.tipoMonedaId || ''));
    return moneda ? moneda.simbolo : '';
  }

  get detallesCredito() {
    const mapTipo = new Map(this.tipos().map(t => [t.tipoTransaccionId, t.tipo] as [string, TipoTransaccionTipo]));
    return (this.detalles() || []).filter(d => mapTipo.get(d.tipoTransaccionId) === 'CREDITO');
  }

  get detallesDebito() {
    const mapTipo = new Map(this.tipos().map(t => [t.tipoTransaccionId, t.tipo] as [string, TipoTransaccionTipo]));
    return (this.detalles() || []).filter(d => mapTipo.get(d.tipoTransaccionId) === 'DEBITO');
  }

  get saldoActual(): number {
    const creditos = this.detallesCredito.reduce((acc, d) => acc + (d.valor || 0), 0);
    const debitos = this.detallesDebito.reduce((acc, d) => acc + (d.valor || 0), 0);
    return creditos - debitos;
  }

  async agregarDetalle() {
    if (!this.selectedEmpresaId() || !this.selectedCuentaId() || !this.selectedTipoTransaccionId() || !this.monto()) return;
    this.isAdding.set(true);
    const usr = this.auth.getUserStorage()?.userName || 'sistema';
    const cuenta = (this.cuentas() || []).find(c => c.cuentaBancariaId === this.selectedCuentaId());
    const resp = await this.movService.createDetalle({
      empresaId: this.selectedEmpresaId(),
      cuentaBancariaId: this.selectedCuentaId(),
      tipoMonedaBanco: cuenta?.tipoMonedaId || '',
      tipoTransaccionId: this.selectedTipoTransaccionId(),
      valor: Number(this.monto()),
      usrIngreso: usr,
    });
    if (resp?.success) {
      this.monto.set(null);
      await this.loadDetallesDelDia();
    }
    this.isAdding.set(false);
  }

  // Helpers para template
  onMontoInput(event: Event) {
    const val = Number((event.target as HTMLInputElement).value || 0);
    this.monto.set(isNaN(val) ? 0 : val);
  }

  getTipoNombre(tipoTransaccionId: string): string {
    const t = (this.tipos() || []).find(x => x.tipoTransaccionId === tipoTransaccionId);
    return t ? t.nombre : '';
  }
}

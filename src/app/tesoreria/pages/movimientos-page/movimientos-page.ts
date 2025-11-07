import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { CustomIconComponent } from '../../../shared/components/custom-icon/custom-icon.component';
import { TimezoneDatePipe } from '../../../shared/pipes/timezone-date.pipe';
import { AuthService } from '../../../../services/auth/auth.service';
import { EmpresaService } from '../../../../services/tesoreria/empresa.service';
import { CuentaBancariaService } from '../../../../services/tesoreria/cuenta-bancaria.service';
import { BancoService } from '../../../../services/tesoreria/banco.service';
import { TipoMonedaService } from '../../../../services/tesoreria/tipo-moneda.service';
import { TipoTransaccionService } from '../../../../services/tesoreria/tipo-transaccion.service';
import { MovimientosService } from '../../../../services/tesoreria/movimientos.service';
import { IEmpresa, ICuentaBancaria, ITipoMoneda, ITipoTransaccion, TipoTransaccionTipo, IBanco, IMovimientoBancarioDet, IMovimientoBancarioCab } from '../../../../interfaces/tesoreria';

@Component({
  selector: 'app-movimientos-page',
  standalone: true,
  imports: [RouterLink, CustomIconComponent, DecimalPipe, TimezoneDatePipe],
  templateUrl: './movimientos-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MovimientosPageComponent {
  private router = inject(Router);
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
  descripcion = signal<string>('');
  selectedFechaISO = signal<string>('');
  cabeceraId = signal<string>('');
  cabecera = signal<IMovimientoBancarioCab | null>(null);
  deleteTarget = signal<IMovimientoBancarioDet | null>(null);

  @ViewChild('deleteModal', { static: true }) deleteModal!: ElementRef<HTMLDivElement>;

  detalles = signal<IMovimientoBancarioDet[]>([]);

  // UI state
  nowLabel = signal<string>('');
  isLoading = signal<boolean>(false);
  isAdding = signal<boolean>(false);

  ngOnInit() {
    this.nowLabel.set(new Date().toLocaleString());
    // Fecha seleccionada por defecto: hoy (YYYY-MM-DD)
    const today = new Date().toISOString().slice(0, 10);
    this.selectedFechaISO.set(today);
    this.loadInitial();
  }

  ngAfterViewInit() {
    this.initializePreline();
  }

  private initializePreline() {
    if (typeof window !== 'undefined' && (window as any).HSStaticMethods) {
      setTimeout(() => (window as any).HSStaticMethods.autoInit(), 100);
    }
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

    // Intentar aplicar estado de navegación preseleccionado
    await this.fetchData();
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
    const det = await this.movService.findDetallesDelDia(this.cabeceraId());
    if (det?.success) this.detalles.set(det.data || []);
    this.isLoading.set(false);
  }

  get currencySymbol(): string {
    const cuenta = (this.cuentas() || []).find(c => c.cuentaBancariaId === this.selectedCuentaId());
    const moneda = (this.monedas() || []).find(m => m.tipoMonedaId === (cuenta?.tipoMonedaId || ''));
    return moneda ? moneda.simbolo : '';
  }

  // Contexto seleccionado (solo lectura para la UI)
  get selectedEmpresaNombre(): string {
    const e = (this.empresas() || []).find(x => x.empresaId === this.selectedEmpresaId());
    return e?.nombre || '-';
  }

  get selectedCuenta(): ICuentaBancaria | undefined {
    return (this.cuentas() || []).find(c => c.cuentaBancariaId === this.selectedCuentaId());
  }

  get selectedBancoNombre(): string {
    const bancoId = this.selectedCuenta?.bancoId || '';
    const b = (this.bancos() || []).find(x => x.bancoId === bancoId);
    return b?.nombre || '-';
  }

  get selectedCuentaNumero(): string {
    return this.selectedCuenta?.numero || '';
  }

  get selectedCuentaDescripcion(): string {
    return this.selectedCuenta?.descripcion || '';
  }

  // Tipo seleccionado y si requiere remediación (descripción obligatoria)
  get tipoSeleccionado(): ITipoTransaccion | undefined {
    return (this.tipos() || []).find(t => t.tipoTransaccionId === this.selectedTipoTransaccionId());
  }

  get requiereRemediacion(): boolean {
    return !!this.tipoSeleccionado?.remediacion;
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

  async eliminarDetalle(det: IMovimientoBancarioDet) {
    if (!det?.movimientoBancarioDetId) return;
    const usr = this.auth.getUserStorage()?.userName || 'sistema';
    const resp = await this.movService.removeDetalle(det.movimientoBancarioDetId, usr);
    if (resp?.success) {
      await this.fetchData();
    }
  }

  openDeleteModal(det: IMovimientoBancarioDet) {
    this.deleteTarget.set(det);
    const modalEl = this.deleteModal.nativeElement;
    if ((window as any).HSOverlay) new (window as any).HSOverlay(modalEl).open();
    else {
      modalEl.classList.remove('hidden');
      modalEl.classList.add('pointer-events-auto');
    }
  }

  closeModal() {
    const modalEl = this.deleteModal?.nativeElement;
    if (!modalEl) return;
    if ((window as any).HSOverlay) {
      (window as any).HSOverlay.close(modalEl);
    } else {
      modalEl.classList.add('hidden');
      modalEl.classList.remove('open', 'pointer-events-auto');
    }
  }

  async confirmDelete() {
    const det = this.deleteTarget();
    if (!det) return;
    await this.eliminarDetalle(det);
    this.closeModal();
    this.deleteTarget.set(null);
  }

  async agregarDetalle() {
    if (!this.selectedCuentaId() || !this.monto()) return;
    if (this.requiereRemediacion && !(`${this.descripcion()}`.trim())) {
      return; // descripción requerida cuando el tipo tiene remediación
    }
    // Asegurar que exista cabeceraId
    if (!this.cabeceraId()) {
      const empresaId = this.selectedEmpresaId();
      const cuentaBancariaId = this.selectedCuentaId();
      if (empresaId && cuentaBancariaId) {
        const cuenta = (this.cuentas() || []).find(c => c.cuentaBancariaId === cuentaBancariaId);
        const usr = this.auth.getUserStorage()?.userName || 'sistema';
        const cab = await this.movService.getOrCreateCabeceraPorFecha({
          empresaId,
          cuentaBancariaId,
          fecha: this.selectedFechaISO(),
          tipoMonedaBanco: cuenta?.tipoMonedaId,
        });
        if (cab?.success && cab.data) {
          this.cabeceraId.set(cab.data.cabecera.cabeceraId);
        } else {
          return; // no se pudo crear/obtener cabecera
        }
      } else {
        return;
      }
    }

    this.isAdding.set(true);
    const usr = this.auth.getUserStorage()?.userName || 'sistema';
    const resp = await this.movService.createDetalle({
      cabeceraId: this.cabeceraId(),
      tipoTransaccionId: this.selectedTipoTransaccionId(),
      valor: Number(this.monto()),
      descripcion: this.descripcion() ? `${this.descripcion()}`.trim() : undefined,
      usrIngreso: usr,
    });
    if (resp?.success) {
      this.monto.set(null);
      this.descripcion.set('');
      await this.fetchData();
    }
    this.isAdding.set(false);
  }

  // Helpers para template
  onMontoInput(event: Event) {
    const val = Number((event.target as HTMLInputElement).value || 0);
    this.monto.set(isNaN(val) ? 0 : val);
  }

  onDescripcionInput(event: Event) {
    const val = (event.target as HTMLInputElement).value || '';
    this.descripcion.set(val);
  }

  getTipoNombre(tipoTransaccionId: string): string {
    const t = (this.tipos() || []).find(x => x.tipoTransaccionId === tipoTransaccionId);
    return t ? t.nombre : '';
  }

  // // Al terminar la carga inicial, si venimos con estado de navegación, preseleccionar empresa/cuenta/fecha
  // private async applyNavigationStateIfAny() {
  //   const st = (this.router.getCurrentNavigation()?.extras?.state as any) || (window.history.state as any);
  //   const empresaId = st?.empresaId as string | undefined;
  //   const cuentaBancariaId = st?.cuentaBancariaId as string | undefined;
  //   const fechaISO = st?.fechaISO as string | undefined;
  //   const cabeceraId = st?.cabeceraId as string | undefined;
  //   if (!empresaId || !cuentaBancariaId) return;
  //   if (fechaISO) this.selectedFechaISO.set(fechaISO);
  //   await this.onEmpresaChange(empresaId);
  //   this.selectedCuentaId.set(cuentaBancariaId);
  //   if (cabeceraId) {
  //     this.cabeceraId.set(cabeceraId);
  //     await this.loadDetallesDelDia();
  //   } else {
  //     // Crear o recuperar cabecera y cargar sus detalles
  //     const cuenta = (this.cuentas() || []).find(c => c.cuentaBancariaId === cuentaBancariaId);
  //     const resp = await this.movService.getOrCreateCabeceraPorFecha({
  //       empresaId,
  //       cuentaBancariaId,
  //       fecha: this.selectedFechaISO(),
  //       tipoMonedaBanco: cuenta?.tipoMonedaId,
  //     });
  //     if (resp?.success && resp.data) {
  //       this.cabeceraId.set(resp.data.cabecera.cabeceraId);
  //       this.detalles.set(resp.data.detalles || []);
  //     } else {
  //       // fallback a consulta por día
  //       await this.loadDetallesDelDia();
  //     }
  //   }
  // }

  async fetchData() {
    const st = (this.router.getCurrentNavigation()?.extras?.state as any) || (window.history.state as any);
    const empresaId = st?.empresaId as string | undefined;
    const cuentaBancariaId = st?.cuentaBancariaId as string | undefined;
    const fechaISO = st?.fechaISO as string | undefined;
    const cabeceraId = st?.cabeceraId as string | undefined;
    if (!empresaId || !cuentaBancariaId) return;
    if (fechaISO) this.selectedFechaISO.set(fechaISO);
    await this.onEmpresaChange(empresaId);
    this.selectedCuentaId.set(cuentaBancariaId);
      const cuenta = (this.cuentas() || []).find(c => c.cuentaBancariaId === cuentaBancariaId);
      const resp = await this.movService.getOrCreateCabeceraPorFecha({
        empresaId,
        cuentaBancariaId,
        fecha: this.selectedFechaISO(),
        tipoMonedaBanco: cuenta?.tipoMonedaId,
      });
      if (resp?.success && resp.data) {
        this.cabeceraId.set(resp.data.cabecera.cabeceraId);
        this.cabecera.set(resp.data.cabecera);
        this.detalles.set(resp.data.detalles || []);
      }

  }
}

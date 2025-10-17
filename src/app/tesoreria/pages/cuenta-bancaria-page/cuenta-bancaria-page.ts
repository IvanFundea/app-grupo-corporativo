import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomIconComponent } from '../../../shared/components/custom-icon/custom-icon.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { CuentaBancariaService } from '../../../../services/tesoreria/cuenta-bancaria.service';
import { BancoService } from '../../../../services/tesoreria/banco.service';
import { EmpresaService } from '../../../../services/tesoreria/empresa.service';
import { TipoMonedaService } from '../../../../services/tesoreria/tipo-moneda.service';
import { IBanco, ICuentaBancaria, IEmpresa, ITipoMoneda } from '../../../../interfaces/tesoreria';
import { UpsertCuentaBancariaComponent } from '../../components/upsert-cuenta-bancaria/upsert-cuenta-bancaria';

const emptyCuenta: ICuentaBancaria = {
  cuentaBancariaId: '',
  bancoId: '',
  empresaId: '',
  numero: '',
  tipoCuenta: '',
  tipoMonedaId: '',
  descripcion: '',
  saldoBanco: undefined,
};

@Component({
  selector: 'app-cuenta-bancaria-page',
  standalone: true,
  imports: [RouterLink, CustomIconComponent, PaginationComponent, UpsertCuentaBancariaComponent],
  templateUrl: './cuenta-bancaria-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CuentaBancariaPageComponent {
  cuentaService = inject(CuentaBancariaService);
  bancoService = inject(BancoService);
  empresaService = inject(EmpresaService);
  tipoMonedaService = inject(TipoMonedaService);

  cuentas = signal<ICuentaBancaria[]>([]);
  bancos = signal<IBanco[]>([]);
  empresas = signal<IEmpresa[]>([]);
  tiposMoneda = signal<ITipoMoneda[]>([]);
  pagination = signal<IPagination>({ page: 1, pageSize: 10, totalItems: 0 });
  buscador = signal('');
  isLoading = signal(false);

  nuevaCuenta = signal(true);
  cuentaEdit = signal<ICuentaBancaria>({ ...emptyCuenta });
  formKey = signal(Date.now());
  modal = signal({ titulo: 'Crear Cuenta Bancaria', visible: false });

  @ViewChild('upsertModal', { static: true }) upsertModal!: ElementRef<HTMLDivElement>;
  @ViewChild('deleteModal', { static: true }) deleteModal!: ElementRef<HTMLDivElement>;

  async ngOnInit() {
    await this.fetchCatalogos();
    this.fetchData();
  }

  ngAfterViewInit() {
    this.initializePreline();
  }

  private initializePreline() {
    if (typeof window !== 'undefined' && (window as any).HSStaticMethods) {
      setTimeout(() => (window as any).HSStaticMethods.autoInit(), 100);
    }
  }

  async fetchCatalogos() {
    const [b, e, tm] = await Promise.all([
      this.bancoService.getBancos({ all: true }),
      this.empresaService.getEmpresas({ all: true }),
      this.tipoMonedaService.getTipoMonedas({ all: true }),
    ]);
    if (b?.success) this.bancos.set(b.data || []);
    if (e?.success) this.empresas.set(e.data || []);
    if (tm?.success) this.tiposMoneda.set(tm.data || []);
  }

  async fetchData() {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    const resp = await this.cuentaService.getCuentas({
      page: this.pagination().page,
      limit: this.pagination().pageSize,
      busqueda: this.buscador(),
    });
    if (resp?.success) {
      this.cuentas.set(resp.data || []);
      if (resp.metadata) this.pagination.update(p => ({ ...p, totalItems: resp.metadata?.total || 0 }));
      setTimeout(() => (window as any).HSStaticMethods?.autoInit(), 100);
    }
    this.isLoading.set(false);
  }

  onSearch(term: string) {
    this.buscador.set(term);
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.fetchData();
  }

  onChangePage(newPagination: IPagination) {
    this.cuentas.set([]);
    this.pagination.set(newPagination);
    this.fetchData();
  }

  openUpsertModal(nuevo: boolean, cuenta: ICuentaBancaria = emptyCuenta) {
    this.formKey.set(Date.now());
    this.nuevaCuenta.set(nuevo);
    this.cuentaEdit.set({ ...cuenta });
    this.modal.update(m => ({ ...m, titulo: nuevo ? 'Crear Cuenta Bancaria' : 'Editar Cuenta Bancaria', visible: true }));

    const modalEl = this.upsertModal.nativeElement;
    if ((window as any).HSOverlay) new (window as any).HSOverlay(modalEl).open();
    else {
      modalEl.classList.remove('hidden');
      modalEl.classList.add('pointer-events-auto');
    }
  }

  openDeleteModal(cuenta: ICuentaBancaria) {
    this.cuentaEdit.set({ ...cuenta });
    const modalEl = this.deleteModal.nativeElement;
    if ((window as any).HSOverlay) new (window as any).HSOverlay(modalEl).open();
    else {
      modalEl.classList.remove('hidden');
      modalEl.classList.add('pointer-events-auto');
    }
  }

  closeModal() {
    const modalEl = this.upsertModal.nativeElement;
    const modalDEl = this.deleteModal.nativeElement;
    if ((window as any).HSOverlay) {
      (window as any).HSOverlay.close(modalEl);
      (window as any).HSOverlay.close(modalDEl);
    } else {
      modalEl.classList.add('hidden');
      modalEl.classList.remove('open', 'pointer-events-auto');
      modalDEl.classList.add('hidden');
      modalDEl.classList.remove('open', 'pointer-events-auto');
    }
  }

  async upsertCuenta(cuenta: ICuentaBancaria) {
    if (!cuenta.cuentaBancariaId) await this.createCuenta(cuenta);
    else await this.updateCuenta(cuenta);
  }

  async createCuenta(cuenta: ICuentaBancaria) {
    const { cuentaBancariaId, ...payload } = cuenta;
    const resp = await this.cuentaService.createCuenta(payload);
    if (resp?.success) {
      this.fetchData();
      this.closeModal();
      this.cuentaEdit.set({ ...emptyCuenta });
      this.nuevaCuenta.set(true);
    }
  }

  async updateCuenta(cuenta: ICuentaBancaria) {
    const resp = await this.cuentaService.updateCuenta(cuenta);
    if (resp?.success) {
      this.fetchData();
      this.closeModal();
    }
  }

  async deleteCuenta(cuenta: ICuentaBancaria) {
    const resp = await this.cuentaService.deleteCuenta(cuenta.cuentaBancariaId);
    if (resp?.success) {
      this.fetchData();
      this.closeModal();
      this.cuentaEdit.set({ ...emptyCuenta });
      this.nuevaCuenta.set(true);
    }
  }

  // Helpers para el template (evitar funciones flecha en bindings)
  getBancoNombre(bancoId: string): string {
    const b = (this.bancos() || []).find(x => x.bancoId === bancoId);
    return b?.nombre || '—';
  }

  getEmpresaNombre(empresaId: string): string {
    const e = (this.empresas() || []).find(x => x.empresaId === empresaId);
    return e?.nombre || '—';
  }

  getMonedaSimbolo(tipoMonedaId: string): string {
    const tm = (this.tiposMoneda() || []).find(x => x.tipoMonedaId === tipoMonedaId);
    return tm?.simbolo || '—';
  }
}

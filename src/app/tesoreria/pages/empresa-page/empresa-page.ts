import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomIconComponent } from '../../../shared/components/custom-icon/custom-icon.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { EmpresaService } from '../../../../services/tesoreria/empresa.service';
import { TipoMonedaService } from '../../../../services/tesoreria/tipo-moneda.service';
import { IEmpresa, ITipoMoneda } from '../../../../interfaces/tesoreria';
import { UpsertEmpresaComponent } from '../../components/upsert-empresa/upsert-empresa';

const emptyEmpresa: IEmpresa = {
  empresaId: '',
  nombre: '',
  direccion: '',
  nit: '',
  telefono: 0,
  tipoMonedaId: '',
};

@Component({
  selector: 'app-empresa-page',
  standalone: true,
  imports: [RouterLink, CustomIconComponent, PaginationComponent, UpsertEmpresaComponent],
  templateUrl: './empresa-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EmpresaPageComponent {
  empresaService = inject(EmpresaService);
  tipoMonedaService = inject(TipoMonedaService);

  empresaList = signal<IEmpresa[]>([]);
  tipoMonedaList = signal<ITipoMoneda[]>([]);
  pagination = signal<IPagination>({ page: 1, pageSize: 10, totalItems: 0 });
  buscador = signal('');
  isLoading = signal(false);

  nuevaEmpresa = signal(true);
  empresaEdit = signal<IEmpresa>({ ...emptyEmpresa });
  formKey = signal(Date.now());
  modal = signal({ titulo: 'Crear Empresa', visible: false });

  @ViewChild('upsertModal', { static: true }) upsertModal!: ElementRef<HTMLDivElement>;
  @ViewChild('deleteModal', { static: true }) deleteModal!: ElementRef<HTMLDivElement>;

  async ngOnInit() {
    await this.fetchTipoMonedas();
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

  async fetchTipoMonedas() {
    const resp = await this.tipoMonedaService.getTipoMonedas({ all: true });
    if (resp?.success) this.tipoMonedaList.set(resp.data || []);
  }

  async fetchData() {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    const resp = await this.empresaService.getEmpresas({
      page: this.pagination().page,
      limit: this.pagination().pageSize,
      busqueda: this.buscador(),
    });
    if (resp?.success) {
      this.empresaList.set(resp.data || []);
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
    this.empresaList.set([]);
    this.pagination.set(newPagination);
    this.fetchData();
  }

  openUpsertModal(nuevo: boolean, empresa: IEmpresa = emptyEmpresa) {
    this.formKey.set(Date.now());
    this.nuevaEmpresa.set(nuevo);
    this.empresaEdit.set({ ...empresa });
    this.modal.update(m => ({ ...m, titulo: nuevo ? 'Crear Empresa' : 'Editar Empresa', visible: true }));

    const modalEl = this.upsertModal.nativeElement;
    if ((window as any).HSOverlay) new (window as any).HSOverlay(modalEl).open();
    else {
      modalEl.classList.remove('hidden');
      modalEl.classList.add('pointer-events-auto');
    }
  }

  openDeleteModal(empresa: IEmpresa) {
    this.empresaEdit.set({ ...empresa });
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

  async upsertEmpresa(empresa: IEmpresa) {
    if (!empresa.empresaId) await this.createEmpresa(empresa);
    else await this.updateEmpresa(empresa);
  }

  async createEmpresa(empresa: IEmpresa) {
    const { empresaId, ...payload } = empresa;
    const resp = await this.empresaService.createEmpresa(payload);
    if (resp?.success) {
      this.fetchData();
      this.closeModal();
      this.empresaEdit.set({ ...emptyEmpresa });
      this.nuevaEmpresa.set(true);
    }
  }

  async updateEmpresa(empresa: IEmpresa) {
    const resp = await this.empresaService.updateEmpresa(empresa);
    if (resp?.success) {
      this.fetchData();
      this.closeModal();
    }
  }

  async deleteEmpresa(empresa: IEmpresa) {
    const resp = await this.empresaService.deleteEmpresa(empresa.empresaId);
    if (resp?.success) {
      this.fetchData();
      this.closeModal();
      this.empresaEdit.set({ ...emptyEmpresa });
      this.nuevaEmpresa.set(true);
    }
  }

  getTipoMonedaNombre(tipoMonedaId: string): string {
    const tm = (this.tipoMonedaList() || []).find(x => x.tipoMonedaId === tipoMonedaId);
    return tm ? `${tm.descripcion} (${tm.simbolo})` : 'No definido';
  }
}

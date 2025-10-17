import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomIconComponent } from '../../../shared/components/custom-icon/custom-icon.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { TipoTransaccionService } from '../../../../services/tesoreria/tipo-transaccion.service';
import { ITipoTransaccion } from '../../../../interfaces/tesoreria';
import { UpsertTipoTransaccionComponent } from '../../components/upsert-tipo-transaccion/upsert-tipo-transaccion';

const emptyTipo: ITipoTransaccion = { tipoTransaccionId: '', nombre: '', tipo: 'DEBITO' };

@Component({
  selector: 'app-tipo-transaccion-page',
  standalone: true,
  imports: [RouterLink, CustomIconComponent, PaginationComponent, UpsertTipoTransaccionComponent],
  templateUrl: './tipo-transaccion-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TipoTransaccionPageComponent {
  service = inject(TipoTransaccionService);

  list = signal<ITipoTransaccion[]>([]);
  pagination = signal<IPagination>({ page: 1, pageSize: 10, totalItems: 0 });
  buscador = signal('');
  isLoading = signal(false);

  nuevo = signal(true);
  edit = signal<ITipoTransaccion>({ ...emptyTipo });
  formKey = signal(Date.now());
  modal = signal({ titulo: 'Crear Tipo', visible: false });

  @ViewChild('upsertModal', { static: true }) upsertModal!: ElementRef<HTMLDivElement>;
  @ViewChild('deleteModal', { static: true }) deleteModal!: ElementRef<HTMLDivElement>;

  async ngOnInit() {
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

  async fetchData() {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    const resp = await this.service.getTipoTransacciones({ page: this.pagination().page, limit: this.pagination().pageSize, busqueda: this.buscador() });
    if (resp?.success) {
      this.list.set(resp.data || []);
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
    this.list.set([]);
    this.pagination.set(newPagination);
    this.fetchData();
  }

  openUpsertModal(nuevo: boolean, tipo: ITipoTransaccion = emptyTipo) {
    this.formKey.set(Date.now());
    this.nuevo.set(nuevo);
    this.edit.set({ ...tipo });
    this.modal.update(m => ({ ...m, titulo: nuevo ? 'Crear Tipo' : 'Editar Tipo', visible: true }));

    const modalEl = this.upsertModal.nativeElement;
    if ((window as any).HSOverlay) new (window as any).HSOverlay(modalEl).open();
    else {
      modalEl.classList.remove('hidden');
      modalEl.classList.add('pointer-events-auto');
    }
  }

  openDeleteModal(tipo: ITipoTransaccion) {
    this.edit.set({ ...tipo });
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

  async upsertTipo(tipo: ITipoTransaccion) {
    if (!tipo.tipoTransaccionId) await this.createTipo(tipo);
    else await this.updateTipo(tipo);
  }

  async createTipo(tipo: ITipoTransaccion) {
    const { tipoTransaccionId, ...payload } = tipo;
    const resp = await this.service.createTipoTransaccion(payload);
    if (resp?.success) {
      this.fetchData();
      this.closeModal();
      this.edit.set({ ...emptyTipo });
      this.nuevo.set(true);
    }
  }

  async updateTipo(tipo: ITipoTransaccion) {
    const resp = await this.service.updateTipoTransaccion(tipo);
    if (resp?.success) {
      this.fetchData();
      this.closeModal();
    }
  }

  async deleteTipo(tipo: ITipoTransaccion) {
    const resp = await this.service.deleteTipoTransaccion(tipo.tipoTransaccionId);
    if (resp?.success) {
      this.fetchData();
      this.closeModal();
    }
  }

  tipoLabel(tipo: string) {
    switch (tipo) {
      case 'DEBITO': return 'Débito';
      case 'CREDITO': return 'Crédito';
      case 'SALDO': return 'Saldo';
      case 'CIERRE': return 'Cierre';
      default: return tipo;
    }
  }
}

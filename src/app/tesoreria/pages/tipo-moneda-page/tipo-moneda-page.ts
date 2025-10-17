import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomIconComponent } from '../../../shared/components/custom-icon/custom-icon.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { TipoMonedaService } from '../../../../services/tesoreria/tipo-moneda.service';
import { ITipoMoneda } from '../../../../interfaces/tesoreria';
import { UpsertTipoMonedaComponent } from '../../components/upsert-tipo-moneda/upsert-tipo-moneda';

const emptyTipoMoneda: ITipoMoneda = {
  tipoMonedaId: '',
  descripcion: '',
  simbolo: '',
};

@Component({
  selector: 'app-tipo-moneda-page',
  standalone: true,
  imports: [RouterLink, CustomIconComponent, PaginationComponent, UpsertTipoMonedaComponent],
  templateUrl: './tipo-moneda-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TipoMonedaPageComponent {
  tipoMonedaService = inject(TipoMonedaService);

  list = signal<ITipoMoneda[]>([]);
  pagination = signal<IPagination>({ page: 1, pageSize: 10, totalItems: 0 });
  buscador = signal('');
  isLoading = signal(false);

  nuevo = signal(true);
  edit = signal<ITipoMoneda>({ ...emptyTipoMoneda });
  formKey = signal(Date.now());
  modal = signal({ titulo: 'Crear Tipo de Moneda', visible: false });

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
    const resp = await this.tipoMonedaService.getTipoMonedas({
      page: this.pagination().page,
      limit: this.pagination().pageSize,
      busqueda: this.buscador()
    });
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

  openUpsertModal(nuevo: boolean, item: ITipoMoneda = emptyTipoMoneda) {
    this.formKey.set(Date.now());
    this.nuevo.set(nuevo);
    this.edit.set({ ...item });
    this.modal.update(m => ({ ...m, titulo: nuevo ? 'Crear Tipo de Moneda' : 'Editar Tipo de Moneda', visible: true }));

    const modalEl = this.upsertModal.nativeElement;
    if ((window as any).HSOverlay) new (window as any).HSOverlay(modalEl).open();
    else {
      modalEl.classList.remove('hidden');
      modalEl.classList.add('pointer-events-auto');
    }
  }

  openDeleteModal(item: ITipoMoneda) {
    this.edit.set({ ...item });
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

  async upsert(item: ITipoMoneda) {
    if (!item.tipoMonedaId) await this.create(item);
    else await this.update(item);
  }

  async create(item: ITipoMoneda) {
    const { tipoMonedaId, ...payload } = item;
    const resp = await this.tipoMonedaService.createTipoMoneda(payload);
    if (resp?.success) {
      this.fetchData();
      this.closeModal();
      this.edit.set({ ...emptyTipoMoneda });
      this.nuevo.set(true);
    }
  }

  async update(item: ITipoMoneda) {
    const resp = await this.tipoMonedaService.updateTipoMoneda(item);
    if (resp?.success) {
      this.fetchData();
      this.closeModal();
    }
  }

  async delete(item: ITipoMoneda) {
    const resp = await this.tipoMonedaService.deleteTipoMoneda(item.tipoMonedaId || '');
    if (resp?.success) {
      this.fetchData();
      this.closeModal();
      this.edit.set({ ...emptyTipoMoneda });
      this.nuevo.set(true);
    }
  }
}

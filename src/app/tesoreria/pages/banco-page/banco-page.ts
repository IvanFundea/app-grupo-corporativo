import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomIconComponent } from '../../../shared/components/custom-icon/custom-icon.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { BancoService } from '../../../../services/tesoreria/banco.service';
import { IBanco } from '../../../../interfaces/tesoreria';
import { UpsertBancoComponent } from '../../components/upsert-banco/upsert-banco';

const emptyBanco: IBanco = {
  bancoId: '',
  nombre: '',
  nombreCorto: '',
};

@Component({
  selector: 'app-banco-page',
  standalone: true,
  imports: [RouterLink, CustomIconComponent, PaginationComponent, UpsertBancoComponent],
  templateUrl: './banco-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BancoPageComponent {
  bancoService = inject(BancoService);

  bancos = signal<IBanco[]>([]);
  pagination = signal<IPagination>({ page: 1, pageSize: 10, totalItems: 0 });
  buscador = signal('');
  isLoading = signal(false);

  nuevoBanco = signal(true);
  bancoEdit = signal<IBanco>({ ...emptyBanco });
  formKey = signal(Date.now());
  modal = signal({ titulo: 'Crear Banco', visible: false });

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
    const resp = await this.bancoService.getBancos({
      page: this.pagination().page,
      limit: this.pagination().pageSize,
      busqueda: this.buscador(),
    });
    if (resp?.success) {
      this.bancos.set(resp.data || []);
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
    this.bancos.set([]);
    this.pagination.set(newPagination);
    this.fetchData();
  }

  openUpsertModal(nuevo: boolean, banco: IBanco = emptyBanco) {
    this.formKey.set(Date.now());
    this.nuevoBanco.set(nuevo);
    this.bancoEdit.set({ ...banco });
    this.modal.update(m => ({ ...m, titulo: nuevo ? 'Crear Banco' : 'Editar Banco', visible: true }));

    const modalEl = this.upsertModal.nativeElement;
    if ((window as any).HSOverlay) new (window as any).HSOverlay(modalEl).open();
    else {
      modalEl.classList.remove('hidden');
      modalEl.classList.add('pointer-events-auto');
    }
  }

  openDeleteModal(banco: IBanco) {
    this.bancoEdit.set({ ...banco });
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

  async upsertBanco(banco: IBanco) {
    if (!banco.bancoId) await this.createBanco(banco);
    else await this.updateBanco(banco);
  }

  async createBanco(banco: IBanco) {
    const { bancoId, cuentasBancarias, ...payload } = banco;
    const resp = await this.bancoService.createBanco(payload);
    if (resp?.success) {
      this.fetchData();
      this.closeModal();
      this.bancoEdit.set({ ...emptyBanco });
      this.nuevoBanco.set(true);
    }
  }

  async updateBanco(banco: IBanco) {
    const resp = await this.bancoService.updateBanco(banco);
    if (resp?.success) {
      this.fetchData();
      this.closeModal();
    }
  }

  async deleteBanco(banco: IBanco) {
    const resp = await this.bancoService.deleteBanco(banco.bancoId);
    if (resp?.success) {
      this.fetchData();
      this.closeModal();
      this.bancoEdit.set({ ...emptyBanco });
      this.nuevoBanco.set(true);
    }
  }
}

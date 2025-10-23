import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { IConfig, TipoConfiguracion } from '../../../../interfaces/auth';
import { ConfigService } from '../../../../services/auth/config.service';
import { UpsertConfigComponent } from '../../components/upsert-config/upsert-config';

const emptyConfig: IConfig = {
  configId: '',
  llave: '',
  valor: '',
  tipo: TipoConfiguracion.STRING,
  descripcion: '',
  activo: true,
  created_at: new Date(),
};

@Component({
  selector: 'app-configuraciones-page',
  standalone: true,
  imports: [RouterLink, PaginationComponent, UpsertConfigComponent],
  templateUrl: './configuraciones-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ConfiguracionesPageComponent {
  configService = inject(ConfigService);

  configs = signal<IConfig[]>([]);
  isLoading = signal(false);
  buscador = signal('');
  pagination = signal<IPagination>({ page: 1, pageSize: 10, totalItems: 0 });

  nuevoConfig = signal(true);
  configEdit = signal<IConfig>({ ...emptyConfig });
  formKey = signal(Date.now());
  modal = signal({ titulo: 'Crear Configuración', visible: false });

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

  private normalize(t: string): string { return (t || '').toLowerCase(); }
  private filter(list: IConfig[], term: string): IConfig[] {
    const q = this.normalize(term);
    if (!q) return list || [];
    return (list || []).filter(c =>
      this.normalize(c.llave).includes(q) ||
      this.normalize(c.descripcion || '').includes(q) ||
      this.normalize(c.tipo || '').includes(q)
    );
  }

  async fetchData() {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    const resp = await this.configService.getConfigs({ all: true });
    if (resp?.success) {
      const data = resp.data || [];
      this.configs.set(data);
      this.updatePaginationTotals();
      setTimeout(() => (window as any).HSStaticMethods?.autoInit(), 100);
    }
    this.isLoading.set(false);
  }

  getPageSlice(): IConfig[] {
    const filtered = this.filter(this.configs(), this.buscador());
    const { page, pageSize } = this.pagination();
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }

  private updatePaginationTotals() {
    const total = this.filter(this.configs(), this.buscador()).length;
    this.pagination.update(p => ({ ...p, totalItems: total }));
  }

  onSearch(term: string) {
    this.buscador.set(term);
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.updatePaginationTotals();
  }

  onChangePage(p: IPagination) {
    this.pagination.set(p);
  }

  openUpsertModal(nuevo: boolean, cfg: IConfig = emptyConfig) {
    this.formKey.set(Date.now());
    this.nuevoConfig.set(nuevo);
    this.configEdit.set({ ...cfg });
    this.modal.update(m => ({ ...m, titulo: nuevo ? 'Crear Configuración' : 'Editar Configuración', visible: true }));

    const modalEl = this.upsertModal.nativeElement;
    if ((window as any).HSOverlay) new (window as any).HSOverlay(modalEl).open();
    else {
      modalEl.classList.remove('hidden');
      modalEl.classList.add('pointer-events-auto');
    }
  }

  openCreate() { this.openUpsertModal(true, { ...emptyConfig }); }

  openDeleteModal(cfg: IConfig) {
    this.configEdit.set({ ...cfg });
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

  async upsertConfig(cfg: IConfig) {
    if (!cfg.configId) await this.createConfig(cfg);
    else await this.updateConfig(cfg);
  }

  async createConfig(cfg: IConfig) {
    const { configId, created_at, updated_at, deleted_at, ...payload } = cfg as any;
    const resp = await this.configService.createConfig(payload);
    if (resp?.success) {
      await this.fetchData();
      this.closeModal();
      this.configEdit.set({ ...emptyConfig });
      this.nuevoConfig.set(true);
    }
  }

  async updateConfig(cfg: IConfig) {
    const resp = await this.configService.updateConfig(cfg.configId || '', {
      llave: cfg.llave,
      tipo: cfg.tipo,
      valor: cfg.valor,
      descripcion: cfg.descripcion,
      activo: cfg.activo,
    });
    if (resp?.success) {
      await this.fetchData();
      this.closeModal();
    }
  }

  async deleteConfig(cfg: IConfig) {
    const resp = await this.configService.deleteConfig(cfg.configId || '');
    if (resp?.success) {
      await this.fetchData();
      this.closeModal();
      this.configEdit.set({ ...emptyConfig });
      this.nuevoConfig.set(true);
    }
  }

  onToggleActivo(cfg: IConfig, activo: boolean) {
    const updated: IConfig = { ...cfg, activo } as IConfig;
    this.updateConfig(updated);
  }
}

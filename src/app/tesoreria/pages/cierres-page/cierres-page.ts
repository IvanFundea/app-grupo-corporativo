import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CustomIconComponent } from '../../../shared/components/custom-icon/custom-icon.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { LogCierres } from '../../../../interfaces/tesoreria';
import { LogCierresService } from '../../../../services/tesoreria/log-cierres.service';
import { AuthService } from '../../../../services/auth/auth.service';
import { ConfigService } from '../../../../services/auth/config.service';

@Component({
  selector: 'app-cierres-page',
  standalone: true,
  imports: [RouterLink, DatePipe, CustomIconComponent, PaginationComponent, DatePipe],
  templateUrl: './cierres-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CierresPageComponent {
  private service = inject(LogCierresService);
  private configService = inject(ConfigService);
  private auth = inject(AuthService);

  fechaApertura = signal<Date>(new Date());
  nuevaFechaApertura = signal<Date>(new Date());

  list = signal<LogCierres[]>([]);
  pagination = signal<IPagination>({ page: 1, pageSize: 10, totalItems: 0 });
  isLoading = signal(false);

  @ViewChild('confirmModal', { static: true }) confirmModal!: ElementRef<HTMLDivElement>;

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
    const resp = await this.service.findAll({ page: this.pagination().page, limit: this.pagination().pageSize });
    if (resp?.success) {
      this.list.set(resp.data || []);
      if (resp.metadata) this.pagination.update(p => ({ ...p, totalItems: resp.metadata?.total || 0 }));
      setTimeout(() => (window as any).HSStaticMethods?.autoInit(), 100);
    }
    this.isLoading.set(false);
    this.obtenerFechaApertura();
  }

  async obtenerFechaApertura(){
    let resp = await this.configService.getConfigPorLlave('fecha_apertura');
    if (resp?.success) {
      const valor = resp?.data?.valor;
      if (typeof valor === 'string') {
        const posibleFecha = new Date(valor + 'T00:00:00');
        if (!isNaN(posibleFecha.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
          // Si valor es una fecha ISO (YYYY-MM-DD), usarla como fecha seleccionada
          this.fechaApertura.set(posibleFecha);
          // La nueva fecha apertura es la fechaApertura + 1 día
          const nuevaFecha = new Date(posibleFecha);
          nuevaFecha.setDate(nuevaFecha.getDate() + 1);
          this.nuevaFechaApertura.set(nuevaFecha);
        } 
      } 
    }
  }

  onChangePage(newPagination: IPagination) {
    this.list.set([]);
    this.pagination.set(newPagination);
    this.fetchData();
  }

  openConfirmModal() {
    const modalEl = this.confirmModal.nativeElement;
    if ((window as any).HSOverlay) new (window as any).HSOverlay(modalEl).open();
    else {
      modalEl.classList.remove('hidden');
      modalEl.classList.add('pointer-events-auto');
    }
  }

  closeModal() {
    const modalEl = this.confirmModal.nativeElement;
    if ((window as any).HSOverlay) (window as any).HSOverlay.close(modalEl);
    else {
      modalEl.classList.add('hidden');
      modalEl.classList.remove('open', 'pointer-events-auto');
    }
  }

  async confirmarCierre() {
    const usuario = this.auth.getUserStorage()?.userName || 'desconocido';
    const resp = await this.service.create(usuario);
    if (resp?.success) {
      await this.fetchData();
      this.closeModal();
    }
  }
}

import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomIconComponent } from '../../../shared/components/custom-icon/custom-icon.component';
import { IPuesto, IRol } from '../../../../interfaces/auth';
import { ToastrService } from 'ngx-toastr';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { PuestoService } from '../../../../services/auth/puesto.service';
import { UpsertPuestoComponent } from '../../components/upsert-puesto/upsert-puesto.component';

const emptyPuesto: IPuesto = {
  puestoId: '',
  nombre: ''
}

@Component({
  selector: 'app-puesto-page',
  imports: [RouterLink, CustomIconComponent, PaginationComponent, UpsertPuestoComponent],
  templateUrl: './puesto-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PuestoPageComponent {
  puestoService = inject(PuestoService);
  puestosList = signal<IPuesto[]>([]);
  metadata = signal({});
  nuevoPuesto = signal(true);
  puestoEdit = signal<IPuesto>({
    puestoId: '',
    nombre: '',
  });

  pagination = signal<IPagination>({
    page: 1,
    pageSize: 10,
    totalItems: 0
  });

  isLoading = signal(false);
  formKey = signal(Date.now());
  modal = signal({
    titulo: 'Crear Puesto',
    visible: false,
    boton: 'Guardar Puesto'
  });

  buscador = signal('');

  // Para usar Math en el template
  Math = Math;

  // Referencia al contenedor del modal
  @ViewChild('upsertModal', { static: true }) upsertModal!: ElementRef<HTMLDivElement>;
  @ViewChild('deleteModal', { static: true }) deleteModal!: ElementRef<HTMLDivElement>;

  constructor(private toastr: ToastrService) { }

  async ngOnInit() {

    this.puestosList.set([]); // Cargar puestos para el select
    this.fetchData();
  }

  ngAfterViewInit() {
    // Inicializar Preline después de que la vista esté lista
    this.initializePreline();
  }

  private initializePreline() {
    if (typeof window !== 'undefined' && (window as any).HSStaticMethods) {
      setTimeout(() => {
        (window as any).HSStaticMethods.autoInit();
        console.log('Preline initialized');
      }, 100);
    }
  }


  async fetchData() {
    if (this.isLoading()) return;

    this.isLoading.set(true);
    const response = await this.puestoService.getPuestos({
      page: this.pagination().page,
      limit: this.pagination().pageSize,
      busqueda: this.buscador()
    });

    if (response?.success) {
      this.puestosList.set(response.data);
      if (response.metadata) {
        this.pagination.update(p => ({
          ...p,
          totalItems: response.metadata?.total || 0
        }));
      }
      // Espera un ciclo de renderizado antes de reinicializar Preline
      setTimeout(() => {
        if ((window as any).HSStaticMethods) {
          (window as any).HSStaticMethods.autoInit();
          console.log('✅ Preline reloaded after data fetch');
        }
      }, 100);
    }
    this.isLoading.set(false);

  }

  onSearch(searchTerm: string) {
    this.buscador.set(searchTerm);
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.fetchData();
  }

  onPageChange(page: number) {
    this.pagination.update(p => ({ ...p, page }));
    this.fetchData();
  }
  /**
 * Alterna el estado activo/inactivo de un rol
 */
  async toggleRolStatus(rol: IRol, status: boolean) {
    const updatedRol: IRol = {
      ...rol,
      activo: status
    };
    this.updatePuesto(updatedRol);
  }

  onChangePage(newPagination: IPagination) {
    this.puestosList.set([]); // Limpiamos la lista antes de cargar nuevos datos
    this.pagination.set(newPagination);
    this.fetchData();
  }

  openUpsertModal(nuevo: boolean, puesto: IPuesto = emptyPuesto) {
    console.log('🟦 Abriendo modal...');

    this.formKey.set(Date.now());
    this.nuevoPuesto.set(nuevo);
    this.puestoEdit.set({ ...puesto });

    this.modal.update(m => ({
      ...m,
      titulo: nuevo ? 'Crear Puesto' : 'Editar Puesto',
      boton: nuevo ? 'Crear Puesto' : 'Actualizar Puesto',
      visible: true
    }));

    const modalEl = this.upsertModal.nativeElement;

    // Si Preline está cargado correctamente:
    if ((window as any).HSOverlay) {
      new (window as any).HSOverlay(modalEl).open();
    } else {
      // Fallback manual si HSOverlay no existe
      modalEl.classList.remove('hidden');
      modalEl.classList.add('pointer-events-auto');
    }
  }


  openDeleteModal(puesto: IPuesto) {
    this.puestoEdit.set({ ...puesto });
    const modalEl = this.deleteModal.nativeElement;

    // Si Preline está cargado correctamente:
    if ((window as any).HSOverlay) {
      new (window as any).HSOverlay(modalEl).open();
    } else {
      // Fallback manual si HSOverlay no existe
      modalEl.classList.remove('hidden');
      modalEl.classList.add('pointer-events-auto');
    }
  }

  /** Cierra el modal */
  closeModal() {
    console.log('🔴 Cerrando modal...');
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

  async upsertPuesto(puesto: IPuesto) {
    if (!puesto.puestoId) {
      this.createPuesto(puesto);
    } else {
      this.updatePuesto(puesto);
    }
  }


  async createPuesto(puesto: IPuesto) {
    let resp = await this.puestoService.createPuesto(puesto)
    if (resp?.success) {
      this.fetchData()
      this.closeModal();
      this.puestoEdit.set(emptyPuesto)
      this.nuevoPuesto.set(true); // Reseteamos el estado de nuevo puesto
    }
  }

  async updatePuesto(puesto: IPuesto) {
    let resp = await this.puestoService.updatePuesto(puesto)
    if (resp?.success) {
      this.fetchData()
      this.closeModal();
    }
  }


  async deletePuesto(puesto: IPuesto) {
    const response = await this.puestoService.deletePuesto(puesto.puestoId || '');
    if (response?.success) {
      this.fetchData();
      this.closeModal();
      this.puestoEdit.set(emptyPuesto);
      this.nuevoPuesto.set(true); // Reseteamos el estado de nuevo puesto
    }
  }

}

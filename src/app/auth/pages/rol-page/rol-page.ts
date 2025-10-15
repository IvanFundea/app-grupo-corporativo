import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomIconComponent } from '../../../shared/components/custom-icon/custom-icon.component';
import { IEmpresa } from '../../../../interfaces/tesoreria';
import { RolService } from '../../../../services/auth/rol.service';
import { IRol } from '../../../../interfaces/auth';
import { DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { of } from 'rxjs';
import { UpsertRolComponent } from '../../components/upsert-rol/upsert-rol';

const emptyRol: IRol = {
  rolId: '',
  nombre: '',
  invitado: false,
  esAdmin: false,
  activo: true,
  created_at: new Date(),
}

@Component({
  selector: 'app-rol-page',
  imports: [RouterLink, CustomIconComponent, DatePipe, PaginationComponent, UpsertRolComponent],
  templateUrl: './rol-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RolPageComponent {
  rolService = inject(RolService);
  rolesList = signal<IRol[]>([]);
  metadata = signal({});
  nuevoRol = signal(true);
  rolEdit = signal<IRol>({
    rolId: '',
    nombre: '',
    invitado: false,
    esAdmin: false,
    activo: true,
    created_at: new Date(),
  });

  pagination = signal<IPagination>({
    page: 1,
    pageSize: 10,
    totalItems: 0
  });

  isLoading = signal(false);
  formKey = signal(Date.now());
  modal = signal({
    titulo: 'Crear Rol',
    visible: false,
    boton: 'Guardar Rol'
  });

  buscador = signal('');

  // Para usar Math en el template
  Math = Math;

  // Referencia al contenedor del modal
  @ViewChild('upsertModal', { static: true }) upsertModal!: ElementRef<HTMLDivElement>;
  @ViewChild('deleteModal', { static: true }) deleteModal!: ElementRef<HTMLDivElement>;

  constructor(private toastr: ToastrService) { }

  async ngOnInit() {

    this.rolesList.set([]); // Cargar roles para el select
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
    const response = await this.rolService.getRoles({
      page: this.pagination().page,
      limit: this.pagination().pageSize,
      busqueda: this.buscador()
    });

    if (response?.success) {
      this.rolesList.set(response.data);
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
    this.updateRol(updatedRol);
  }

  onChangePage(newPagination: IPagination) {
    this.rolesList.set([]); // Limpiamos la lista antes de cargar nuevos datos
    this.pagination.set(newPagination);
    this.fetchData();
  }

  openUpsertModal(nuevo: boolean, rol: IRol = emptyRol) {
    console.log('🟦 Abriendo modal...');

    this.formKey.set(Date.now());
    this.nuevoRol.set(nuevo);
    this.rolEdit.set({ ...rol });

    this.modal.update(m => ({
      ...m,
      titulo: nuevo ? 'Crear Rol' : 'Editar Rol',
      boton: nuevo ? 'Crear Rol' : 'Actualizar Rol',
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


  openDeleteModal(rol: IRol) {
    this.rolEdit.set({ ...rol });
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

  async upsertRol(rol: IRol) {
    if (!rol.rolId) {
      this.createRol(rol);
    } else {
      this.updateRol(rol);
    }
  }


  async createRol(rol: IRol) {
    let resp = await this.rolService.createRol(rol)
    if (resp?.success) {
      this.fetchData()
      this.closeModal();
      this.rolEdit.set(emptyRol)
      this.nuevoRol.set(true); // Reseteamos el estado de nuevo rol
    }
  }

  async updateRol(rol: IRol) {
    let resp = await this.rolService.updateRol(rol)
    if (resp?.success) {
      this.fetchData()
      this.closeModal();
    }
  }


  async deleteRol(rol: IRol) {
    const response = await this.rolService.deleteRol(rol.rolId || '');
    if (response?.success) {
      this.fetchData();
      this.closeModal();
      this.rolEdit.set(emptyRol);
      this.nuevoRol.set(true); // Reseteamos el estado de nuevo rol
    }
  }

}

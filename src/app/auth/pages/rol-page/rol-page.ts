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
    pageSize: 5,
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
      setTimeout(() => {
        (window as any).HSStaticMethods.autoInit();
        console.log('Preline reloaded');
      }, 500);
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

  async deleteRol(rol: IRol) {
    if (confirm(`¿Está seguro de eliminar el rol "${rol.nombre}"?`)) {
      const response = await this.rolService.deleteRol(rol.rolId || '');
      if (response?.success) {
        this.fetchData();
      }
    }
  }

  updateRolField(field: keyof IRol, value: any) {
    this.rolEdit.update(rol => ({
      ...rol,
      [field]: value
    }));
  }

  /**
 * Alterna el estado activo/inactivo de un rol
 */
  async toggleRolStatus(rol: IRol, status: boolean) {
    try {
      // Crear una copia del rol con el estado invertido
      const updatedRol: IRol = {
        ...rol,
        activo: status
      };

      // Llamar al servicio para actualizar
      const response = await this.rolService.updateRol(updatedRol);

      if (response?.success) {
        // Actualizar la lista local
        this.rolesList.update(roles =>
          roles.map(r =>
            r.rolId === rol.rolId
              ? { ...r, activo: !r.activo }
              : r
          )
        );
      } else {
        this.toastr.error('Error al actualizar el estado del rol', 'Error');
      }
    } catch (error) {
      console.error('Error updating rol status:', error);
      this.toastr.error('Error al actualizar el estado del rol', 'Error');
    }
  }
  onChangePage(newPagination: IPagination) {
    this.rolesList.set([]); // Limpiamos la lista antes de cargar nuevos datos
    this.pagination.set(newPagination);
    this.fetchData();
  }

  /** Abre el modal de Preline manualmente */
  openUpsertModal(nuevo: boolean, rol: IRol = emptyRol) {
    console.log("🚀 ~ RolPageComponent ~ openUpsertModal ~ rol:", rol)
    console.log("🚀 ~ RolPageComponent ~ openUpsertModal ~ nuevo:", nuevo)
    console.log('🟦 Abriendo modal...');
    console.log('🟦 Abriendo modal...');
    
    this.formKey.set(Date.now());
    this.nuevoRol.set(nuevo);
    this.rolEdit.set({ ...rol }); // Asegurarse de crear una nueva referencia
    this.modal.update(m => ({
      ...m,
      titulo: nuevo ? 'Crear Rol' : 'Editar Rol',
      boton: nuevo ? 'Crear Rol' : 'Actualizar Rol',
      visible: true
    }));
  }

  /** Cierra el modal */
  closeModal() {
    console.log('🔴 Cerrando modal...');
    const modalEl = this.upsertModal.nativeElement;

    if ((window as any).HSOverlay) {
      (window as any).HSOverlay.close(modalEl);
    } else {
      modalEl.classList.add('hidden');
      modalEl.classList.remove('open', 'pointer-events-auto');
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

}

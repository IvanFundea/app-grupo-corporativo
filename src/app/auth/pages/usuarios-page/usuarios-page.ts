import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { UsuariosService } from '../../../../services/auth/usuarios.service';
import { IUsuario, IRol, IPuesto } from '../../../../interfaces/auth';
import { UpsertUsuarioComponent } from '../../components/upsert-usuario/upsert-usuario';
import { RolService } from '../../../../services/auth/rol.service';
import { PuestoService } from '../../../../services/auth/puesto.service';
import { CustomIconComponent } from '../../../shared/components/custom-icon/custom-icon.component';

const emptyUsuario: IUsuario = {
  usuarioId: '',
  nombreCompleto: '',
  nombre1: '',
  apellido1: '',
  userName: '',
  clave: '',
  correo: '',
  lastPasswordUpdate: new Date(),
  activo: true,
  rolId: '',
  puestoId: '',
  created_at: new Date(),
};

@Component({
  selector: 'app-usuarios-page',
  imports: [RouterLink, PaginationComponent, UpsertUsuarioComponent, CustomIconComponent],
  templateUrl: './usuarios-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class UsuariosPageComponent {
  usuariosService = inject(UsuariosService);
  rolService = inject(RolService);
  puestoService = inject(PuestoService);

  usuariosList = signal<IUsuario[]>([]);
  rolesList = signal<IRol[]>([]);
  puestosList = signal<IPuesto[]>([]);

  pagination = signal<IPagination>({ page: 1, pageSize: 10, totalItems: 0 });
  isLoading = signal(false);
  buscador = signal('');

  nuevoUsuario = signal(true);
  usuarioEdit = signal<IUsuario>({ ...emptyUsuario });

  formKey = signal(Date.now());
  modal = signal({ titulo: 'Crear Usuario', visible: false });

  @ViewChild('upsertModal', { static: true }) upsertModal!: ElementRef<HTMLDivElement>;
  @ViewChild('deleteModal', { static: true }) deleteModal!: ElementRef<HTMLDivElement>;

  async ngOnInit() {
    await this.fetchRolesYPuestos();
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

  async fetchRolesYPuestos() {
    const [rolesResp, puestosResp] = await Promise.all([
      this.rolService.getRoles({ all: true }),
      this.puestoService.getPuestos({ all: true })
    ]);
    if (rolesResp?.success) this.rolesList.set(rolesResp.data || []);
    if (puestosResp?.success) this.puestosList.set(puestosResp.data || []);
  }

  async fetchData() {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    const resp = await this.usuariosService.getUsuarios({
      page: this.pagination().page,
      limit: this.pagination().pageSize,
      busqueda: this.buscador()
    });
    if (resp?.success) {
      this.usuariosList.set(resp.data || []);
      if (resp.metadata) {
        this.pagination.update(p => ({ ...p, totalItems: resp.metadata?.total || 0 }));
      }
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
    this.usuariosList.set([]);
    this.pagination.set(newPagination);
    this.fetchData();
  }

  openUpsertModal(nuevo: boolean, usuario: IUsuario = emptyUsuario) {
    this.formKey.set(Date.now());
    this.nuevoUsuario.set(nuevo);
    this.usuarioEdit.set({ ...usuario });
    this.modal.update(m => ({ ...m, titulo: nuevo ? 'Crear Usuario' : 'Editar Usuario', visible: true }));

    const modalEl = this.upsertModal.nativeElement;
    if ((window as any).HSOverlay) new (window as any).HSOverlay(modalEl).open();
    else {
      modalEl.classList.remove('hidden');
      modalEl.classList.add('pointer-events-auto');
    }
  }

  openDeleteModal(usuario: IUsuario) {
    this.usuarioEdit.set({ ...usuario });
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

  async upsertUsuario(usuario: IUsuario) {
    if (!usuario.usuarioId) await this.createUsuario(usuario);
    else await this.updateUsuario(usuario);
  }

  async createUsuario(usuario: IUsuario) {
    const { usuarioId, created_at, updated_at, deleted_at, ...payload } = usuario;
    const resp = await this.usuariosService.createUsuario(payload as any);
    if (resp?.success) {
      this.fetchData();
      this.closeModal();
      this.usuarioEdit.set({ ...emptyUsuario });
      this.nuevoUsuario.set(true);
    }
  }

  async updateUsuario(usuario: IUsuario) {
    const resp = await this.usuariosService.updateUsuario(usuario);
    if (resp?.success) {
      this.fetchData();
      this.closeModal();
    }
  }

  async deleteUsuario(usuario: IUsuario) {
    const resp = await this.usuariosService.deleteUsuario(usuario.usuarioId || '');
    if (resp?.success) {
      this.fetchData();
      this.closeModal();
      this.usuarioEdit.set({ ...emptyUsuario });
      this.nuevoUsuario.set(true);
    }
  }

  // Helpers para el template (evitar arrow functions en expresiones)
  getRolName(rolId: string): string {
    const r = (this.rolesList() || []).find(r => r.rolId === rolId);
    return r?.nombre ?? '-';
  }

  getPuestoName(puestoId?: string | null): string {
    if (!puestoId) return '-';
    const p = (this.puestosList() || []).find(p => p.puestoId === puestoId);
    return p?.nombre ?? '-';
  }

   /**
 * Alterna el estado activo/inactivo de un usuario
 */
  async toggleStatus(usuario: IUsuario, status: boolean) {
    const updatedUsuario: IUsuario = {
      ...usuario,
      activo: status
    };
    this.updateUsuario(updatedUsuario);
  }
}

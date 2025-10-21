import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomIconComponent } from '../../../shared/components/custom-icon/custom-icon.component';
import { EmpresaService } from '../../../../services/tesoreria/empresa.service';
import { UsuariosService } from '../../../../services/auth/usuarios.service';
import { AuthService } from '../../../../services/auth/auth.service';
import { IEmpresa } from '../../../../interfaces/tesoreria';
import { IUsuario } from '../../../../interfaces/auth';

@Component({
  selector: 'app-asignar-contadores-page',
  standalone: true,
  imports: [RouterLink, CustomIconComponent],
  templateUrl: './asignar-contadores.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AsignarContadoresPageComponent {
  private empresaService = inject(EmpresaService);
  private usuariosService = inject(UsuariosService);
  private authService = inject(AuthService);

  // Data
  empresas = signal<IEmpresa[]>([]);
  usuariosAsignados = signal<IUsuario[]>([]);
  usuariosDisponibles = signal<IUsuario[]>([]);

  // UI state
  selectedEmpresaId = signal<string>('');
  selectedUsuarioId = signal<string>('');
  isLoading = signal<boolean>(false);

  async ngOnInit() {
    await this.loadEmpresas();
  }

  // Helpers
  get selectedEmpresaNombre(): string {
    const emp = (this.empresas() || []).find(e => e.empresaId === this.selectedEmpresaId());
    return emp ? emp.nombre : '';
  }

  async loadEmpresas() {
    const resp = await this.empresaService.getEmpresas({ all: true });
    if (resp?.success) this.empresas.set(resp.data || []);
  }

  async onEmpresaChange(empresaId: string) {
    this.selectedEmpresaId.set(empresaId);
    this.selectedUsuarioId.set('');
    if (!empresaId) {
      this.usuariosAsignados.set([]);
      this.usuariosDisponibles.set([]);
      return;
    }
    await this.refreshAsignaciones();
  }

  private async refreshAsignaciones() {
    const empresaId = this.selectedEmpresaId();
    if (!empresaId) return;

    this.isLoading.set(true);
    const [asigResp, allUsersResp] = await Promise.all([
      this.empresaService.listarUsuariosAsignados(empresaId),
      //Solo listamos a los contadores
      this.usuariosService.getUsuarios({ all: true, puestoNombre:'Contador' })
    ]);

    const asignados = asigResp?.data || [];
    const todos = allUsersResp?.data || [];

    this.usuariosAsignados.set(asignados);

    const asignadosIds = new Set(asignados.map(u => u.usuarioId || ''));
    const disponibles = todos.filter(u => !asignadosIds.has(u.usuarioId || ''));
    this.usuariosDisponibles.set(disponibles);
    this.isLoading.set(false);
  }

  async asignarUsuario() {
    const empresaId = this.selectedEmpresaId();
    const usuarioId = this.selectedUsuarioId();
    if (!empresaId || !usuarioId) return;

    const userName = this.authService.getUserStorage().userName || 'sistema';
    const resp = await this.empresaService.asignarUsuario(empresaId, {
      usuarioId,
      asignar: true,
      usuarioModifica: userName,
    });
    if (resp?.success) {
      this.selectedUsuarioId.set('');
      await this.refreshAsignaciones();
    }
  }

  async desasignarUsuario(usuario: IUsuario) {
    const empresaId = this.selectedEmpresaId();
    if (!empresaId || !usuario?.usuarioId) return;

    const userName = this.authService.getUserStorage().userName || 'sistema';
    const resp = await this.empresaService.asignarUsuario(empresaId, {
      usuarioId: usuario.usuarioId,
      asignar: false,
      usuarioModifica: userName,
    });
    if (resp?.success) {
      await this.refreshAsignaciones();
    }
  }
}

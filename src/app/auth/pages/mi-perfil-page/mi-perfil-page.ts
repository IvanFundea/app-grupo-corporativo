import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../services/auth/auth.service';
import { UpsertUsuarioComponent } from '../../components/upsert-usuario/upsert-usuario';
import { UsuariosService } from '../../../../services/auth/usuarios.service';
import { RolService } from '../../../../services/auth/rol.service';
import { PuestoService } from '../../../../services/auth/puesto.service';
import { IRol, IPuesto } from '../../../../interfaces/auth';

@Component({
  selector: 'app-mi-perfil-page',
  standalone: true,
  imports: [CommonModule, RouterLink, UpsertUsuarioComponent],
  templateUrl: './mi-perfil-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MiPerfilPageComponent {
  private auth = inject(AuthService);
  private usuariosService = inject(UsuariosService);
  private rolService = inject(RolService);
  private puestoService = inject(PuestoService);

  user = this.auth.user; // signal readonly
  isEditing = signal(false);
  formKey = signal(Date.now());
  roles = signal<IRol[]>([]);
  puestos = signal<IPuesto[]>([]);

  // Password modal signals
  showPwdModal = signal(false);
  pwdCurrent = signal('');
  pwdNew = signal('');
  pwdConfirm = signal('');
  pwdLoading = signal(false);

  @ViewChild('upsertModal', { static: true }) upsertModal!: ElementRef<HTMLDivElement>;
  @ViewChild('passwordModal', { static: true }) passwordModal!: ElementRef<HTMLDivElement>;
  @ViewChild('photoInput', { static: false }) photoInput!: ElementRef<HTMLInputElement>;

  async ngOnInit() {
    // Cargar roles y puestos para el modal de edición del perfil
    const [r, p] = await Promise.all([
      this.rolService.getRoles({ all: true }),
      this.puestoService.getPuestos({ all: true })
    ]);
    if (r?.success) this.roles.set(r.data || []);
    if (p?.success) this.puestos.set(p.data || []);
  }

  onChangePhotoClick() {
    if (this.photoInput) this.photoInput.nativeElement.click();
  }

  async onPhotoSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    // Validar tipo simple en frontend
    if (!/^image\/(png|jpeg|jpg)$/.test(file.type)) {
      alert('Formato no permitido. Solo PNG/JPG/JPEG');
      input.value = '';
      return;
    }
    // Tamaño máximo 5MB coherente con backend
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo supera 5MB');
      input.value = '';
      return;
    }
    const userName = this.user()?.userName || '';
    if (!userName) return;
    const resp = await this.usuariosService.uploadPerfil(file, userName);
    if (resp?.success && resp.data?.filename) {
      // Guardamos solo el filename en fotoUrl para usar el endpoint /auth/usuarios/perfil/:fileName
      const filename = resp.data.filename;
      const updatedTemp = { ...this.user(), fotoUrl: filename } as any;
      await this.auth.fetchAndApplyUserPhoto(updatedTemp); // descarga y cachea como dataURL
    }
    input.value = '';
  }

  get avatarUrl(): string {
    const u = this.user();
    return u?.fotoUrl || 'images/user-default.png';
  }

  openEdit() {
    this.formKey.set(Date.now());
    this.isEditing.set(true);
    const el = this.upsertModal?.nativeElement;
    if (el) {
      if ((window as any).HSOverlay) new (window as any).HSOverlay(el).open();
      else { el.classList.remove('hidden'); el.classList.add('pointer-events-auto'); }
    }
  }

  closeModals() {
    const el1 = this.upsertModal?.nativeElement;
    const el2 = this.passwordModal?.nativeElement;
    if ((window as any).HSOverlay) {
      if (el1) (window as any).HSOverlay.close(el1);
      if (el2) (window as any).HSOverlay.close(el2);
    } else {
      if (el1) { el1.classList.add('hidden'); el1.classList.remove('open', 'pointer-events-auto'); }
      if (el2) { el2.classList.add('hidden'); el2.classList.remove('open', 'pointer-events-auto'); }
    }
    this.isEditing.set(false);
    this.showPwdModal.set(false);
  }

  openPasswordModal() {
    this.pwdCurrent.set('');
    this.pwdNew.set('');
    this.pwdConfirm.set('');
    this.showPwdModal.set(true);
    const el = this.passwordModal?.nativeElement;
    if (el) {
      if ((window as any).HSOverlay) new (window as any).HSOverlay(el).open();
      else { el.classList.remove('hidden'); el.classList.add('pointer-events-auto'); }
    }
  }

  async onSaveUsuario(u: any) {
    // Reutilizamos el flujo normal de usuarios para update
    const resp = await this.usuariosService.updateUsuario({ ...this.user(), ...u });
    if (resp?.success && resp.data) {
      // Si el backend no devuelve el objeto rol completo, lo enriquecemos localmente
      const updated = { ...resp.data } as any;
      if (!updated.rol && updated.rolId) {
        const r = (this.roles() || []).find(x => x.rolId === updated.rolId);
        if (r) updated.rol = r;
      }
      if (!updated.puesto && updated.puestoId) {
        const p = (this.puestos() || []).find(x => x.puestoId === updated.puestoId);
        if (p) updated.puesto = p;
      }
      // Actualizar AuthService para reflejar cambios en header
      this.auth.updateUser(updated);
      this.closeModals();
    }
  }

  onCancelUsuario() { this.closeModals(); }

  async onChangePassword() {
    const current = this.pwdCurrent().trim();
    const next = this.pwdNew().trim();
    const confirm = this.pwdConfirm().trim();

    if (!current || !next || !confirm) return;
    if (next.length < 6) return; // validación mínima
    if (next !== confirm) return;

    this.pwdLoading.set(true);
    try {
      const userId = this.user()?.usuarioId || '';
  const resp = await this.usuariosService.cambiarClave(userId, current, next);
      if (resp?.success) {
        // Actualizar marca de tiempo local del último cambio
        const updated = { ...this.user(), lastPasswordUpdate: new Date() } as any;
        this.auth.updateUser(updated);
        this.closeModals();
      }
    } finally {
      this.pwdLoading.set(false);
    }
  }
}

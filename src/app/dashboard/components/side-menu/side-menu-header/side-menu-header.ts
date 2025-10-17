import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { AuthService } from '../../../../../services/auth/auth.service';
import { Router } from '@angular/router';
import { CustomIconComponent } from '../../../../shared/components/custom-icon/custom-icon.component';

@Component({
  selector: 'app-side-menu-header',
  imports: [CustomIconComponent],
  templateUrl: './side-menu-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideMenuHeaderComponent {

  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  conFoto = signal(false)
  public router = inject(Router)

  // esto es un signal reactivo
  public user = this.authService.user;

  constructor() {
    this.actualizarFoto();
  }

  async actualizarFoto() {
    if (!this.user()?.usuarioId) return;

    // const nuevaFotoUrl = await this.fotoPerfilService.descargarFotoUsuario(this.user().usuarioId);
    // if (nuevaFotoUrl) {
    //   this.conFoto.set(true);
    //   const updatedUser = { ...this.user()!, photoUrl: nuevaFotoUrl };
    //   this.authService.updateUser(updatedUser); // 🔑 sincroniza signal
    //   this.cdr.detectChanges();
    // }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

}

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../services/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LoginComponent { 

  public authService = inject(AuthService);  
  // public userAliado = this.authService.getUserStorage();
  public router = inject(Router)

  userName = signal('');
  password = signal('');

  errorObj = signal<{ message: string; code: number, isError: boolean }>({
    message: '',
    code: 0,
    isError: false
  });

  loading = signal(false);

  onSubmit(event: Event) {
    event.preventDefault();
    if (!this.loading()) {
      this.login();
    }
  }

  async login() {
    // Evitar múltiples envíos mientras está cargando
    if (this.loading()) return;

    if(this.userName().trim() === '' || this.password().trim() === '') {
      this.errorObj.set({
        message: 'Por favor ingrese usuario y contraseña.',
        code: 400,
        isError: true
      });
      return;
    }

    try {
      this.loading.set(true);
      this.errorObj.set({
        message: '',
        code: 0,
        isError: false
      })

      let authData = await  this.authService.login({ userName: this.userName(), password: this.password() })
      if(authData && authData.success) {
        localStorage.setItem('token', authData?.data.token || '');
        localStorage.setItem('usuario', JSON.stringify(authData?.data.user || {}));

        this.errorObj.set({
          message: '',
          code: 0,
          isError: false
        });
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      } else {
        this.loading.set(false);
        this.errorObj.set({
          message: authData?.message || 'Login failed',
          code: 401,
          isError: true
        });
      }

    } catch (error: any) {
      this.loading.set(false);
      console.error('Login failed:', error);
      this.errorObj.set({
        message: error?.error?.message || 'No se pudo iniciar sesión. Inténtalo de nuevo.',
        code: 500,
        isError: true,
      });
    }
  }

}

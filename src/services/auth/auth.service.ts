import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpService } from '../HttpService';
import { firstValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ApiResponse } from '../../interfaces/api-response';
import { ILogin, IUsuario } from '../../interfaces/auth';

type LoginResponse = ApiResponse<ILogin>;

@Injectable({ providedIn: 'root' })
export class AuthService extends HttpService {
  private readonly endpoints = {
    login: '/auth/login',
    usuarios: '/auth/usuarios',
  };

  // Signal para el estado del usuario
  private _user = signal<IUsuario>(this.loadUserFromStorage());
  public user = this._user.asReadonly();

  constructor(http: HttpClient, private toastr: ToastrService) {
    super(http);
  }

  /** Cargar usuario desde localStorage (si existe) */
  private loadUserFromStorage(): IUsuario {
    const user = localStorage.getItem('user');
    if (user) return JSON.parse(user);

    // Usuario "vacío"
    return {
      usuarioId: '',
      nombreCompleto: 'Sin autenticar',
      userName: '',
      nombre1: '',
      nombre2: '',
      nombre3: '',
      apellido1: '',
      apellido2: '',
      apellido3: '',
      clave: '',
      correo: '',
      fotoUrl: '',
      lastPasswordUpdate: new Date(),
      huella: null,
      activo: false,
      rolId: '',
      puestoId: null,
      // metodoId: null,
      created_at: new Date(),
      rol: {
        rolId: '',
        nombre: 'Sin autenticar',
        activo: false,
        invitado: false,
        esAdmin: false,
        created_at: new Date()
      }
    };
  }


  /** Obtener snapshot del usuario actual */
  getUserStorage(): IUsuario {
    return this._user();
  }

  /** Actualizar usuario en memoria y storage */
  updateUser(user: IUsuario) {
    this._user.set(user);
    localStorage.setItem('user', JSON.stringify(user));
  }

  get token(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  async login(data: { userName: string; password: string }): Promise<LoginResponse | null> {
    try {
      const resp = await firstValueFrom(this.post<LoginResponse>(this.endpoints.login, data));
      if (resp.body?.success) {
        if (resp.body.data.user) {
          this.updateUser(resp.body.data.user);
        }
        return resp.body;
      }
      return null;
    } catch (error: any) {
      console.log("🚀 ~ UsuariosService ~ login ~ error:", error)
      this.toastr.error(error?.error?.message || 'Error al iniciar sesión', 'Error');
      return null;
    }
  }

  logout(message: string = '') {
    if (message) {
      this.toastr.error(message, 'Sesión cerrada');
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('accesos');

    // Resetear signal del usuario
    this._user.set(this.loadUserFromStorage());
  }
}

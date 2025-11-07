import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HttpService } from '../HttpService';
import { firstValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ApiResponse } from '../../interfaces/api-response';
import { IAcceso, ILogin, IUsuario } from '../../interfaces/auth';
import { environment } from '../../environments/environment';

type LoginResponse = ApiResponse<ILogin>;

@Injectable({ providedIn: 'root' })
export class AuthService extends HttpService {
  private readonly endpoints = {
    login: '/auth/login',
    verifyToken: '/auth/verify-token',
    usuarios: '/auth/usuarios',
  };

  // Signal para el estado del usuario
  private _user = signal<IUsuario>(this.loadUserFromStorage());
  private _accesos = signal<IAcceso[]>(this.loadAccesosFromStorage());
  private _accesosLoading = signal<boolean>(false);
  public user = this._user.asReadonly();
  public accesos = this._accesos.asReadonly();
  public accesosLoading = this._accesosLoading.asReadonly();

  private httpClient: HttpClient;
  constructor(http: HttpClient, private toastr: ToastrService) {
    super(http);
    this.httpClient = http;
  }

  /** Cargar usuario desde localStorage (si existe) */
  private loadUserFromStorage(): IUsuario {
    const user = localStorage.getItem('user');
    if (user) {
      const parsed: IUsuario = JSON.parse(user);
      // Si existe una foto cacheada en localStorage, úsala
      if (parsed?.userName) {
        const cached = localStorage.getItem(`fotoPerfil:${parsed.userName}`);
        if (cached && cached.startsWith('data:')) {
          parsed.fotoUrl = cached as any;
        }
      }
      return parsed;
    }

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

  private loadAccesosFromStorage(): IAcceso[] {
    const accesos = localStorage.getItem('accesos');
    if (accesos) return JSON.parse(accesos);

    // Accesos "vacíos"
    return [];
  }


  /** Obtener snapshot del usuario actual */
  getUserStorage(): IUsuario {
    return this._user();
  }

  getAccesosStorage(): IAcceso[] {
    return this._accesos();
  }

  /** Actualizar usuario en memoria y storage */
  updateUser(user: IUsuario) {
    this._user.set(user);
    localStorage.setItem('user', JSON.stringify(user));
  }

  /** Actualizar accesos en memoria y storage */
  updateAccesos(accesos: IAcceso[]) {
    this._accesos.set(accesos || []);
    localStorage.setItem('accesos', JSON.stringify(accesos || []));
  }

  /** Cambiar estado de carga de accesos */
  setAccesosLoading(loading: boolean) {
    this._accesosLoading.set(loading);
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
          // Guardar usuario y, si tiene foto, descargarla y cachearla en localStorage
          const user = resp.body.data.user;
          await this.fetchAndApplyUserPhoto(user);
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

  /**
   * Si el usuario posee fotoUrl, intenta descargarla desde el backend,
   * la convierte a dataURL y la almacena en localStorage bajo clave `fotoPerfil:<userName>`.
   * También actualiza el usuario en memoria con la dataURL para uso inmediato en la UI.
   */
  async fetchAndApplyUserPhoto(user: IUsuario): Promise<IUsuario> {
    try {
      if (!user?.fotoUrl) {
        this.updateUser(user);
        return user;
      }
      // Si ya es un dataURL, solo persistimos
      if (typeof user.fotoUrl === 'string' && user.fotoUrl.startsWith('data:')) {
        this.updateUser(user);
        return user;
      }

      const fotoPath = String(user.fotoUrl || '').trim();
      if (!fotoPath) {
        this.updateUser(user);
        return user;
      }

      // Construir URL para obtener la foto:
      // - Si es absoluta (http/https), usarla tal cual
      // - Si NO tiene '/', asumir que es el filename y pegar a /auth/usuarios/perfil/:fileName
      // - Si tiene '/', tratarlo como ruta relativa al apiPath
      let url: string;
      const isAbsolute = /^https?:\/\//i.test(fotoPath);
      if (isAbsolute) {
        url = fotoPath;
      } else if (!fotoPath.includes('/')) {
        url = `${environment.apiPath}/files/perfil/${encodeURIComponent(fotoPath)}`;
      } else {
        const relative = fotoPath.startsWith('/') ? fotoPath : `/${fotoPath}`;
        url = `${environment.apiPath}${relative}`;
      }

      // Preparar headers con token; NO forzar Content-Type
      const token = localStorage.getItem('token') || '';
      const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

      const blob = await firstValueFrom(
        this.httpClient.get(url, { headers, responseType: 'blob' as const })
      );

      const dataUrl = await this.blobToDataURL(blob);
      if (user.userName) {
        localStorage.setItem(`fotoPerfil:${user.userName}`, dataUrl);
      }
      const updated = { ...user, fotoUrl: dataUrl } as IUsuario;
      this.updateUser(updated);
      return updated;
    } catch (e) {
      // Si falla la descarga, dejamos el user como está
      this.updateUser(user);
      return user;
    }
  }

  private blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /** Verifica en el backend si el token sigue siendo válido */
  async verifyToken(token: string): Promise<boolean> {
    try {
      const resp = await firstValueFrom(this.post<ApiResponse>(this.endpoints.verifyToken, { token }));
      return !!resp.body?.success;
    } catch (error: any) {
      return false;
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
    this._accesos.set(this.loadAccesosFromStorage());
    this._accesosLoading.set(false);
  }
}

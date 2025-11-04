import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../auth.service';
import { IAcceso } from '../../../interfaces/auth';

@Injectable({ providedIn: 'root' })
export class AccessGuard implements CanActivate {
  private readonly prefix = '/dashboard/';

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    // Si no está autenticado, deja que el AuthGuard se encargue en rutas protegidas
    if (!this.authService.isAuthenticated()) {
      return this.router.createUrlTree(['/login']);
    }

    // Admin tiene acceso total
    const user = this.authService.getUserStorage();
    if (user?.rol?.esAdmin) return true;

    const url = this.normalizeUrl(this.router.url);

    // Obtener accesos almacenados
    const accesos: IAcceso[] = this.authService.getAccesosStorage() || [];

    // Construir set de rutas permitidas a partir de submenús
    const allowed = new Set(
      accesos.flatMap(a => (a.subMenus || [])
        .map(s => this.normalizeUrl(this.prefix + (s.menu?.pathWeb || '')))
      )
    );

    // Coincidencia exacta o inicio de subruta
    const isAllowed = Array.from(allowed).some(p => url === p || url.startsWith(p + '/'));

    return isAllowed ? true : this.router.createUrlTree(['/401']);
  }

  private normalizeUrl(url: string): string {
    // Quitar query/fragmento y normalizar prefijo
    const clean = url.split('?')[0].split('#')[0];
    // Asegurar prefijo '/'
    let normalized = clean.startsWith('/') ? clean : '/' + clean;
    // Eliminar dobles barras
    normalized = normalized.replace(/\/+/, '/');
    // Remover trailing slash excepto en raíz
    if (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  }
}

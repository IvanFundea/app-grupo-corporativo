import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../auth.service';
import { IAcceso } from '../../../interfaces/auth';

@Injectable({ providedIn: 'root' })
export class AccessGuard implements CanActivate {
  private readonly prefix = '/dashboard/';

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    // Si no está autenticado, deja que el AuthGuard se encargue en rutas protegidas
    if (!this.authService.isAuthenticated()) {
      return this.router.createUrlTree(['/login']);
    }

    // Admin tiene acceso total
    const user = this.authService.getUserStorage();
    if (user?.rol?.esAdmin) return true;

  // Usar la URL de destino del snapshot, no this.router.url (que es la URL actual)
  const url = this.normalizeUrl(state.url);

    // Obtener accesos almacenados
    const accesos: IAcceso[] = this.authService.getAccesosStorage() || [];

    // Extraer la parte de la URL después de '/dashboard/' para facilitar comparaciones
  const rest = url.startsWith(this.prefix) ? url.slice(this.prefix.length) : url.replace(/^\/+/, '');
  

    // Comprobar si algún subMenu coincide con la ruta solicitada (flexible)
    const isAllowed = accesos.some(a => {
        return (
            a.subMenus || []).some(s => {
                const raw = (s.menu?.pathWeb || '').replace(/^\/+|\/+$/g, '');
                
        if (!raw) return false;
  
        // Casos a considerar:
        // - raw === rest (exacto)
        // - rest startsWith raw + '/' (subruta)
        // - rest endsWith raw (cuando pathWeb solo es el segmento final)
        // - rest includes '/' + raw + '/' (raw dentro de la ruta)
        if (rest === raw) return true;
        if (rest.startsWith(raw + '/')) return true;
        if (rest.endsWith('/' + raw)) return true;
        if (rest.includes('/' + raw + '/')) return true;
  
        // También comparar con prefix + raw (normalizado) por compatibilidad
        const candidate = this.normalizeUrl(this.prefix + raw);
        if (url === candidate) return true;
        if (url.startsWith(candidate + '/')) return true;
  
        return false;
      }
        );
    });

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

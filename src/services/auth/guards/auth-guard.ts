import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../auth.service';
import { TokenVerifierService } from './token-verifier.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router, private tokenVerifier: TokenVerifierService) {}

  canActivate(): boolean | UrlTree {
  if (this.authService.isAuthenticated()) {
    // Iniciar verificación periódica del token (si no está activa)
    this.tokenVerifier.ensureStarted();
    return true;
  }
  // Si no está autenticado, envía al login de Fundea
  return this.router.createUrlTree(['/login']);
}
};

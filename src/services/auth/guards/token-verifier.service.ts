import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

// const INTERVAL_MS = 2 * 60 * 1000;
const INTERVAL_MS = 10 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class TokenVerifierService {
  private intervalId: any = null;
  private started = false;

  constructor(private authService: AuthService, private router: Router) {}

  /** Inicia la verificación periódica si aún no ha iniciado */
  ensureStarted() {
    if (this.started) return;
    this.started = true;

    // Verificación inmediata al iniciar
    this.verifyOnce();

    // Luego cada 10 minutos
    this.intervalId = setInterval(() => this.verifyOnce(), INTERVAL_MS);
  }

  /** Detiene la verificación periódica */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.started = false;
  }

  private async verifyOnce() {
    const token = this.authService.token;
    if (!token) {
      return; // No hay token, no hacemos nada; el guard se encargará del flujo de no autenticado
    }

    try {
      const isValid = await this.authService.verifyToken(token);
      if (!isValid) {
        this.authService.logout('Tu sesión ha expirado. Inicia sesión nuevamente.');
        this.stop();
        this.router.navigate(['/login']);
      }
    } catch (_) {
      // En caso de error de red/servidor, tratamos como inválido por seguridad
      this.authService.logout('Tu sesión ha expirado. Inicia sesión nuevamente.');
      this.stop();
      this.router.navigate(['/login']);
    }
  }
}

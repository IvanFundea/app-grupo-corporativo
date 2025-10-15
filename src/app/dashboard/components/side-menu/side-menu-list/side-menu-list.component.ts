import { Component, OnInit, inject, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CustomIconComponent } from '../../../../shared/components/custom-icon/custom-icon.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-side-menu-list',
  imports: [CustomIconComponent, RouterModule],
  templateUrl: './side-menu-list.component.html',
})
export class SideMenuListComponent implements OnInit, AfterViewInit {
  private router = inject(Router);
  
  // Mapeo dinámico de rutas a acordeones
  private routeToAccordionMap: { [key: string]: string } = {
    // Tesorería
    '/dashboard/tesoreria/transacciones': 'reports-accordion',
    '/dashboard/tesoreria/cuentas': 'reports-accordion',
    '/dashboard/tesoreria/bancos': 'reports-accordion',
    '/dashboard/tesoreria/empresa': 'reports-accordion',
    '/dashboard/tesoreria/tipo-moneda': 'reports-accordion',
    
    // Configuración - detectar automáticamente desde el HTML
    // Se llenará dinámicamente al cargar el componente
  };

  ngOnInit() {
    // Escuchar cambios de ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      setTimeout(() => {
        this.checkActiveRoutes(event.url);
      }, 50);
    });
  }

  ngAfterViewInit() {
    // Llenar el mapa dinámicamente desde el HTML
    this.buildRouteMapFromHTML();
    
    // Verificar la ruta actual al cargar el componente
    setTimeout(() => {
      this.checkActiveRoutes(this.router.url);
    }, 200);
  }

  private buildRouteMapFromHTML() {
    // Obtener todos los enlaces con routerLink dentro de acordeones
    const accordions = document.querySelectorAll('.hs-accordion');
    
    accordions.forEach(accordion => {
      const accordionId = accordion.id;
      const routerLinks = accordion.querySelectorAll('a[routerLink]');
      
      routerLinks.forEach(link => {
        const routerLink = link.getAttribute('routerLink');
        if (routerLink && accordionId) {
          this.routeToAccordionMap[routerLink] = accordionId;
          console.log(`Mapped route: ${routerLink} -> ${accordionId}`);
        }
      });
    });
  }

  private checkActiveRoutes(currentUrl: string) {
    console.log('Checking route:', currentUrl);
    
    // Encontrar el acordeón que debe estar abierto para esta ruta
    const targetAccordion = this.findAccordionForRoute(currentUrl);
    
    // Cerrar todos los acordeones
    this.closeAllAccordions();
    
    // Si encontramos un acordeón objetivo, abrirlo
    if (targetAccordion) {
      setTimeout(() => {
        console.log(`Opening accordion: ${targetAccordion} for route: ${currentUrl}`);
        this.expandAccordion(targetAccordion);
      }, 100);
    } else {
      console.log(`No accordion found for route: ${currentUrl} - all accordions will remain closed`);
    }
  }

  private findAccordionForRoute(currentUrl: string): string | null {
    // Buscar coincidencia exacta primero
    if (this.routeToAccordionMap[currentUrl]) {
      return this.routeToAccordionMap[currentUrl];
    }
    
    // Buscar coincidencia parcial (para sub-rutas)
    for (const route in this.routeToAccordionMap) {
      if (currentUrl.startsWith(route)) {
        return this.routeToAccordionMap[route];
      }
    }
    
    // Si no se encuentra coincidencia, buscar por segmentos de ruta
    const urlSegments = currentUrl.split('/').filter(segment => segment);
    
    for (const route in this.routeToAccordionMap) {
      const routeSegments = route.split('/').filter(segment => segment);
      
      // Verificar si los segmentos principales coinciden
      if (routeSegments.length >= 2 && urlSegments.length >= 2) {
        if (routeSegments[1] === urlSegments[1] && routeSegments[2] === urlSegments[2]) {
          return this.routeToAccordionMap[route];
        }
      }
    }
    
    return null;
  }

  private getAllAccordionIds(): string[] {
    // Obtener todos los IDs de acordeones del DOM de forma dinámica
    const accordions = document.querySelectorAll('.hs-accordion[id]');
    return Array.from(accordions).map(accordion => accordion.id);
  }

  private closeAllAccordions() {
    const accordionIds = this.getAllAccordionIds();
    
    accordionIds.forEach(accordionId => {
      const accordionElement = document.getElementById(accordionId);
      const toggleButton = accordionElement?.querySelector('.hs-accordion-toggle');
      const contentElement = accordionElement?.querySelector('.hs-accordion-content');

      if (accordionElement && toggleButton && contentElement) {
        console.log('Closing accordion:', accordionId);
        
        // Método más agresivo para cerrar acordeones
        // 1. Usar Preline primero si está disponible
        if (typeof window !== 'undefined' && (window as any).HSAccordion) {
          try {
            const accordionInstance = (window as any).HSAccordion.getInstance(accordionElement, true);
            if (accordionInstance && accordionInstance.hide) {
              accordionInstance.hide();
            }
          } catch (error) {
            console.log('Preline close failed, using manual method');
          }
        }
        
        // 2. Método manual como respaldo
        toggleButton.setAttribute('aria-expanded', 'false');
        accordionElement.classList.remove('active', 'hs-accordion-active');
        contentElement.classList.add('hidden');
        
        // 3. Remover cualquier clase de estado activo
        const chevronIcon = toggleButton.querySelector('svg');
        if (chevronIcon) {
          chevronIcon.classList.remove('hs-accordion-active:rotate-180');
          chevronIcon.style.transform = '';
        }
      }
    });
  }

  private expandAccordion(accordionId: string) {
    const accordionElement = document.getElementById(accordionId);
    const toggleButton = accordionElement?.querySelector('.hs-accordion-toggle');
    const contentElement = accordionElement?.querySelector('.hs-accordion-content');

    if (accordionElement && toggleButton && contentElement) {
      console.log('Expanding accordion:', accordionId);
      
      // 1. Usar Preline primero si está disponible
      if (typeof window !== 'undefined' && (window as any).HSAccordion) {
        try {
          const accordionInstance = (window as any).HSAccordion.getInstance(accordionElement, true);
          if (accordionInstance && accordionInstance.show) {
            accordionInstance.show();
            return; // Si Preline funciona, terminar aquí
          }
        } catch (error) {
          console.log('Preline expand failed, using manual method');
        }
      }
      
      // 2. Método manual como respaldo
      toggleButton.setAttribute('aria-expanded', 'true');
      accordionElement.classList.add('active', 'hs-accordion-active');
      contentElement.classList.remove('hidden');
      
      // 3. Agregar clase de estado activo al ícono
      const chevronIcon = toggleButton.querySelector('svg');
      if (chevronIcon) {
        chevronIcon.style.transform = 'rotate(180deg)';
      }
    }
  }
}
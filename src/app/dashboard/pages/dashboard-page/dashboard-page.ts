import { ChangeDetectionStrategy, Component } from '@angular/core';
import SideMenuComponent from '../../components/side-menu/side-menu';
import HomePageComponent from '../../../shared/pages/home-page/home-page';
import { RouterOutlet } from '@angular/router';

// Declarar Preline como variable global
declare global {
  interface Window {
    HSAccordion: any;
  }
}

@Component({
  selector: 'app-dashboard-page',
  imports: [SideMenuComponent, RouterOutlet],
  templateUrl: './dashboard-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DashboardPageComponent {
  isSidebarOpen = false;

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    
    // Reinicializar Preline cuando se abre el sidebar
    if (this.isSidebarOpen) {
      setTimeout(() => {
        if (window.HSAccordion) {
          window.HSAccordion.autoInit();
        }
      }, 350);
    }
  }

  closeSidebar() {
    this.isSidebarOpen = false;
  }
}

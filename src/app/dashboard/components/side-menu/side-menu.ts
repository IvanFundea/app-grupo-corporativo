import { ChangeDetectionStrategy, Component, EventEmitter, Output, AfterViewInit } from '@angular/core';

// Declarar Preline como variable global
declare global {
  interface Window {
    HSAccordion: any;
    HSOverlay: any;
    HSDropdown: any;
  }
}

@Component({
  selector: 'app-side-menu',
  imports: [],
  templateUrl: './side-menu.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SideMenuComponent implements AfterViewInit {
  @Output() closeSidebar = new EventEmitter<void>();

  ngAfterViewInit() {
    // Inicializar Preline después de que la vista se haya renderizado
    setTimeout(() => {
      if (window.HSAccordion) {
        window.HSAccordion.autoInit();
      }
      if (window.HSOverlay) {
        window.HSOverlay.autoInit();
      }
      if (window.HSDropdown) {
        window.HSDropdown.autoInit();
      }
    }, 100);
  }

  onCloseSidebar() {
    this.closeSidebar.emit();
  }
}

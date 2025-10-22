import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomIconComponent } from '../../../shared/components/custom-icon/custom-icon.component';
import { IMenu } from '../../../../interfaces/auth';
import { MenuService } from '../../../../services/auth/menu.service';
import { UpsertMenuComponent } from '../../components/upsert-menu/upsert-menu';

const emptyMenu: IMenu = {
  menuId: '',
  label: '',
  descripcion: '',
  icono: '',
  color: '',
  pathApp: '',
  pathWeb: '',
  principal: true,
  activo: true,
  created_at: new Date(),
};

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [RouterLink, CustomIconComponent, UpsertMenuComponent],
  templateUrl: './menu-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MenuPageComponent {
  menuService = inject(MenuService);

  menusList = signal<IMenu[]>([]);
  menusPrincipales = signal<IMenu[]>([]);
  submenus = signal<IMenu[]>([]);

  pagination = signal<IPagination>({ page: 1, pageSize: 10, totalItems: 0 });
  isLoading = signal(false);
  esMenuPrincipal = signal(true);
  buscador = signal('');

  nuevoMenu = signal(true);
  menuEdit = signal<IMenu>({ ...emptyMenu });

  formKey = signal(Date.now());
  modal = signal({ titulo: 'Crear Menú', visible: false });

  @ViewChild('upsertModal', { static: true }) upsertModal!: ElementRef<HTMLDivElement>;
  @ViewChild('deleteModal', { static: true }) deleteModal!: ElementRef<HTMLDivElement>;

  async ngOnInit() {
    this.fetchData();
  }

  ngAfterViewInit() {
    this.initializePreline();
  }

  private initializePreline() {
    if (typeof window !== 'undefined' && (window as any).HSStaticMethods) {
      setTimeout(() => (window as any).HSStaticMethods.autoInit(), 100);
    }
  }

  private splitMenus(list: IMenu[]) {
    const menus = (list || []).filter(m => !!m.principal);
    const subs = (list || []).filter(m => !m.principal);
    this.menusPrincipales.set(menus);
    this.submenus.set(subs);
  }

  async fetchData() {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    const resp = await this.menuService.getMenus({ all: true, busqueda: this.buscador() });
    if (resp?.success) {
      const data = resp.data || [];
      this.menusList.set(data);
      this.splitMenus(data);
      if (resp.metadata) {
        this.pagination.update(p => ({ ...p, totalItems: resp.metadata?.total || data.length }));
      }
      setTimeout(() => (window as any).HSStaticMethods?.autoInit(), 100);
    }
    this.isLoading.set(false);
  }

  onSearch(term: string) {
    this.buscador.set(term);
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.fetchData();
  }

  openUpsertModal(nuevo: boolean, menu: IMenu = emptyMenu) {
    this.formKey.set(Date.now());
    this.nuevoMenu.set(nuevo);
    this.menuEdit.set({ ...menu });
    this.modal.update(m => ({ ...m, titulo: nuevo ? 'Crear Menú' : 'Editar Menú', visible: true }));

    const modalEl = this.upsertModal.nativeElement;
    if ((window as any).HSOverlay) new (window as any).HSOverlay(modalEl).open();
    else {
      modalEl.classList.remove('hidden');
      modalEl.classList.add('pointer-events-auto');
    }
  }

  openCreateMenuPrincipal() {
    this.openUpsertModal(true, { ...emptyMenu, principal: true });
    this.esMenuPrincipal.set(true);
  }

  openCreateSubmenu() {
    this.openUpsertModal(true, { ...emptyMenu, principal: false });
    this.esMenuPrincipal.set(false);
  }

  openDeleteModal(menu: IMenu) {
    this.menuEdit.set({ ...menu });
    const modalEl = this.deleteModal.nativeElement;
    if ((window as any).HSOverlay) new (window as any).HSOverlay(modalEl).open();
    else {
      modalEl.classList.remove('hidden');
      modalEl.classList.add('pointer-events-auto');
    }
  }

  closeModal() {
    const modalEl = this.upsertModal.nativeElement;
    const modalDEl = this.deleteModal.nativeElement;
    if ((window as any).HSOverlay) {
      (window as any).HSOverlay.close(modalEl);
      (window as any).HSOverlay.close(modalDEl);
    } else {
      modalEl.classList.add('hidden');
      modalEl.classList.remove('open', 'pointer-events-auto');
      modalDEl.classList.add('hidden');
      modalDEl.classList.remove('open', 'pointer-events-auto');
    }
  }

  async upsertMenu(menu: IMenu) {
    if (!menu.menuId) await this.createMenu(menu);
    else await this.updateMenu(menu);
  }

  async createMenu(menu: IMenu) {
    const { menuId, created_at, updated_at, deleted_at, ...payload } = menu;
    const resp = await this.menuService.createMenu(payload as any);
    if (resp?.success) {
      await this.fetchData();
      this.closeModal();
      this.menuEdit.set({ ...emptyMenu });
      this.nuevoMenu.set(true);
    }
  }

  async updateMenu(menu: IMenu) {
    const resp = await this.menuService.updateMenu(menu);
    if (resp?.success) {
      await this.fetchData();
      this.closeModal();
    }
  }

  async deleteMenu(menu: IMenu) {
    const resp = await this.menuService.deleteMenu(menu.menuId || '');
    if (resp?.success) {
      await this.fetchData();
      this.closeModal();
      this.menuEdit.set({ ...emptyMenu });
      this.nuevoMenu.set(true);
    }
  }

  onToggleActivo(menu: IMenu, activo: boolean) {
    const updated: IMenu = { ...menu, activo } as IMenu;
    this.updateMenu(updated);
  }
}

import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomIconComponent } from '../../../shared/components/custom-icon/custom-icon.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { IMenu } from '../../../../interfaces/auth';
import type { ApiMetadata } from '../../../../interfaces/api-response';
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
  imports: [RouterLink, CustomIconComponent, UpsertMenuComponent, PaginationComponent],
  templateUrl: './menu-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MenuPageComponent {
  menuService = inject(MenuService);

  menusPrincipales = signal<IMenu[]>([]);
  submenus = signal<IMenu[]>([]);

  // Tabs and filters
  activeTab = signal<'menus' | 'submenus'>('menus');
  buscadorMenus = signal('');
  buscadorSubs = signal('');

  // Independent pagination states
  paginationMenus = signal<IPagination>({ page: 1, pageSize: 10, totalItems: 0 });
  paginationSubs = signal<IPagination>({ page: 1, pageSize: 10, totalItems: 0 });

  isLoadingMenus = signal(false);
  isLoadingSubs = signal(false);
  esMenuPrincipal = signal(true);

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

  async fetchData() {
    await Promise.all([this.fetchMenusPage(), this.fetchSubmenusPage()]);
  }

  private normalize(t: string): string { return (t || '').toLowerCase(); }

  getMenusPrincipalesPageSlice(): IMenu[] {
    return this.menusPrincipales() || [];
  }

  getSubmenusPageSlice(): IMenu[] {
    return this.submenus() || [];
  }

  private updateMenusPagination(meta?: ApiMetadata | null) {
    if (meta) this.paginationMenus.update(p => ({ ...p, totalItems: meta.total, page: meta.page, pageSize: meta.limit }));
  }

  private updateSubsPagination(meta?: ApiMetadata | null) {
    if (meta) this.paginationSubs.update(p => ({ ...p, totalItems: meta.total, page: meta.page, pageSize: meta.limit }));
  }

  onSearchMenus(term: string) {
    this.buscadorMenus.set(term);
    this.paginationMenus.update(p => ({ ...p, page: 1 }));
    this.fetchMenusPage();
  }

  onSearchSubs(term: string) {
    this.buscadorSubs.set(term);
    this.paginationSubs.update(p => ({ ...p, page: 1 }));
    this.fetchSubmenusPage();
  }

  onChangePageMenus(newPagination: IPagination) {
    this.paginationMenus.set(newPagination);
    this.fetchMenusPage();
  }

  onChangePageSubs(newPagination: IPagination) {
    this.paginationSubs.set(newPagination);
    this.fetchSubmenusPage();
  }

  // Tab switching helper to ensure consistent updates from template
  setActiveTab(tab: 'menus' | 'submenus') {
    this.activeTab.set(tab);
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
      if (menu.principal) await this.fetchMenusPage(); else await this.fetchSubmenusPage();
      this.closeModal();
      this.menuEdit.set({ ...emptyMenu });
      this.nuevoMenu.set(true);
    }
  }

  async updateMenu(menu: IMenu) {
    const resp = await this.menuService.updateMenu(menu);
    if (resp?.success) {
      if (menu.principal) await this.fetchMenusPage(); else await this.fetchSubmenusPage();
      this.closeModal();
    }
  }

  async deleteMenu(menu: IMenu) {
    const resp = await this.menuService.deleteMenu(menu.menuId || '');
    if (resp?.success) {
      if (menu.principal) await this.fetchMenusPage(); else await this.fetchSubmenusPage();
      this.closeModal();
      this.menuEdit.set({ ...emptyMenu });
      this.nuevoMenu.set(true);
    }
  }

  onToggleActivo(menu: IMenu, activo: boolean) {
    const updated: IMenu = { ...menu, activo } as IMenu;
    this.updateMenu(updated);
  }

  private async fetchMenusPage() {
    if (this.isLoadingMenus()) return;
    this.isLoadingMenus.set(true);
    const { page, pageSize } = this.paginationMenus();
    const resp = await this.menuService.getMenus({ page, limit: pageSize, busqueda: this.buscadorMenus(), principal: true });
    if (resp?.success) {
      const data = resp.data || [];
      this.menusPrincipales.set(data);
      this.updateMenusPagination(resp.metadata);
      // Fallback cuando el API no envía metadata: usar longitud del arreglo
      if (!resp.metadata) {
        this.paginationMenus.update(p => ({ ...p, totalItems: data.length }));
      }
      setTimeout(() => (window as any).HSStaticMethods?.autoInit(), 100);
    }
    this.isLoadingMenus.set(false);
  }

  private async fetchSubmenusPage() {
    if (this.isLoadingSubs()) return;
    this.isLoadingSubs.set(true);
    const { page, pageSize } = this.paginationSubs();
    const resp = await this.menuService.getMenus({ page, limit: pageSize, busqueda: this.buscadorSubs(), principal: false });
    if (resp?.success) {
      const data = resp.data || [];
      this.submenus.set(data);
      this.updateSubsPagination(resp.metadata);
      // Fallback cuando el API no envía metadata: usar longitud del arreglo
      if (!resp.metadata) {
        this.paginationSubs.update(p => ({ ...p, totalItems: data.length }));
      }
      setTimeout(() => (window as any).HSStaticMethods?.autoInit(), 100);
    }
    this.isLoadingSubs.set(false);
  }
}

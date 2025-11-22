import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RolService } from '../../../../services/auth/rol.service';
import { MenuService } from '../../../../services/auth/menu.service';
import { AccesoService } from '../../../../services/auth/acceso.service';
import { IAcceso, IMenu, IRol } from '../../../../interfaces/auth';
import UpsertAccesoComponent from '../../components/upsert-acceso/upsert-acceso';
import { CustomIconComponent } from '../../../shared/components/custom-icon/custom-icon.component';

@Component({
  selector: 'app-acceso-page',
  standalone: true,
  imports: [CommonModule, RouterLink, UpsertAccesoComponent, CustomIconComponent],
  templateUrl: './acceso-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AccesoPageComponent {
  private rolService = inject(RolService);
  private menuService = inject(MenuService);
  private accesoService = inject(AccesoService);

  roles = signal<IRol[]>([]);
  selectedRolId = signal<string>('');

  menus = signal<IMenu[]>([]);
  accesos = signal<IAcceso[]>([]);

  // Modal state
  showUpsert = signal<boolean>(false);
  upsertMenu = signal<IMenu | null>(null);

  // Filtro para submenús
  filterSubmenus = signal<string>('');

  ngOnInit() {
    this.loadRoles();
    this.loadMenus();
  }

  async loadRoles() {
    const r = await this.rolService.getRoles({ all: true });
    if (r?.success) this.roles.set(r.data || []);
  }

  async loadMenus() {
    const m = await this.menuService.getMenus({ all: true });
    if (m?.success) this.menus.set(m.data || []);
  }

  async onRolChange(id: string) {
    this.selectedRolId.set(id);
    await this.refreshAccesos();
  }

  async refreshAccesos() {
    const rolId = this.selectedRolId();
    if (!rolId) { this.accesos.set([]); return; }
    const res = await this.accesoService.getAccesosByRol(rolId);
    if (res?.success) this.accesos.set(res.data || []);
  // debug log removed
  }

  get principalMenus(): IMenu[] {
    return (this.menus() || []).filter(m => m.principal);
  }

  // IDs de menús ya asignados (incluye principales y submenús)
  private assignedIdsSet(): Set<string> {
    const set = new Set<string>();
    const list = this.accesos() || [];
    for (const a of list) {
      if (a?.menuId) set.add(a.menuId);
      const subs = a?.subMenus || [];
      for (const s of subs) {
        if (s?.menuId) set.add(s.menuId);
      }
    }
    return set;
  }

  selectedRol(): IRol | null {
    const id = this.selectedRolId();
    return (this.roles() || []).find(r => r.rolId === id) || null;
  }

  selectedRolStrict(): IRol {
    return this.selectedRol() as IRol;
  }

  isAssigned(menuId?: string): boolean {
    if (!menuId) return false;
    return this.assignedIdsSet().has(menuId);
  }

  // Submenús disponibles (no asignados aún para este rol)
  subMenusAvailable(): IMenu[] {
    const assignedIds = this.assignedIdsSet();
    const filter = this.filterSubmenus().toLowerCase().trim();
    let subs = (this.menus() || []).filter(m => !m.principal && !assignedIds.has(m.menuId || ''));
    
    if (filter) {
      subs = subs.filter(m => 
        (m.label || '').toLowerCase().includes(filter) ||
        (m.descripcion || '').toLowerCase().includes(filter)
      );
    }
    
    return subs;
  }

  onFilterSubmenusChange(value: string) {
    this.filterSubmenus.set(value);
  }

  // Conteo de submenús ya asignados a un menú principal para el rol
  countSubAccesos(mainMenuId?: string): number {
    if (!mainMenuId) return 0;
    return (this.accesos() || []).filter(a => a.mainMenuId === mainMenuId && !a.menu?.principal).length;
  }

  hasSubAccesos(mainMenuId?: string): boolean {
    return this.countSubAccesos(mainMenuId) > 0;
  }

  async eliminarAcceso(acceso: IAcceso) {
    // Si es un menú principal y tiene submenús asignados, impedir eliminación directa
    if (acceso.menu?.principal && this.hasSubAccesos(acceso.menu?.menuId)) {
      alert('Este menú principal tiene submenús asignados. Elimine o reasigne primero sus submenús.');
      return;
    }
    const ok = confirm('¿Eliminar este acceso?');
    if (!ok || !acceso.accesoId) return;
    await this.accesoService.deleteAcceso(acceso.accesoId);
    await this.refreshAccesos();
  }

  // Asignar: abre modal
  abrirAsignar(menu: IMenu) {
    this.upsertMenu.set(menu);
    this.showUpsert.set(true);
  }

  cerrarModal() {
    this.showUpsert.set(false);
    this.upsertMenu.set(null);
  }

  // Guardar asignación
  async onSaveAcceso(dto: any) {
    await this.accesoService.createAcceso(dto);
    await this.refreshAccesos();
    this.cerrarModal();
  }

  // Reordenar (HTML5 drag & drop)
  dragSubAcceso: IAcceso | null = null;
  onDragOver(ev: DragEvent) { ev.preventDefault(); }

  onDragStartSub(item: IAcceso) { this.dragSubAcceso = item; }

  // Reordenar submenús por mainMenuId
  async onDropSub(targetIndex: number, mainMenuId: string) {
    if (!this.dragSubAcceso) return;
    // Validar target index
    const parent = (this.accesos() || []).find(a => a.menu?.menuId === mainMenuId);
    const count = parent?.subMenus?.length || 0;
    if (targetIndex < 0 || targetIndex >= count) { this.dragSubAcceso = null; return; }

    const newOrden = (targetIndex + 1);
    const moved = { ...this.dragSubAcceso, ordenMenu: newOrden } as IAcceso;
    if (moved.accesoId) {
      await this.accesoService.updateAcceso(moved);
    }
    await this.refreshAccesos();
    this.dragSubAcceso = null;
  }

  changeActive(acceso: IAcceso, checked: boolean) {
    acceso.activo = checked;
    this.updateAcceso(acceso);
  }

  async updateAcceso(acceso: IAcceso) {
    let resp = await this.accesoService.updateAcceso(acceso)
    if (resp?.success) {
      // this.fetchData()
      this.cerrarModal();
    }
  }

  changeShowApp(acceso: IAcceso, checked: boolean) {
    acceso.showApp = checked;
    this.updateAcceso(acceso);
  }

  changeShowWeb(acceso: IAcceso, checked: boolean) {
    acceso.showWeb = checked;
    this.updateAcceso(acceso);
  }
}

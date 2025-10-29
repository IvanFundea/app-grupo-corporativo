import { ChangeDetectionStrategy, Component, EventEmitter, inject, input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { IAcceso, IMenu, IRol } from '../../../../interfaces/auth';

@Component({
  selector: 'app-upsert-acceso',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './upsert-acceso.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class UpsertAccesoComponent {
  private fb = inject(FormBuilder);

  // Inputs
  menu = input.required<IMenu>();
  rol = input.required<IRol>();
  accesos = input<IAcceso[]>([]);

  // Outputs
  @Output() save = new EventEmitter<Omit<IAcceso, 'accesoId' | 'created_at' | 'updated_at' | 'deleted_at' | 'menu' | 'rol' | 'subMenus'>>();
  @Output() cancel = new EventEmitter<void>();

  form = signal<FormGroup>(this.fb.group({}));

  ngOnInit() {
    this.buildForm();
  }

  private buildForm() {
    const m = this.menu();
    const r = this.rol();

    const group = this.fb.group({
      menuId: [m.menuId || '', [Validators.required]],
      rolId: [r.rolId || '', [Validators.required]],
      mainMenuId: [null as string | null],
      ordenMenu: [100, [Validators.required]],
      showApp: [true, [Validators.required]],
      showWeb: [true, [Validators.required]],
      activo: [true, [Validators.required]],
    });

    // Si es submenu, requerir mainMenuId
    if (!m.principal) {
      group.get('mainMenuId')?.addValidators([Validators.required]);
    }

    this.form.set(group);
  }

  // Opciones de orden según si es menú principal o submenú
  get opcionesOrden(): Array<{ value: number; label: string }> {
    const m = this.menu();
    const acc = this.accesos() || [];
    const opciones: Array<{ value: number; label: string }> = [
      { value: 0, label: 'Colocar al inicio' },
    ];

    if (m.principal) {
      const principales = acc.filter(a => a.menu?.principal);
      for (const a of principales) {
        opciones.push({ value: a.ordenMenu, label: `Antes de ${a.menu?.label}` });
      }
    } else {
      const mainId = this.form().get('mainMenuId')?.value as string | null;
      if (mainId) {
        const sub = acc.filter(a => a.mainMenuId === mainId && !a.menu?.principal);
        for (const a of sub) {
          opciones.push({ value: a.ordenMenu, label: `Antes de ${a.menu?.label}` });
        }
      }
    }

    opciones.push({ value: 100, label: 'Colocar al final' });
    return opciones;
  }

  onSubmit() {
    if (this.form().invalid) return;
    const value = this.form().value as any;
    this.save.emit({
      menuId: value.menuId,
      rolId: value.rolId,
      mainMenuId: value.mainMenuId,
      ordenMenu: Number(value.ordenMenu),
      showApp: !!value.showApp,
      showWeb: !!value.showWeb,
      activo: !!value.activo,
    });
  }

  onCancel() {
    this.cancel.emit();
  }
}

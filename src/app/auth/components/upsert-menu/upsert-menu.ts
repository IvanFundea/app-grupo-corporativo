import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnDestroy, Output, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IMenu } from '../../../../interfaces/auth';
import { CustomIconComponent } from '../../../shared/components/custom-icon/custom-icon.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-upsert-menu',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CustomIconComponent],
  templateUrl: './upsert-menu.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpsertMenuComponent implements OnDestroy {
  fb = inject(FormBuilder);
  cdr = inject(ChangeDetectorRef);

  // Inputs
  menu = input.required<IMenu>();
  nuevo = input<boolean>(true);
  esMenuPrincipal = input<boolean>(true);

  // Outputs
  @Output() save = new EventEmitter<IMenu>();
  @Output() cancel = new EventEmitter<void>();

  // State
  form = signal<FormGroup>(this.fb.group({}));
  key = input<number>(0);
  iconName = signal<string>('triangle-alert');
  iconColor = signal<string>('#111111');
  private subs: Subscription[] = [];
  private lastMenuId?: string;
  private lastKey?: number;
  private lastNuevo?: boolean;

  constructor() {
    effect(() => {
      const isNuevo = this.nuevo();
      const m = this.menu();
      const k = this.key();

      // Avoid rebuilding the form if inputs didn't change
      if (this.lastMenuId === m?.menuId && this.lastKey === k && this.lastNuevo === isNuevo && this.form()) {
        return;
      }

      // cleanup previous subscriptions
      this.subs.forEach(s => s.unsubscribe());
      this.subs = [];

      const principalInit = (m.principal ?? this.esMenuPrincipal() ?? true);
      const colorInitVal = m.color ? (m.color === 'black' ? '#000000' : m.color) : '#111111';
      const newForm = this.fb.group({
        label: [m.label || '', [Validators.required, Validators.minLength(3)]],
        descripcion: [m.descripcion || ''],
        icono: [m.icono || ''],
        color: [colorInitVal],
        pathApp: [m.pathApp || ''],
        pathWeb: [m.pathWeb || ''],
        principal: [principalInit],
        activo: [m.activo ?? false],
        created_at: [m.created_at || new Date()],
      });

      // Set form and preview
      this.form.set(newForm);
      this.iconName.set(newForm.get('icono')?.value || 'triangle-alert');
      this.iconColor.set(newForm.get('color')?.value || '#111111');

      // Subscribe to changes for live preview
      const s1 = newForm.get('icono')?.valueChanges.subscribe((val) => {
        this.iconName.set(val || 'triangle-alert');
        this.cdr.markForCheck();
      });
      const s2 = newForm.get('color')?.valueChanges.subscribe((val) => {
        this.iconColor.set(val || '#111111');
        this.cdr.markForCheck();
      });
      if (s1) this.subs.push(s1);
      if (s2) this.subs.push(s2);

      // Remember inputs state
      this.lastMenuId = m?.menuId;
      this.lastKey = k;
      this.lastNuevo = isNuevo;
    });
  }

  get btnText(): string {
    return this.nuevo() ? 'Crear Menú' : 'Actualizar Menú';
  }

  onSubmit() {
    if (this.form().invalid) return;
    const value: IMenu = {
      ...this.menu(),
      ...this.form().value,
    } as IMenu;
    this.save.emit(value);
  }

  onCancel() {
    this.cancel.emit();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.subs = [];
  }
}

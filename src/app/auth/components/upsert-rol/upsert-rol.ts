import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  inject,
  input,
  Input,
  effect,
  signal
} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IRol } from '../../../../interfaces/auth';

export interface RolValidationRules {
  name?: any[];
  description?: any[];
  password?: any[];
}

@Component({
  selector: 'app-upsert-rol',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './upsert-rol.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpsertRolComponent {
  fb = inject(FormBuilder);

  rol = input.required<IRol>();

  nuevo = input<boolean>(true);

  validationRules: RolValidationRules = {
    name: [Validators.required, Validators.minLength(5)],
  };

  @Output() save = new EventEmitter<IRol>();
  @Output() cancel = new EventEmitter<void>();

  form = signal<FormGroup>(this.fb.group({}));
  key = input<number>(0);

  constructor() {
  effect(() => {
    const isNuevo = this.nuevo();
    const rol = this.rol();
    const _ = this.key();

    const newForm = this.fb.group({
      nombre: [rol.nombre, this.validationRules.name],
      activo: [rol.activo],
      invitado: [rol.invitado],
      esAdmin: [rol.esAdmin],
      created_at: [rol.created_at],
    });

    if (isNuevo) {
      newForm.reset({
        nombre: '',
        activo: true,
        invitado: false,
        esAdmin: false,
        created_at: new Date(),
      });
    }

    this.form.set(newForm); // Actualiza el signal
  });
}

  get btnText(): string {
    return this.nuevo() ? 'Crear Rol' : 'Actualizar Rol';
  } 

  onSubmit() {
    if (this.form().valid) {
      const value: IRol = {
        ...this.rol(),
        ...this.form().value,
      };
      this.save.emit(value);
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}


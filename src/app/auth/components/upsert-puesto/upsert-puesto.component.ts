import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  inject,
  input,
  effect,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IPuesto } from '../../../../interfaces/auth';

@Component({
  selector: 'app-upsert-puesto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './upsert-puesto.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpsertPuestoComponent {
  private fb = inject(FormBuilder);

  // Inputs siguiendo el patrón de upsert-rol
  puesto = input.required<IPuesto>();
  nuevo = input<boolean>(true);
  key = input<number>(0); // para forzar re-render si es necesario desde el padre

  @Output() save = new EventEmitter<IPuesto>();
  @Output() cancel = new EventEmitter<void>();

  form = signal<FormGroup>(this.fb.group({}));

  constructor() {
    effect(() => {
      const isNuevo = this.nuevo();
      const p = this.puesto();
      const _ = this.key();

      const newForm = this.fb.group({
        nombre: [p?.nombre ?? '', [Validators.required, Validators.minLength(3)]],
      });

      if (isNuevo) {
        newForm.reset({
          nombre: '',
        });
      }

      this.form.set(newForm);
    });
  }

  get btnText(): string {
    return this.nuevo() ? 'Crear Puesto' : 'Actualizar Puesto';
  }

  onSubmit() {
    if (this.form().valid) {
      const nombre = (this.form().value?.['nombre'] ?? '').toString().trim();
      const value: IPuesto = {
        ...this.puesto(),
        nombre,
      };
      this.save.emit(value);
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
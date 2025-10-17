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
import { ITipoMoneda } from '../../../../interfaces/tesoreria';

@Component({
  selector: 'app-upsert-tipo-moneda',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './upsert-tipo-moneda.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpsertTipoMonedaComponent {
  private fb = inject(FormBuilder);

  tipoMoneda = input.required<ITipoMoneda>();
  nuevo = input<boolean>(true);
  key = input<number>(0);

  @Output() save = new EventEmitter<ITipoMoneda>();
  @Output() cancel = new EventEmitter<void>();

  form = signal<FormGroup>(this.fb.group({}));

  constructor() {
    effect(() => {
      const isNuevo = this.nuevo();
      const tm = this.tipoMoneda();
      const _ = this.key();

      const newForm = this.fb.group({
        descripcion: [tm?.descripcion ?? '', [Validators.required, Validators.minLength(2)]],
        simbolo: [tm?.simbolo ?? '', [Validators.required, Validators.maxLength(6)]],
      });

      if (isNuevo) {
        newForm.reset({
          descripcion: '',
          simbolo: '',
        });
      }

      this.form.set(newForm);
    });
  }

  get btnText(): string {
    return this.nuevo() ? 'Crear Tipo de Moneda' : 'Actualizar Tipo de Moneda';
  }

  onSubmit() {
    if (this.form().valid) {
      const value: ITipoMoneda = {
        ...this.tipoMoneda(),
        ...this.form().value,
      } as ITipoMoneda;
      this.save.emit(value);
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}

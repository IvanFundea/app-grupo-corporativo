import { ChangeDetectionStrategy, Component, EventEmitter, Output, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ITipoTransaccion, TipoTransaccionTipo } from '../../../../interfaces/tesoreria';

@Component({
  selector: 'app-upsert-tipo-transaccion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './upsert-tipo-transaccion.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpsertTipoTransaccionComponent {
  private fb = inject(FormBuilder);

  tipo = input.required<ITipoTransaccion>();
  nuevo = input<boolean>(true);
  key = input<number>(0);

  @Output() save = new EventEmitter<ITipoTransaccion>();
  @Output() cancel = new EventEmitter<void>();

  form = signal<FormGroup>(this.fb.group({}));

  tipos: TipoTransaccionTipo[] = ['DEBITO', 'CREDITO', 'SALDO', 'CIERRE'];

  constructor() {
    effect(() => {
      const isNuevo = this.nuevo();
      const t = this.tipo();
      const _ = this.key();

      const newForm = this.fb.group({
        nombre: [t?.nombre ?? '', [Validators.required, Validators.minLength(2)]],
        tipo: [t?.tipo ?? 'DEBITO', [Validators.required]],
      });

      if (isNuevo) {
        newForm.reset({ nombre: '', tipo: 'DEBITO' });
      }

      this.form.set(newForm);
    });
  }

  get btnText(): string {
    return this.nuevo() ? 'Crear Tipo' : 'Actualizar Tipo';
  }

  onSubmit() {
    if (this.form().valid) {
      const value: ITipoTransaccion = { ...this.tipo(), ...this.form().value } as ITipoTransaccion;
      this.save.emit(value);
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}

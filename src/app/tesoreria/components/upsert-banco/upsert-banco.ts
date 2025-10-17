import { ChangeDetectionStrategy, Component, EventEmitter, Output, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IBanco } from '../../../../interfaces/tesoreria';

@Component({
  selector: 'app-upsert-banco',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './upsert-banco.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpsertBancoComponent {
  private fb = inject(FormBuilder);

  banco = input.required<IBanco>();
  nuevo = input<boolean>(true);
  key = input<number>(0);

  @Output() save = new EventEmitter<IBanco>();
  @Output() cancel = new EventEmitter<void>();

  form = signal<FormGroup>(this.fb.group({}));

  constructor() {
    effect(() => {
      const isNuevo = this.nuevo();
      const b = this.banco();
      const _ = this.key();

      const newForm = this.fb.group({
        nombre: [b?.nombre ?? '', [Validators.required, Validators.minLength(2)]],
        nombreCorto: [b?.nombreCorto ?? '', [Validators.required, Validators.minLength(2)]],
      });

      if (isNuevo) {
        newForm.reset({ nombre: '', nombreCorto: '' });
      }

      this.form.set(newForm);
    });
  }

  get btnText(): string {
    return this.nuevo() ? 'Crear Banco' : 'Actualizar Banco';
  }

  onSubmit() {
    if (this.form().valid) {
      const value: IBanco = { ...this.banco(), ...this.form().value } as IBanco;
      this.save.emit(value);
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}

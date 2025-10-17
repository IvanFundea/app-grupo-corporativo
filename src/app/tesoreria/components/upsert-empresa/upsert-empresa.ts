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
import { IEmpresa, ITipoMoneda } from '../../../../interfaces/tesoreria';

@Component({
  selector: 'app-upsert-empresa',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './upsert-empresa.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpsertEmpresaComponent {
  private fb = inject(FormBuilder);

  empresa = input.required<IEmpresa>();
  tiposMoneda = input<ITipoMoneda[]>([]);
  nuevo = input<boolean>(true);
  key = input<number>(0);

  @Output() save = new EventEmitter<IEmpresa>();
  @Output() cancel = new EventEmitter<void>();

  form = signal<FormGroup>(this.fb.group({}));

  constructor() {
    effect(() => {
      const isNuevo = this.nuevo();
      const e = this.empresa();
      const _ = this.key();

      const newForm = this.fb.group({
        nombre: [e?.nombre ?? '', [Validators.required, Validators.minLength(2)]],
        direccion: [e?.direccion ?? '', [Validators.required, Validators.minLength(3)]],
        nit: [e?.nit ?? ''],
        telefono: [e?.telefono ?? 0, [Validators.required]],
        tipoMonedaId: [e?.tipoMonedaId ?? '', [Validators.required]],
      });

      if (isNuevo) {
        newForm.reset({
          nombre: '',
          direccion: '',
          nit: '',
          telefono: 0,
          tipoMonedaId: '',
        });
      }

      this.form.set(newForm);
    });
  }

  get btnText(): string {
    return this.nuevo() ? 'Crear Empresa' : 'Actualizar Empresa';
  }

  onSubmit() {
    if (this.form().valid) {
      const value: IEmpresa = {
        ...this.empresa(),
        ...this.form().value,
      } as IEmpresa;
      this.save.emit(value);
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}

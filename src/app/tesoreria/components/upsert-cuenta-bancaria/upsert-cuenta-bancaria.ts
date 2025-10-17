import { ChangeDetectionStrategy, Component, EventEmitter, Output, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IBanco, ICuentaBancaria, IEmpresa, ITipoMoneda } from '../../../../interfaces/tesoreria';

@Component({
  selector: 'app-upsert-cuenta-bancaria',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './upsert-cuenta-bancaria.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpsertCuentaBancariaComponent {
  private fb = inject(FormBuilder);

  cuenta = input.required<ICuentaBancaria>();
  bancos = input<IBanco[]>([]);
  empresas = input<IEmpresa[]>([]);
  tiposMoneda = input<ITipoMoneda[]>([]);
  nuevo = input<boolean>(true);
  key = input<number>(0);

  @Output() save = new EventEmitter<ICuentaBancaria>();
  @Output() cancel = new EventEmitter<void>();

  form = signal<FormGroup>(this.fb.group({}));

  constructor() {
    effect(() => {
      const isNuevo = this.nuevo();
      const c = this.cuenta();
      const _ = this.key();

      const newForm = this.fb.group({
        bancoId: [c?.bancoId ?? '', [Validators.required]],
        empresaId: [c?.empresaId ?? '', [Validators.required]],
        numero: [c?.numero ?? '', [Validators.required, Validators.minLength(3)]],
        tipoCuenta: [c?.tipoCuenta ?? '', [Validators.required]],
        tipoMonedaId: [c?.tipoMonedaId ?? '', [Validators.required]],
        descripcion: [c?.descripcion ?? ''],
        saldoBanco: [c?.saldoBanco ?? null],
      });

      if (isNuevo) {
        newForm.reset({
          bancoId: '',
          empresaId: '',
          numero: '',
          tipoCuenta: '',
          tipoMonedaId: '',
          descripcion: '',
          saldoBanco: null,
        });
      }

      this.form.set(newForm);
    });
  }

  get btnText(): string {
    return this.nuevo() ? 'Crear Cuenta' : 'Actualizar Cuenta';
  }

  onSubmit() {
    if (this.form().valid) {
      const value: ICuentaBancaria = { ...this.cuenta(), ...this.form().value } as ICuentaBancaria;
      this.save.emit(value);
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}

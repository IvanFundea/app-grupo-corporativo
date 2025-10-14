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
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


export interface IEmpresa {
  empresaId?: string;
  nombre: string;
  direccion: string;
  nit: string;
  telefono: string;
  activo: boolean;
}

export interface EmpresaValidationRules {
  nombre?: any[];
  direccion?: any[];
  nit?: any[];
  telefono?: any[];
  activo?: any[];
}


@Component({
  selector: 'app-upsert-empresa',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './upsert-empresa.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpsertEmpresaComponent {
  fb = inject(FormBuilder);

  empresa = input<IEmpresa>({
    nombre: '',
    direccion: '',
    nit: '',
    telefono: '',
    activo: true,
  });

  nuevo = input<boolean>(true);
  key = input<number>(0);

  validationRules: EmpresaValidationRules = {
    nombre: [Validators.required, Validators.minLength(3)],
    direccion: [Validators.required, Validators.minLength(3)],
    nit: [],
    telefono: [Validators.required],
    activo: [],
  };

  @Output() save = new EventEmitter<IEmpresa>();
  @Output() cancel = new EventEmitter<void>();

  form = signal<FormGroup>(this.fb.group({}));

  constructor() {
    effect(() => {
      const _ = this.key(); // provoca que el form se reinicie cada vez que cambia el key
      const metodo = this.empresa();
      const isNuevo = this.nuevo();

      this.initForm(metodo, isNuevo);
    });
  }

  private initForm(empresa: IEmpresa, isNuevo: boolean) {
    const newForm = this.fb.group({
      nombre: [empresa.nombre, this.validationRules.nombre],
      direccion: [empresa.direccion, this.validationRules.direccion],
      nit: [empresa.nit, this.validationRules.nit],
      telefono: [empresa.telefono, this.validationRules.telefono],
      activo: [empresa.activo, this.validationRules.activo],
    });

    if (isNuevo) {
      newForm.reset({
        nombre: '',
        direccion: '',
        nit: '',
        telefono: '',
        activo: true,
      });
    }
    this.form.set(newForm);
  }

  get btnText(): string {
    return this.nuevo() ? 'Crear empresa' : 'Actualizar empresa';
  }



  onSubmit() {
    if (this.form().valid) {
      const value: IEmpresa = {
        ...this.empresa(),
        ...this.form().value,
      };
      this.save.emit(value);
    }
  }

  onCancel() {
    this.cancel.emit();
  }

}

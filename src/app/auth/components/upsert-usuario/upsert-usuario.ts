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
import { IUsuario, IPuesto, IRol } from '../../../../interfaces/auth';

@Component({
  selector: 'app-upsert-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './upsert-usuario.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpsertUsuarioComponent {
  private fb = inject(FormBuilder);

  usuario = input.required<IUsuario>();
  roles = input<IRol[]>([]);
  puestos = input<IPuesto[]>([]);
  nuevo = input<boolean>(true);
  key = input<number>(0);

  @Output() save = new EventEmitter<IUsuario>();
  @Output() cancel = new EventEmitter<void>();

  form = signal<FormGroup>(this.fb.group({}));

  constructor() {
    effect(() => {
      const isNuevo = this.nuevo();
      const u = this.usuario();
      const _ = this.key();

      const newForm = this.fb.group({
        nombre1: [u?.nombre1 ?? '', [Validators.required, Validators.minLength(2)]],
        nombre2: [u?.nombre2 ?? ''],
        nombre3: [u?.nombre3 ?? ''],
        apellido1: [u?.apellido1 ?? '', [Validators.required, Validators.minLength(2)]],
        apellido2: [u?.apellido2 ?? ''],
        apellido3: [u?.apellido3 ?? ''],
        userName: [u?.userName ?? '', [Validators.required, Validators.minLength(4)]],
        correo: [u?.correo ?? '', [Validators.required, Validators.email]],
        rolId: [u?.rolId ?? '', [Validators.required]],
        puestoId: [u?.puestoId ?? ''],
        activo: [u?.activo ?? true],
        clave: [''], // solo requerido al crear
      });

      if (isNuevo) {
        newForm.get('clave')?.addValidators([Validators.required, Validators.minLength(6)]);
        newForm.reset({
          nombre1: '',
          nombre2: '',
          nombre3: '',
          apellido1: '',
          apellido2: '',
          apellido3: '',
          userName: '',
          correo: '',
          rolId: '',
          puestoId: '',
          activo: true,
          clave: '',
        });
      }

      this.form.set(newForm);
    });
  }

  get btnText(): string {
    return this.nuevo() ? 'Crear Usuario' : 'Actualizar Usuario';
  }

  onSubmit() {
    if (this.form().valid) {
      const value: IUsuario = {
        ...this.usuario(),
        ...this.form().value,
      } as IUsuario;
      this.save.emit(value);
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}

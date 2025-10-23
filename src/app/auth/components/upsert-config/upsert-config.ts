import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnDestroy, Output, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IConfig, TipoConfiguracion } from '../../../../interfaces/auth';

export interface basicObject {
    key: string;
    value: string;
}


@Component({
    selector: 'app-upsert-config',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './upsert-config.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpsertConfigComponent implements OnDestroy {
    fb = inject(FormBuilder);
    cdr = inject(ChangeDetectorRef);

    // Inputs
    config = input.required<IConfig>();
    nuevo = input<boolean>(true);
    key = input<number>(0);
    arrayValues = signal<string[]>([]);
    objectValues = signal<basicObject[]>([]);

    // Outputs
    @Output() save = new EventEmitter<IConfig>();
    @Output() cancel = new EventEmitter<void>();

    // State
    form = signal<FormGroup>(this.fb.group({}));
    tipoOptions = Object.values(TipoConfiguracion);

    private lastConfigId?: string;
    private lastKey?: number;
    private lastNuevo?: boolean;

    jsonError = signal<string>('');

    constructor() {
        effect(() => {
            const isNuevo = this.nuevo();
            const cfg = this.config();
            const k = this.key();

            if (this.lastConfigId === cfg?.configId && this.lastKey === k && this.lastNuevo === isNuevo && this.form()) {
                return;
            }

            const parsed = this.parseValorByTipo(cfg?.tipo || TipoConfiguracion.STRING, cfg?.valor ?? '');

            const form = this.fb.group({
                llave: [cfg.llave || '', [Validators.required, Validators.minLength(2)]],
                tipo: [cfg.tipo || TipoConfiguracion.STRING, [Validators.required]],
                valorString: [parsed.valorString || ''],
                valorNumber: [parsed.valorNumber ?? null],
                valorBoolean: [parsed.valorBoolean ?? false],
                valorArray: [parsed.valorArray || ''],
                valorObject: [parsed.valorObject || ''],
                descripcion: [cfg.descripcion || ''],
                activo: [cfg.activo ?? true],
            });

            this.form.set(form);
            this.jsonError.set('');

            // track inputs
            this.lastConfigId = cfg?.configId;
            this.lastKey = k;
            this.lastNuevo = isNuevo;
        });
    }

    get btnText(): string {
        return this.nuevo() ? 'Crear Configuración' : 'Actualizar Configuración';
    }

    onSubmit() {
        const form = this.form();
        if (!form || form.invalid) return;

        // Serialize valor according to tipo
        const tipo: TipoConfiguracion = form.get('tipo')?.value;
        const serialize = this.serializeValor(tipo);
        if (!serialize.ok) {
            this.jsonError.set(serialize.error || 'Valor inválido');
            this.cdr.markForCheck();
            return;
        }

        this.jsonError.set('');
        const cfg: IConfig = {
            ...this.config(),
            llave: form.get('llave')?.value,
            tipo,
            valor: serialize.valor!,
            descripcion: form.get('descripcion')?.value,
            activo: form.get('activo')?.value,
        } as IConfig;

        this.save.emit(cfg);
    }

    onCancel() {
        this.cancel.emit();
    }

    private parseValorByTipo(tipo: TipoConfiguracion, raw: string): { valorString?: string; valorNumber?: number | null; valorBoolean?: boolean; valorArray?: string; valorObject?: string } {
        try {
            switch (tipo) {
                case TipoConfiguracion.NUMBER:
                    return { valorNumber: raw !== undefined && raw !== null && raw !== '' ? Number(raw) : null };
                case TipoConfiguracion.BOOLEAN:
                    return { valorBoolean: String(raw).toLowerCase() === 'true' };
                case TipoConfiguracion.ARRAY: {
                    const parsed = JSON.parse(raw || '[]');
                    return { valorArray: JSON.stringify(Array.isArray(parsed) ? parsed : [], null, 2) };
                }
                case TipoConfiguracion.OBJECT: {
                    const parsed = JSON.parse(raw || '{}');
                    return { valorObject: JSON.stringify(parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}, null, 2) };
                }
                case TipoConfiguracion.STRING:
                default:
                    return { valorString: raw || '' };
            }
        } catch {
            // If parsing fails, return the raw text to let user fix
            if (tipo === TipoConfiguracion.ARRAY) return { valorArray: raw || '[]' };
            if (tipo === TipoConfiguracion.OBJECT) return { valorObject: raw || '{}' };
            return { valorString: raw || '' };
        }
    }

    private serializeValor(tipo: TipoConfiguracion): { ok: boolean; valor?: string; error?: string } {
        const form = this.form();
        try {
            switch (tipo) {
                case TipoConfiguracion.NUMBER: {
                    const n = form.get('valorNumber')?.value;
                    if (n === null || n === undefined || n === '') return { ok: false, error: 'Ingrese un número válido' };
                    const num = Number(n);
                    if (Number.isNaN(num)) return { ok: false, error: 'El valor no es un número' };
                    return { ok: true, valor: String(num) };
                }
                case TipoConfiguracion.BOOLEAN: {
                    const b = !!form.get('valorBoolean')?.value;
                    return { ok: true, valor: String(b) };
                }
                case TipoConfiguracion.ARRAY: {
                    const txt = String(form.get('valorArray')?.value || '');
                    const parsed = JSON.parse(txt || '[]');
                    if (!Array.isArray(parsed)) return { ok: false, error: 'Debe ingresar un arreglo JSON válido' };
                    return { ok: true, valor: JSON.stringify(parsed) };
                }
                case TipoConfiguracion.OBJECT: {
                    const txt = String(form.get('valorObject')?.value || '');
                    const parsed = JSON.parse(txt || '{}');
                    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ok: false, error: 'Debe ingresar un objeto JSON válido' };
                    return { ok: true, valor: JSON.stringify(parsed) };
                }
                case TipoConfiguracion.STRING:
                default: {
                    const s = String(form.get('valorString')?.value || '');
                    return { ok: true, valor: s };
                }
            }
        } catch (e: any) {
            return { ok: false, error: 'JSON inválido: ' + (e?.message || e) };
        }
    }

    ngOnDestroy(): void {
        // nothing to clean up for now
    }

    addElement(input: HTMLInputElement) {
        const value = input.value.trim();
        if (value === '') return;

        this.arrayValues.update((prev) => [...prev, value]);
        input.value = ''; // ✅ limpia el input

        // Actualizamos el value del form
        const valueJoin = this.arrayValues().join(',');
        this.form().get('value')?.setValue(valueJoin);
    }

    removeElement(index: number) {
        this.arrayValues.update((prev) => prev.filter((_, i) => i !== index));

        // Actualizamos el value del form
        const valueJoin = this.arrayValues().join(',');
        this.form().get('value')?.setValue(valueJoin);

    }

    addElementObj(nameInput: HTMLInputElement, valueInput: HTMLInputElement) {
        const name = nameInput.value.trim();
        const value = valueInput.value.trim();
        if (name === '' || value === '') return;

        this.objectValues.update((prev) => [...prev, { key: name, value }]);
        nameInput.value = ''; // ✅ limpia el input
        valueInput.value = ''; // ✅ limpia el input

        // Actualizamos el value del form
        const valueJson = JSON.stringify(this.objectValues());
        this.form().get('value')?.setValue(valueJson);
    }

    removeElementObj(index: number) {
        this.objectValues.update((prev) => prev.filter((_, i) => i !== index));

        // Actualizamos el value del form
        const valueJson = JSON.stringify(this.objectValues());
        this.form().get('value')?.setValue(valueJson);
    }
}

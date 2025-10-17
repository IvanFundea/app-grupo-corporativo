export interface ITipoMoneda {
    tipoMonedaId: string;
    descripcion:  string;
    simbolo:      string;
}

export interface IEmpresa {
  empresaId: string;       // UUID generado
  nombre: string;          // Nombre de la empresa
  direccion: string;       // Dirección de la empresa
  nit?: string;            // NIT (opcional)
  telefono: number;        // Teléfono
  tipoMonedaId: string;    // ID de la moneda asociada
}

export interface ICuentaBancaria {
  cuentaBancariaId: string;  // UUID
  bancoId: string;           // UUID del banco
  empresaId: string;         // UUID de la empresa
  numero: string;            // Número de cuenta
  tipoCuenta: string;        // Tipo de cuenta (ej. CC, CA)
  tipoMonedaId: string;      // UUID del tipo de moneda
  descripcion: string;       // Descripción de la cuenta
  saldoBanco?: number;       // Saldo actual en el banco (opcional)
}

export type TipoTransaccionTipo = 'DEBITO' | 'CREDITO' | 'SALDO' | 'CIERRE';

export interface ITipoTransaccion {
  tipoTransaccionId: string;
  nombre: string;
  tipo: TipoTransaccionTipo;
}

export interface IBanco {
  bancoId: string;           // UUID del banco
  nombre: string;            // Nombre completo del banco
  nombreCorto: string;       // Nombre corto o abreviado del banco
  cuentasBancarias?: ICuentaBancaria[]; // Cuentas asociadas al banco (opcional)
}

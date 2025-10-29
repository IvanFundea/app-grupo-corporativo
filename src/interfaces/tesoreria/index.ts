export interface ITipoMoneda {
  tipoMonedaId: string;
  descripcion: string;
  simbolo: string;
}

export interface IEmpresa {
  empresaId: string;       // UUID generado
  nombre: string;          // Nombre de la empresa
  direccion: string;       // Dirección de la empresa
  nit: string;            // NIT
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
  flotante: boolean;
  remediacion: boolean;
}

export interface IBanco {
  bancoId: string;           // UUID del banco
  nombre: string;            // Nombre completo del banco
  nombreCorto: string;       // Nombre corto o abreviado del banco
  cuentasBancarias?: ICuentaBancaria[]; // Cuentas asociadas al banco (opcional)
}

export interface IEmpresaUsuario {
  empresaUsuarioId: string;   // UUID de la relación
  usuarioId: string;          // UUID del usuario
  empresaId: string;          // UUID de la empresa
  usuarioModifica: string;    // Usuario que realizó la última modificación
  created_at: Date;           // Fecha de creación
  updated_at?: Date;           // Fecha de última actualización
  deleted_at?: Date;           // Fecha de eliminación (soft delete)
}

export interface IMovimientoBancarioCab {
  cabeceraId: string;
  empredsaId: string;
  cuentaBancariaId: string;
  tipoMonedaBanco: string;
  saldoInicial: number;
  saldoFinal: number;
  totalCreditos: number;
  totalDebitos: number;
  totalFlotante: number;
  fecha: Date;
  created_at: Date;
  updated_at?: Date;
  deleted_at?: Date;
  detalles?: IMovimientoBancarioDet[];
}

export interface IMovimientoBancarioCompleto {
  cabecera: IMovimientoBancarioCab;  
  detalles?: IMovimientoBancarioDet[];
}

export interface IMovimientoBancarioDet {
  movimientoBancarioDetId: string;
  cabeceraId: string;
  tipoTransaccionId: string;
  descripcion: string;
  flotante: boolean;
  valor: number;
  usrIngreso: string;
  created_at: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

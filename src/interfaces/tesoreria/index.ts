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
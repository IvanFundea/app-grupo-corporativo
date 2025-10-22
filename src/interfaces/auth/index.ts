export interface IPuesto {
    puestoId?: string;  // UUID del puesto
    nombre: string;    // Nombre del puesto
    // Relaciones
    usuarios?: IUsuario[];  // Usuarios asociados al puesto
}

export interface IUsuario {
  usuarioId?: string;             // UUID del usuario
  nombreCompleto: string;        // Nombre completo concatenado
  nombre1: string;               // Primer nombre
  nombre2?: string | null;       // Segundo nombre
  nombre3?: string | null;       // Tercer nombre
  apellido1: string;             // Primer apellido
  apellido2?: string | null;     // Segundo apellido
  apellido3?: string | null;     // Tercer apellido
  userName: string;              // Nombre de usuario (único)
  clave: string;                 // Contraseña (hash)
  correo: string;                // Correo electrónico (único)
  fotoUrl?: string | null;       // URL de la foto
  lastPasswordUpdate: Date;      // Última actualización de contraseña
  huella?: string | null;        // Huella digital (en base64 u otro formato)
  activo: boolean;               // Estado del usuario (activo/inactivo)
  rolId: string;                 // ID del rol asignado
  puestoId?: string | null;      // ID del puesto (si aplica)

  // Relaciones
  rol?: IRol;                    // Objeto del rol relacionado
  puesto?: IPuesto;              // Objeto del puesto relacionado

  // Auditoría
  created_at: Date;
  updated_at?: Date | null;
  deleted_at?: Date | null;
}

export interface IAcceso {
  accesoId?: string;              // UUID del acceso
  ordenMenu: number;             // Orden del menú
  showApp: boolean;              // Si se muestra en la app móvil
  showWeb: boolean;              // Si se muestra en la web
  activo: boolean;               // Estado del acceso

  mainMenuId?: string | null;    // ID del menú principal (si aplica)
  menuId: string;                // ID del menú relacionado
  rolId: string;                 // ID del rol relacionado

  // Relaciones (opcionalmente incluidas en consultas)
//   menu?: IMenu;
  rol?: IRol;

  // Auditoría
  created_at: Date;
  updated_at?: Date | null;
  deleted_at?: Date | null;
}


export interface IRol {
    rolId?: string;          // UUID
    nombre: string;         // Nombre del rol
    invitado: boolean;      // Indica si es rol invitado
    activo: boolean;        // Indica si está activo
    esAdmin: boolean;       // Indica si tiene privilegios de administrador

    // Relaciones
    usuarios?: IUsuario[];  // Usuarios asociados al rol
    accesos?: IAcceso[];    // Accesos asociados al rol

    // Metadatos de auditoría
    created_at: Date;
    updated_at?: Date | null;
    deleted_at?: Date | null;
}

export interface ILogin {
  user: IUsuario,
  token: string
}


export interface IMenu {
  menuId?: string;        // UUID del menú
  label: string;          // Nombre o etiqueta del menú
  descripcion: string;    // Descripción del menú
  pathApp: string;        // Ruta de la aplicación móvil o cliente
  pathWeb: string;        // Ruta de la aplicación web
  icono: string;          // Nombre del ícono asociado
  color: string;          // Color del ícono o del menú
  principal: boolean;     // Indica si es un menú principal
  activo: boolean;        // Indica si el menú está activo

  // Relaciones
  accesos?: IAcceso[];    // Lista de accesos asociados al menú

  // Metadatos de auditoría
  created_at: Date;       // Fecha de creación
  updated_at?: Date | null; // Fecha de última actualización
  deleted_at?: Date | null; // Fecha de eliminación (soft delete)
}


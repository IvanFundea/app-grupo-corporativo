// Interfaz base para la respuesta del API
export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: string;
  path: string;
  timestamp: string;
  message: string;
  data: T;
  metadata: ApiMetadata | null;
}

// Interfaz para los metadatos de paginación
export interface ApiMetadata {
  total: number;
  page: number;
  limit: number;
}

// Ejemplo de uso genérico para otros endpoints
export type SingleItemResponse<T> = ApiResponse<T>;
export type ListResponse<T> = ApiResponse<T[]>;

// Interfaz para errores del API
export interface ApiError {
  success: false;
  statusCode: string;
  path: string;
  timestamp: string;
  message: string;
  error?: string;
  details?: any;
}
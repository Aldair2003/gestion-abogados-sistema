// Tipos base para respuestas API
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  error?: {
    code?: string;
    details?: string;
  };
}

// Tipos específicos para respuestas de usuario
export interface UserResponse {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  isActive: boolean;
  isProfileCompleted: boolean;
}

// Tipos para errores comunes
export enum ApiErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
} 
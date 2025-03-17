import { User, Permission } from '@prisma/client';
import { Request } from 'express';
import { UserWithId as UserWithIdBase } from './user';

// Extendemos el tipo User de Prisma
export interface AuthUser extends User {
  permissions?: Permission[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Tipos para las respuestas de la API
export interface LoginResponse {
  token: string;
  user: {
    id: number;
    nombre: string;
    email: string;
    rol: string;
  };
}

// Tipos para las solicitudes
export interface RegisterRequest {
  nombre: string;
  cedula: string;
  telefono: string;
  email: string;
  password: string;
  rol: 'admin' | 'user' | 'colaborador';
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// Esta interfaz se moverá a common.ts para mantener la consistencia
// export interface RequestWithUser extends Request {
//   user?: User;
// }

export interface AuthenticatedRequest extends Request {
  user: UserWithIdBase;
}

export interface JWTPayload {
  id: number;
  email: string;
  rol: string;
}

// ... otros tipos 
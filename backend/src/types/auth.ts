import { Prisma } from '@prisma/client';
import { Request } from 'express';
import { User } from '@prisma/client';

// Usar los tipos generados por Prisma
type User = Prisma.UserGetPayload<{}>;
type Permission = Prisma.PermissionGetPayload<{}>;

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

export interface RequestWithUser extends Request {
  user?: User;
}

// ... otros tipos 
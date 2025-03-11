import { Request } from 'express';
import { UserRole, EstadoProfesional } from '.prisma/client';

// Re-exportar los enums como valores
export { UserRole, EstadoProfesional };

// Tipos base para operaciones de actualización
export interface BaseUpdateInput {
  [key: string]: any;
}

export type UserUpdateInput = BaseUpdateInput;
export type UserUncheckedUpdateInput = BaseUpdateInput;

// Interfaces base
export interface UserWithId {
  id: number;
  email: string;
  nombre?: string | null;
  rol: UserRole;
  isFirstLogin: boolean;
  isProfileCompleted: boolean;
  tokenVersion: number;
  lastActivity?: string;
}

// Extender Request para incluir el usuario
export interface RequestWithUser extends Request {
  user?: UserWithId;
}

// DTOs y tipos para las solicitudes
export interface CreateUserDTO {
  email: string;
  password: string;
  nombre?: string;
  cedula?: string;
  telefono?: string;
  rol: UserRole;
  matricula?: string;
  domicilio?: string;
  universidad?: string;
}

export interface CompleteProfileData {
  nombre: string;
  cedula: string;
  telefono: string;
  domicilio: string;
  estadoProfesional: EstadoProfesional;
  numeroMatricula?: string;
  universidad?: string;
}

export interface RegisterRequest {
  email: string;
  rol: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserUpdateData {
  nombre?: string;
  cedula?: string;
  telefono?: string;
  email?: string;
  domicilio?: string;
  estadoProfesional?: EstadoProfesional;
  numeroMatricula?: string;
  universidad?: string;
  photoUrl?: string;
  isActive?: boolean;
  rol?: UserRole;
  updatedAt?: Date;
}

// Tipos para respuestas API
export interface UserResponse {
  id: number;
  email: string;
  nombre: string | null;
  cedula: string | null;
  telefono: string | null;
  domicilio: string | null;
  estadoProfesional: EstadoProfesional | null;
  numeroMatricula: string | null;
  universidad: string | null;
  photoUrl: string | null;
  rol: UserRole;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
}

export interface UserData extends UserResponse {
  isFirstLogin: boolean;
  isProfileCompleted: boolean;
  isTemporaryPassword: boolean;
  tokenVersion: number;
}

export interface ExportUserData extends UserData {}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserUpdateRequest {
  nombre?: string;
  cedula?: string;
  telefono?: string;
  email?: string;
  isActive?: boolean;
  rol?: UserRole;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface UserFilters {
  search?: string;
  rol?: UserRole;
  isActive?: string | boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedUsersResponse {
  users: UserResponse[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  message?: string;
}
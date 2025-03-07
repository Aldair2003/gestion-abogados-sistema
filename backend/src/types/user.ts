import { Request } from 'express';
import { UserRole, Prisma } from '@prisma/client';

// Re-exportar UserRole para que esté disponible para otros módulos
export { UserRole };

// Re-exportar tipos de Prisma necesarios
export type UserUpdateInput = Prisma.UserUpdateInput;
export type UserUncheckedUpdateInput = Prisma.UserUncheckedUpdateInput;

// Enums
export enum EstadoProfesional {
  ESTUDIANTE = 'ESTUDIANTE',
  GRADUADO = 'GRADUADO'
}

export enum NivelEstudio {
  ESTUDIANTE = 'ESTUDIANTE',
  GRADUADO = 'GRADUADO',
  MAESTRIA = 'MAESTRIA'
}

// Interfaces base
export interface UserWithId {
  id: number;
  email: string;
  rol: UserRole;
  isFirstLogin: boolean;
  isProfileCompleted: boolean;
  nombre?: string;
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
  nombre: string;
  cedula: string;
  telefono: string;
  rol: UserRole;
  matricula?: string;
  domicilio?: string;
  nivelEstudios?: NivelEstudio;
  universidad?: string;
}

export interface CompleteProfileData {
  cedula: string;
  telefono: string;
  estadoProfesional: EstadoProfesional;
  universidad?: string;
  numeroMatricula?: string;
  domicilio: string;
  [key: string]: string | undefined;
}

export interface RegisterRequest {
  email: string;
  rol: UserRole;
}

export interface UserUpdateData {
  nombre?: string;
  email?: string;
  cedula?: string;
  telefono?: string;
  domicilio?: string;
  estadoProfesional?: EstadoProfesional;
  numeroMatricula?: string;
  universidad?: string;
  photoUrl?: string;
  isProfileCompleted?: boolean;
  isFirstLogin?: boolean;
  [key: string]: string | EstadoProfesional | boolean | undefined;
}

// Tipos para respuestas API
export interface UserResponse {
  id: number;
  email: string;
  nombre: string;
  rol: UserRole;
  isActive: boolean;
  isProfileCompleted: boolean;
}

// Tipo completo de Usuario
export interface UserFull extends UserWithId {
  nombre: string;
  cedula: string;
  telefono: string;
  isActive: boolean;
  isFirstLogin: boolean;
  isProfileCompleted: boolean;
  nivelEstudios?: NivelEstudio;
  universidad?: string;
  matricula?: string;
  domicilio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: number;
  email: string;
  password: string;
  nombre: string | null;
  cedula: string | null;
  telefono: string | null;
  rol: UserRole;
  isActive: boolean;
  isFirstLogin: boolean;
  isProfileCompleted: boolean;
  isTemporaryPassword: boolean;
  estadoProfesional: EstadoProfesional | null;
  universidad: string | null;
  numeroMatricula: string | null;
  domicilio: string | null;
  lastLogin: Date | null;
  resetToken: string | null;
  resetTokenExpiry: Date | null;
  photoUrl: string | null;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
} 
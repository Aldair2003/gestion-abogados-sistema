import { User, Canton, Persona } from '@prisma/client';

export interface CantonPermissionAttributes {
  id?: number;
  userId: number;
  cantonId: number;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PersonaPermissionAttributes {
  id?: number;
  userId: number;
  personaId: number;
  cantonId: number;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PermissionLogAttributes {
  id?: number;
  userId: number;
  targetId: number;
  cantonId?: number;
  personaId?: number;
  action: string;
  details?: string;
  createdAt?: Date;
}

export interface CantonPermissionWithRelations extends CantonPermissionAttributes {
  user: User;
  canton: Canton;
}

export interface PersonaPermissionWithRelations extends PersonaPermissionAttributes {
  user: User;
  persona: Persona;
  canton: Canton;
}

export interface PermissionLogWithRelations extends PermissionLogAttributes {
  user: User;
  canton?: Canton;
  persona?: Persona;
}

// DTOs para crear/actualizar permisos
export interface CreateCantonPermissionDTO {
  userId: number;
  cantonId: number;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
}

export interface UpdateCantonPermissionDTO {
  canView?: boolean;
  canCreate?: boolean;
  canEdit?: boolean;
}

export interface CreatePersonaPermissionDTO {
  userId: number;
  personaId: number;
  cantonId: number;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
}

export interface UpdatePersonaPermissionDTO {
  canView?: boolean;
  canCreate?: boolean;
  canEdit?: boolean;
}

// Tipos para respuestas paginadas
export interface PaginatedPermissionLogsResponse {
  logs: PermissionLogWithRelations[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

// Tipos para respuestas de permisos
export interface PermissionResponse {
  status: 'success' | 'error';
  data?: any;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
} 
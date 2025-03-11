export interface User {
  id: string;
  nombre: string;
  email: string;
  cedula: string;
  telefono: string;
  rol: string;
  isProfileCompleted: boolean;
  photoUrl?: string;
}

export interface Canton {
  id: string;
  nombre: string;
  provincia: string;
}

export interface Persona {
  id: string;
  nombre: string;
  cedula: string;
}

export interface BasePermission {
  id: string;
  userId: string;
  permissions: {
    view: boolean;
    edit: boolean;
    delete: boolean;
    createExpedientes: boolean;
  };
  user: User;
}

export interface CantonPermission extends BasePermission {
  cantonId: string;
  canton: Canton;
}

export interface PersonaPermission extends BasePermission {
  personaId: string;
  persona: Persona;
}

export type Permission = CantonPermission | PersonaPermission;

// Base interface para los datos de permisos
export interface BasePermissionData {
  userId: string;
  permissions?: {
    view?: boolean;
    edit?: boolean;
    delete?: boolean;
    createExpedientes?: boolean;
  };
}

// Interfaces específicas para cada tipo de permiso
export interface CantonPermissionData extends BasePermissionData {
  cantonId: string;
}

export interface PersonaPermissionData extends BasePermissionData {
  personaId: string;
}

// Tipo unión para manejar ambos tipos de permisos
export type PermissionData = CantonPermissionData | PersonaPermissionData; 
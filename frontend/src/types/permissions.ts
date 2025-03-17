export interface User {
  id: string;
  nombre: string;
  email: string;
  cedula: string;
  telefono: string;
  rol: string;
  isProfileCompleted: boolean;
  photoUrl?: string;
  cantones: Canton[];
}

export interface Canton {
  id: string;
  nombre: string;
  provincia?: string;
}

export interface Persona {
  id: string;
  nombre: string;
  cedula: string;
  cantonId: string;
  canton: Canton;
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

export interface CantonPermission {
  id: string;
  user: User;
  canton: Canton;
  cantonId: string;
  permissions: {
    view: boolean;
    edit: boolean;
    delete: boolean;
    createExpedientes: boolean;
  };
}

export interface PersonaPermission {
  id: string;
  user: User;
  persona: Persona;
  personas?: Persona[];
  cantones?: Canton[];
  canView: boolean;
  canManage: boolean;
  updatedAt: string;
}

export interface PermissionWithResource {
  id: string;
  userId: string;
  user: {
    id: string;
    nombre: string;
    email: string;
    photoUrl?: string;
  };
  permissions: {
    view: boolean;
    edit: boolean;
    delete: boolean;
    createExpedientes: boolean;
  };
  canton?: Canton;
  cantones?: Canton[];
  persona?: Persona;
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
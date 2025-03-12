// Enums
export enum UserRole {
  ADMIN = 'ADMIN',
  COLABORADOR = 'COLABORADOR'
}

export enum EstadoProfesional {
  ESTUDIANTE = 'ESTUDIANTE',
  GRADUADO = 'GRADUADO'
}

export interface ActivityDetails {
  description?: string;
  metadata?: {
    ipAddress?: string;
    browser?: string;
    location?: string;
    changes?: {
      before?: any;
      after?: any;
    };
  };
  userInfo?: {
    performer?: {
      id: number;
      nombre: string;
      email: string;
      rol: string;
    };
    target?: {
      id: number;
      nombre: string;
      email: string;
      rol: string;
    };
  };
  timestamp?: string;
  importance?: 'low' | 'medium' | 'high';
  status?: 'success' | 'error' | 'warning' | 'info';
  isImportant?: boolean;
}

export interface Activity {
  id: number;
  userId: number;
  action: string;
  category: string;
  details: ActivityDetails;
  createdAt: string;
  isImportant: boolean;
}

// Hacemos que ActivityLog extienda de Activity para mantener compatibilidad
export interface ActivityLog extends Activity {}

export interface User {
  id: number;
  email: string;
  nombre?: string;
  cedula?: string;
  telefono?: string;
  domicilio?: string;
  universidad?: string;
  estadoProfesional?: EstadoProfesional;
  numeroMatricula?: string;
  rol: UserRole;
  isActive: boolean;
  isProfileCompleted: boolean;
  isTemporaryPassword: boolean;
  needsOnboarding?: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  photoUrl?: string;
  tokenVersion?: number;
  refreshToken?: string;
  isFirstLogin: boolean;
}

export interface UserDetails extends User {
  activityLogs?: Activity[];
}

// Para cuando necesitemos datos parciales
export type PartialUser = Partial<User>;

// Para la actualización de usuarios
export interface UserUpdateData {
  nombre: string;
  email: string;
  cedula: string;
  telefono: string;
  rol: UserRole;
  isActive?: boolean;
}

export interface UserCreateData {
  email: string;
  rol: UserRole;
}

export type UserWithActivity = User & {
  activityLogs?: Activity[];
};

export interface SelectedUser {
  id: number;
  nombre: string;
  email: string;
  cedula: string;
  telefono: string;
  rol: UserRole;
  isActive: boolean;
}

export interface ActivityFilters {
  userId?: number;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  isImportant?: boolean;
  page?: number;
  limit?: number;
}

export interface ActivitySummary {
  total: number;
  categories: {
    [key: string]: number;
  };
  recentActivities: Activity[];
  importantActivities: Activity[];
} 
export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'colaborador';
  isActive: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    nombre: string;
    email: string;
    rol: string;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UpdateUserData {
  nombre?: string;
  cedula?: string;
  telefono?: string;
  email?: string;
  isActive?: boolean;
  rol?: 'admin' | 'colaborador';
} 
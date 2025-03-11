import type { Canton, Juez, JuezCanton } from '.prisma/client';

export type { Canton };

export interface CreateCantonDTO {
  nombre: string;
  codigo: string;
  imagenUrl?: string;
}

export interface UpdateCantonDTO {
  nombre?: string;
  codigo?: string;
  imagenUrl?: string;
  isActive?: boolean;
}

export interface CantonFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CantonResponse extends Canton {
  jueces: Array<JuezCanton & { juez: Juez }>;
}

export interface PaginatedCantonesResponse {
  cantones: CantonResponse[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface CreateJuezDTO {
  nombre: string;
  cantones: number[]; // IDs de los cantones
}

export interface UpdateJuezDTO {
  nombre?: string;
  cantones?: number[];
  isActive?: boolean;
}

export interface JuezWithCantones extends Omit<Juez, 'createdBy' | 'updatedBy'> {
  cantones: Array<JuezCanton & {
    canton: Omit<Canton, 'createdBy' | 'updatedBy'>;
  }>;
}

export interface JuezFilters {
  search?: string;
  cantonId?: number;
  isActive?: boolean;
  page?: number;
  limit?: number;
} 
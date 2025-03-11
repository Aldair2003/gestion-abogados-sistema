export interface Juez {
  id: number;
  nombre: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
  updatedBy: number;
}

export interface CreateJuezDto {
  nombre: string;
}

export interface UpdateJuezDto {
  nombre?: string;
  isActive?: boolean;
} 
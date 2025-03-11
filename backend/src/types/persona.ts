import type { Persona as PrismaPersona, Documento, TipoDocumento } from '.prisma/client';

export interface CreatePersonaDTO {
  cedula: string;
  telefono: string;
  contactoRef?: string;
  email?: string;
  domicilio?: string;
  matriculasVehiculo?: string[];
}

export interface UpdatePersonaDTO {
  telefono?: string;
  contactoRef?: string;
  email?: string;
  domicilio?: string;
  matriculasVehiculo?: string[];
  isActive?: boolean;
}

export interface PersonaWithDocumentos extends Omit<PrismaPersona, 'createdBy' | 'updatedBy'> {
  documentos: Array<Omit<Documento, 'createdBy' | 'updatedBy'>>;
}

export interface PersonaFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedPersonaResponse {
  personas: PersonaWithDocumentos[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface CreateDocumentoDTO {
  tipo: TipoDocumento;
  file: Express.Multer.File;
  personaId: number;
}

export interface UpdateDocumentoDTO {
  tipo?: TipoDocumento;
  isActive?: boolean;
}

export interface DocumentoWithPersona extends Omit<Documento, 'createdBy' | 'updatedBy'> {
  persona: Omit<PrismaPersona, 'createdBy' | 'updatedBy'>;
}

export interface DocumentoFilters {
  tipo?: TipoDocumento;
  personaId?: number;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export type PersonaResponse = PrismaPersona & { documentos: Documento[] };

export interface CreatePersonaDto {
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  contactoRef?: string;
  email?: string;
  domicilio?: string;
}

export interface UpdatePersonaDto {
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  contactoRef?: string;
  email?: string;
  domicilio?: string;
  isActive?: boolean;
}

export interface DocumentoUpload {
  tipo: TipoDocumento;
  file: Express.Multer.File;
} 
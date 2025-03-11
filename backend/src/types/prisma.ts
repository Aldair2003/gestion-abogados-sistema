import { PrismaClient, Prisma, ActivityCategory, UserRole, EstadoProfesional } from '.prisma/client';
import type { 
  Canton,
  Juez,
  JuezCanton,
  Persona,
  Documento,
  TipoDocumento
} from '.prisma/client';

// Re-exportar los enums como valores
export { ActivityCategory, UserRole, EstadoProfesional };

// Re-exportar los tipos
export type {
  Canton,
  Juez,
  JuezCanton,
  Persona,
  Documento,
  TipoDocumento
};

export type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
>;

// Extender los tipos de Prisma
export type UserWithActivityLogs = {
  include: {
    activityLogs?: {
      orderBy?: {
        createdAt?: 'asc' | 'desc'
      },
      take?: number
    },
    permissions?: {
      include?: {
        permission?: boolean
      }
    }
  }
};

export type UserFindUniqueArgs = Prisma.UserFindUniqueArgs & UserWithActivityLogs; 
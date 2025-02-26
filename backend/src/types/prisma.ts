import { Prisma } from '@prisma/client';

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
import { prisma } from '../lib/prisma';

export interface LogActivity {
  userId: number;
  action: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
}

export const logActivity = async (data: LogActivity) => {
  return prisma.activityLog.create({
    data: {
      userId: data.userId,
      action: data.action,
      details: data.details
    }
  });
};

export const getActivityLogs = async (filters: {
  userId?: number;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) => {
  const { page = 1, limit = 10 } = filters;
  
  return prisma.activityLog.findMany({
    where: {
      userId: filters.userId,
      action: filters.action,
      createdAt: {
        gte: filters.startDate,
        lte: filters.endDate
      }
    },
    include: {
      user: {
        select: {
          email: true,
          nombre: true,
          rol: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    skip: (page - 1) * limit,
    take: limit
  });
}; 
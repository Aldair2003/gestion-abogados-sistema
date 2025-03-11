import { prisma } from '../lib/prisma';
import { ActivityCategory } from '@prisma/client';
import { LogActivity } from '../types/activity';
import { Prisma } from '@prisma/client';

const serializeValue = (value: any): any => {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, serializeValue(v)])
    );
  }
  return value;
};

// Lista de acciones que no necesitan ser registradas
const IGNORED_ACTIONS = ['SESSION_KEEP_ALIVE'] as const;

// Lista de acciones importantes que siempre deben registrarse
const IMPORTANT_ACTIONS = [
  'LOGIN',
  'LOGOUT',
  'CREATE_USER',
  'UPDATE_USER',
  'DELETE_USER',
  'CREATE_CANTON',
  'UPDATE_CANTON',
  'DELETE_CANTON',
  'CREATE_JUEZ',
  'UPDATE_JUEZ',
  'DELETE_JUEZ',
  'UNAUTHORIZED_ACCESS',
  'SESSION_EXPIRED'
] as const;

type ActionType = typeof IMPORTANT_ACTIONS[number] | string;

export const logActivity = async (
  userId: number,
  actionType: ActionType,
  activity: LogActivity
): Promise<void> => {
  try {
    // Si la acción está en la lista de ignoradas, no la registramos
    if (IGNORED_ACTIONS.includes(actionType as typeof IGNORED_ACTIONS[number])) {
      return;
    }

    const { category, targetId, details, isImportant = IMPORTANT_ACTIONS.includes(actionType as typeof IMPORTANT_ACTIONS[number]) } = activity;
    
    // Serializar los datos para asegurar que son JSON-compatibles
    const serializedDetails = {
      ...details,
      metadata: serializeValue(details.metadata),
      changes: details.changes ? {
        before: details.changes.before ? serializeValue(details.changes.before) : undefined,
        after: details.changes.after ? serializeValue(details.changes.after) : undefined
      } : undefined
    };

    // Crear el log usando el tipo correcto
    await prisma.activityLog.create({
      data: {
        userId,
        action: actionType,
        category,
        targetId,
        isImportant,
        details: serializedDetails
      } as unknown as Prisma.ActivityLogUncheckedCreateInput
    });
  } catch (error) {
    console.error('Error al registrar actividad:', error);
    // No lanzar el error para no interrumpir el flujo principal
    console.error('Detalles del error:', {
      userId,
      actionType,
      activity
    });
  }
};

export const getActivityHistory = async (
  filters: {
    userId?: number;
    category?: ActivityCategory;
    targetId?: number;
    startDate?: Date;
    endDate?: Date;
  },
  page = 1,
  limit = 20
): Promise<{
  logs: any[];
  total: number;
  pages: number;
}> => {
  const where: Prisma.ActivityLogWhereInput = {
    ...(filters.userId && { userId: filters.userId }),
    ...(filters.category && { category: filters.category }),
    ...(filters.targetId && { targetId: filters.targetId }),
    ...(filters.startDate && {
      createdAt: {
        gte: filters.startDate
      }
    }),
    ...(filters.endDate && {
      createdAt: {
        lte: filters.endDate
      }
    })
  };

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            rol: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.activityLog.count({ where })
  ]);

  return {
    logs,
    total,
    pages: Math.ceil(total / limit)
  };
};

export const getPersonaHistory = async (
  personaId: number,
  page = 1,
  limit = 20
) => {
  return getActivityHistory(
    {
      category: ActivityCategory.PERSONA,
      targetId: personaId
    },
    page,
    limit
  );
};

export const getCantonHistory = async (
  cantonId: number,
  page = 1,
  limit = 20
) => {
  return getActivityHistory(
    {
      category: ActivityCategory.CANTON,
      targetId: cantonId
    },
    page,
    limit
  );
};

export const getUserActivityHistory = async (
  userId: number,
  page = 1,
  limit = 20
) => {
  return getActivityHistory(
    {
      userId
    },
    page,
    limit
  );
};

export const cleanOldLogs = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await prisma.activityLog.deleteMany({
      where: {
        AND: [
          { isImportant: false },
          { createdAt: { lt: thirtyDaysAgo } }
        ]
      }
    });
  } catch (error) {
    console.error('Error al limpiar logs antiguos:', error);
  }
}; 
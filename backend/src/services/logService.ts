import { prisma } from '../lib/prisma';
import { LogActivity, ActivityLogWhereInput } from '../types/activity';


export const logActivity = async (
  userId: number,
  action: string,
  data: LogActivity
): Promise<void> => {
  try {
    // Obtener información del usuario que realiza la acción
    const performer = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true
      }
    });

    // Si hay un usuario objetivo, obtener su información
    let targetUser = null;
    if (data.targetId) {
      targetUser = await prisma.user.findUnique({
        where: { id: data.targetId },
        select: {
          id: true,
          nombre: true,
          email: true,
          rol: true
        }
      });
    }

    const activityData = {
      userId,
      action,
      category: data.category,
      targetId: data.targetId,
      details: {
        ...data.details,
        userInfo: {
          performer: performer ? {
            id: performer.id,
            nombre: performer.nombre || 'Usuario sin nombre',
            email: performer.email,
            rol: performer.rol
          } : undefined,
          target: targetUser ? {
            id: targetUser.id,
            nombre: targetUser.nombre || 'Usuario sin nombre',
            email: targetUser.email,
            rol: targetUser.rol
          } : undefined
        },
        timestamp: new Date().toISOString(),
        description: data.details?.description || getDefaultDescription(action, performer?.nombre, targetUser?.nombre)
      },
      isImportant: data.isImportant || false
    };

    await prisma.activityLog.create({
      data: activityData
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
};

const getDefaultDescription = (action: string, performerName?: string | null, targetName?: string | null): string => {
  const performer = performerName || 'Usuario';
  const target = targetName || 'otro usuario';
  
  const descriptions: { [key: string]: string } = {
    'DEACTIVATE_USER': `${performer} desactivó la cuenta de ${target}`,
    'ACTIVATE_USER': `${performer} activó la cuenta de ${target}`,
    'UPDATE_USER': `${performer} actualizó la información de ${target}`,
    'DELETE_USER': `${performer} eliminó la cuenta de ${target}`,
    'CHANGE_ROLE': `${performer} cambió el rol de ${target}`,
    'CREATE_USER': `${performer} creó una cuenta para ${target}`,
    'IMPORT_USERS': `${performer} importó nuevos usuarios al sistema`,
    'BULK_DELETE_USERS': `${performer} realizó una eliminación masiva de usuarios`,
    'BULK_ACTIVATE_USERS': `${performer} realizó una activación masiva de usuarios`
  };

  return descriptions[action] || `${performer} realizó la acción ${action}`;
};

export const getActivityLogs = async (where: ActivityLogWhereInput) => {
  try {
    return await prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nombre: true,
            rol: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  } catch (error) {
    console.error('Error getting activity logs:', error);
    throw error;
  }
}; 
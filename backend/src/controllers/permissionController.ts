import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { 
  AuthHandler,
  AuthHandlerWithParams,
  AuthenticatedRequest,
  CantonParams,
  CantonUserParams,
  PersonaParams
} from '../types/common';
import { ActivityCategory } from '@prisma/client';
import { logActivity } from '../services/logService';

interface CreatePermissionRequest {
  nombre: string;
  descripcion: string;
  modulo: string;
}

interface AssignPermissionRequest {
  userId: number;
  permissionIds: number[];
}

// Helper para serializar objetos con fechas
const serializeForLog = (obj: any): any => {
  if (!obj) return null;
  if (Array.isArray(obj)) {
    return obj.map(serializeForLog);
  }
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, serializeForLog(value)])
    );
  }
  return obj;
};

export const createPermission = async (req: Request<{}, {}, CreatePermissionRequest>, res: Response): Promise<void> => {
  try {
    const { nombre, descripcion, modulo } = req.body;

    const existingPermission = await prisma.permission.findFirst({ where: { nombre } });
    if (existingPermission) {
      res.status(400).json({ message: 'El permiso ya existe' });
      return;
    }

    const permission = await prisma.permission.create({
      data: {
        nombre,
        descripcion,
        modulo
      }
    });

    res.status(201).json({
      message: 'Permiso creado exitosamente',
      permission
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al crear el permiso',
      error: (error as Error).message
    });
  }
};

export const getPermissions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const permissions = await prisma.permission.findMany();
    res.status(200).json(permissions);
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener los permisos',
      error: (error as Error).message
    });
  }
};

export const assignPermissionsToUser = async (
  req: Request<{}, {}, AssignPermissionRequest>,
  res: Response
): Promise<void> => {
  try {
    const { userId, permissionIds } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    const permissions = await prisma.permission.findMany({
      where: {
        id: { in: permissionIds }
      }
    });

    if (permissions.length !== permissionIds.length) {
      res.status(400).json({ message: 'Algunos permisos no existen' });
      return;
    }

    // Crear las relaciones de permisos
    await Promise.all(
      permissionIds.map(permissionId =>
        prisma.userPermission.create({
          data: {
            userId,
            permissionId
          }
        })
      )
    );

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    res.status(200).json({
      message: 'Permisos asignados exitosamente',
      user: {
        id: updatedUser?.id,
        nombre: updatedUser?.nombre,
        permissions: updatedUser?.permissions.map(p => p.permission)
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al asignar permisos',
      error: (error as Error).message
    });
  }
};

export const getUserPermissions: AuthHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        rol: true,
        isActive: true
      }
    });

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    // Definir permisos basados en el rol
    const permissions = {
      // Permisos de administrador
      canCreateUsers: user.rol.toLowerCase() === 'admin',
      canEditUsers: user.rol.toLowerCase() === 'admin',
      canDeleteUsers: user.rol.toLowerCase() === 'admin',
      canViewUsers: user.rol.toLowerCase() === 'admin',
      canAssignRoles: user.rol.toLowerCase() === 'admin',
      
      // Permisos básicos (todos los usuarios)
      canViewOwnProfile: true,
      canEditOwnProfile: true,
      
      // Permisos específicos de colaborador
      canCreateCases: ['admin', 'colaborador'].includes(user.rol.toLowerCase()),
      canViewOwnCases: true
    };

    res.json({
      userId: user.id,
      rol: user.rol,
      isActive: user.isActive,
      permissions
    });

  } catch (error) {
    console.error('Error al obtener permisos:', error);
    res.status(500).json({ message: 'Error al obtener permisos' });
  }
};

// Obtener todos los permisos de cantones
export const getAllCantonPermissions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let permissions;

    // Si es admin, puede ver todos los permisos
    if (req.user.rol === 'ADMIN') {
      permissions = await prisma.cantonPermission.findMany({
        include: {
          canton: true,
          user: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rol: true,
              photoUrl: true
            }
          }
        }
      });
    } else {
      // Si es colaborador, solo puede ver sus propios permisos
      permissions = await prisma.cantonPermission.findMany({
        where: {
          userId: req.user.id
        },
        include: {
          canton: true,
          user: {
            select: {
              id: true,
              nombre: true,
              email: true,
              rol: true,
              photoUrl: true
            }
          }
        }
      });
    }

    res.json({
      status: 'success',
      data: {
        permissions: permissions
      }
    });
  } catch (error) {
    console.error('Error al obtener permisos de cantones:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener permisos de cantones',
      error: (error as Error).message
    });
  }
};

// Obtener permisos por cantón
export const getPermissionsByCanton: AuthHandlerWithParams<CantonParams> = async (req, res, next) => {
  try {
    const { cantonId } = req.params;

    const permissions = await prisma.cantonPermission.findMany({
      where: { cantonId: Number(cantonId) },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true
          }
        },
        canton: true
      }
    });

    res.json({
      status: 'success',
      data: permissions
    });
  } catch (error) {
    next(error);
  }
};

// Asignar permisos de cantón
export const assignCantonPermission: AuthHandlerWithParams<CantonUserParams> = async (req, res, next) => {
  try {
    const { cantonId, userId } = req.params;
    const { canView, canCreate, canEdit } = req.body;

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) }
    });

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'Usuario no encontrado'
      });
      return;
    }

    // Verificar que el cantón existe
    const canton = await prisma.canton.findUnique({
      where: { id: Number(cantonId) }
    });

    if (!canton) {
      res.status(404).json({
        status: 'error',
        message: 'Cantón no encontrado'
      });
      return;
    }

    // Obtener permisos anteriores si existen
    const previousPermission = await prisma.cantonPermission.findUnique({
      where: {
        userId_cantonId: {
          userId: Number(userId),
          cantonId: Number(cantonId)
        }
      }
    });

    // Crear o actualizar permisos
    const permission = await prisma.cantonPermission.upsert({
      where: {
        userId_cantonId: {
          userId: Number(userId),
          cantonId: Number(cantonId)
        }
      },
      update: {
        canView,
        canCreate,
        canEdit
      },
      create: {
        userId: Number(userId),
        cantonId: Number(cantonId),
        canView,
        canCreate,
        canEdit
      }
    });

    // Registrar actividad
    await logActivity(req.user!.id, 
      previousPermission ? 'UPDATE_CANTON_PERMISSION' : 'CREATE_CANTON_PERMISSION',
      {
        category: ActivityCategory.PERMISSION_CHANGE,
        targetId: permission.id,
        details: {
          description: `${previousPermission ? 'Actualización' : 'Asignación'} de permisos de cantón`,
          metadata: {
            before: serializeForLog(previousPermission),
            after: serializeForLog(permission)
          }
        }
      }
    );

    res.json({
      status: 'success',
      data: permission
    });
  } catch (error) {
    next(error);
  }
};

// Revocar permisos de cantón
export const revokeCantonPermission: AuthHandlerWithParams<CantonUserParams> = async (req, res, next) => {
  try {
    const { cantonId, userId } = req.params;

    // Verificar que el permiso existe
    const permission = await prisma.cantonPermission.findUnique({
      where: {
        userId_cantonId: {
          userId: Number(userId),
          cantonId: Number(cantonId)
        }
      }
    });

    if (!permission) {
      res.status(404).json({
        status: 'error',
        message: 'Permiso no encontrado'
      });
      return;
    }

    // Eliminar el permiso
    await prisma.cantonPermission.delete({
      where: {
        userId_cantonId: {
          userId: Number(userId),
          cantonId: Number(cantonId)
        }
      }
    });

    // Registrar actividad
    await logActivity(req.user!.id, 'REVOKE_CANTON_PERMISSION', {
      category: ActivityCategory.PERMISSION_CHANGE,
      targetId: permission.id,
      details: {
        description: `Revocación de permisos de cantón`,
        metadata: {
          revokedPermission: serializeForLog(permission)
        }
      }
    });

    res.json({
      status: 'success',
      message: 'Permiso revocado correctamente'
    });
  } catch (error) {
    next(error);
  }
};

// Obtener permisos de personas
export const getPersonaPermissions = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const permissions = await prisma.personaPermission.findMany({
      include: {
        persona: true,
        user: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true
          }
        }
      }
    });

    res.json({
      status: 'success',
      data: permissions
    });
  } catch (error) {
    next(error);
  }
};

// Asignar permisos de persona
export const assignPersonaPermission: AuthHandlerWithParams<PersonaParams> = async (req, res, next) => {
  try {
    const { personaId, userId } = req.params;
    const { canView, canCreate, canEdit } = req.body;

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) }
    });

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'Usuario no encontrado'
      });
      return;
    }

    // Verificar que la persona existe
    const persona = await prisma.persona.findUnique({
      where: { id: Number(personaId) }
    });

    if (!persona) {
      res.status(404).json({
        status: 'error',
        message: 'Persona no encontrada'
      });
      return;
    }

    // Obtener el cantón de la persona
    const canton = await prisma.canton.findUnique({
      where: { id: persona.cantonId }
    });

    if (!canton) {
      res.status(404).json({
        status: 'error',
        message: 'Cantón no encontrado para esta persona'
      });
      return;
    }

    // Obtener permisos anteriores si existen
    const previousPermission = await prisma.personaPermission.findUnique({
      where: {
        userId_personaId: {
          userId: Number(userId),
          personaId: Number(personaId)
        }
      }
    });

    // Crear o actualizar permisos
    const permission = await prisma.personaPermission.upsert({
      where: {
        userId_personaId: {
          userId: Number(userId),
          personaId: Number(personaId)
        }
      },
      update: {
        canView,
        canCreate,
        canEdit
      },
      create: {
        userId: Number(userId),
        personaId: Number(personaId),
        cantonId: canton.id,
        canView,
        canCreate,
        canEdit
      }
    });

    // Registrar actividad
    await logActivity(req.user!.id, 
      previousPermission ? 'UPDATE_PERSONA_PERMISSION' : 'CREATE_PERSONA_PERMISSION',
      {
        category: ActivityCategory.PERMISSION_CHANGE,
        targetId: permission.id,
        details: {
          description: `${previousPermission ? 'Actualización' : 'Asignación'} de permisos de persona`,
          metadata: {
            before: serializeForLog(previousPermission),
            after: serializeForLog(permission)
          }
        }
      }
    );

    res.json({
      status: 'success',
      data: permission
    });
  } catch (error) {
    next(error);
  }
};

// Revocar permisos de persona
export const revokePersonaPermission: AuthHandlerWithParams<PersonaParams> = async (req, res, next) => {
  try {
    const { personaId, userId } = req.params;

    // Verificar que el permiso existe
    const permission = await prisma.personaPermission.findUnique({
      where: {
        userId_personaId: {
          userId: Number(userId),
          personaId: Number(personaId)
        }
      }
    });

    if (!permission) {
      res.status(404).json({
        status: 'error',
        message: 'Permiso no encontrado'
      });
      return;
    }

    // Eliminar el permiso
    await prisma.personaPermission.delete({
      where: {
        userId_personaId: {
          userId: Number(userId),
          personaId: Number(personaId)
        }
      }
    });

    // Registrar actividad
    await logActivity(req.user!.id, 'REVOKE_PERSONA_PERMISSION', {
      category: ActivityCategory.PERMISSION_CHANGE,
      targetId: permission.id,
      details: {
        description: `Revocación de permisos de persona`,
        metadata: {
          revokedPermission: serializeForLog(permission)
        }
      }
    });

    res.json({
      status: 'success',
      message: 'Permiso revocado correctamente'
    });
  } catch (error) {
    next(error);
  }
};

// Obtener logs de permisos
export const getPermissionLogs = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const logs = await prisma.permissionLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      status: 'success',
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

// Obtener cantones asignados al usuario actual
export const getAssignedCantones = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Usuario no autenticado'
      });
      return;
    }

    // Obtener los permisos del usuario
    const permissions = await prisma.cantonPermission.findMany({
      where: {
        userId: userId,
        canView: true
      },
      include: {
        canton: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            imagenUrl: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                jueces: true
              }
            }
          }
        }
      }
    });

    // Transformar los datos para que coincidan con el formato esperado
    const cantones = permissions.map(permission => ({
      id: permission.canton.id,
      nombre: permission.canton.nombre,
      codigo: permission.canton.codigo,
      imagenUrl: permission.canton.imagenUrl,
      isActive: permission.canton.isActive,
      createdAt: permission.canton.createdAt,
      updatedAt: permission.canton.updatedAt,
      totalJueces: permission.canton._count.jueces
    }));

    res.json({
      status: 'success',
      data: {
        cantones
      }
    });
  } catch (error) {
    console.error('Error al obtener cantones asignados:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener los cantones asignados',
      error: (error as Error).message
    });
  }
};

// Asignar múltiples permisos de cantón
export const assignMultipleCantonPermissions = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { userId, cantonIds, permissions } = req.body;

    // Validar que los datos necesarios estén presentes
    if (!userId || !cantonIds || !Array.isArray(cantonIds) || cantonIds.length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'Datos inválidos o incompletos'
      });
      return;
    }

    // Usar una transacción para garantizar la consistencia
    const result = await prisma.$transaction(async (tx) => {
      // Verificar que el usuario existe
      const user = await tx.user.findUnique({
        where: { id: Number(userId) }
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar que todos los cantones existen
      const cantones = await tx.canton.findMany({
        where: {
          id: {
            in: cantonIds.map(id => Number(id))
          }
        }
      });

      if (cantones.length !== cantonIds.length) {
        throw new Error('Uno o más cantones no fueron encontrados');
      }

      // Eliminar permisos que no están en la nueva lista
      await tx.cantonPermission.deleteMany({
        where: {
          userId: Number(userId),
          cantonId: {
            notIn: cantonIds.map(id => Number(id))
          }
        }
      });

      // Crear o actualizar los permisos para cada cantón
      const updatedPermissions = await Promise.all(
        cantonIds.map(cantonId =>
          tx.cantonPermission.upsert({
            where: {
              userId_cantonId: {
                userId: Number(userId),
                cantonId: Number(cantonId)
              }
            },
            update: {
              canView: permissions?.view ?? true,
              canEdit: permissions?.edit ?? false,
              canCreate: permissions?.createExpedientes ?? false
            },
            create: {
              userId: Number(userId),
              cantonId: Number(cantonId),
              canView: permissions?.view ?? true,
              canEdit: permissions?.edit ?? false,
              canCreate: permissions?.createExpedientes ?? false
            }
          })
        )
      );

      // Registrar actividad
      await logActivity(req.user!.id, 'ASSIGN_MULTIPLE_CANTON_PERMISSIONS', {
        category: ActivityCategory.PERMISSION_CHANGE,
        targetId: Number(userId),
        details: {
          description: 'Actualización masiva de permisos de cantones',
          metadata: {
            userId,
            permissions: serializeForLog(updatedPermissions)
          }
        }
      });

      return updatedPermissions;
    });

    res.status(200).json({
      status: 'success',
      data: {
        permissions: result
      }
    });
  } catch (error) {
    console.error('Error al asignar permisos:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al asignar los permisos',
      error: (error as Error).message
    });
  }
}; 
import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { ApiErrorCode } from '../types/apiError';
import { AuthenticatedRequest, CantonParams, PersonaParams } from '../types/common';
import { CustomError } from '../utils/customError';
import { ParamsDictionary } from 'express-serve-static-core';

type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

interface IdParam extends ParamsDictionary {
  id: string;
}

// Verificar si el usuario tiene acceso al cantón
export const checkCantonAccess = async (
  req: AuthenticatedRequest<CantonParams>,
  _: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('=== Inicio checkCantonAccess ===');
    const { cantonId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.rol;
    
    console.log(`Verificando acceso al cantón ${cantonId} para usuario ${userId} con rol ${userRole}`);

    // Si es admin, tiene acceso total
    if (userRole === 'ADMIN') {
      console.log('Usuario es ADMIN, otorgando acceso total al cantón');
      return next();
    }

    // Verificar si el cantón existe
    const canton = await prisma.canton.findUnique({
      where: { id: Number(cantonId) }
    });

    if (!canton) {
      console.log(`Cantón ${cantonId} no encontrado`);
      throw new CustomError({
        code: ApiErrorCode.NOT_FOUND,
        message: 'Cantón no encontrado',
        status: 404
      });
    }

    console.log(`Cantón ${cantonId} (${canton.nombre}) encontrado, verificando permisos...`);

    // Verificar si el usuario tiene permiso en el cantón
    const cantonPermission = await prisma.cantonPermission.findFirst({
      where: {
        userId,
        cantonId: Number(cantonId),
        canView: true
      }
    });

    if (!cantonPermission) {
      console.log(`Usuario ${userId} no tiene permiso de visualización en el cantón ${cantonId}`);
      throw new CustomError({
        code: ApiErrorCode.FORBIDDEN,
        message: 'No tienes acceso a este cantón',
        status: 403
      });
    }

    console.log(`Usuario ${userId} tiene permiso en el cantón ${cantonId}: ${JSON.stringify(cantonPermission)}`);
    console.log('=== Fin checkCantonAccess ===');
    next();
  } catch (error) {
    console.error('Error en checkCantonAccess:', error);
    next(error);
  }
};

// Verificar si el usuario puede ver una persona específica
export const checkPersonaAccess = async (
  req: AuthenticatedRequest<PersonaParams>,
  _: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: personaId } = req.params;
    const userId = req.user.id;

    // Si es admin, tiene acceso total
    if (req.user.rol === 'ADMIN') {
      return next();
    }

    // Obtener la persona y su cantón
    const persona = await prisma.persona.findUnique({
      where: { id: Number(personaId) },
      include: {
        canton: true
      }
    });

    if (!persona) {
      throw new CustomError({
        code: ApiErrorCode.NOT_FOUND,
        message: 'Persona no encontrada',
        status: 404
      });
    }

    // Verificar acceso al cantón primero
    const cantonPermission = await prisma.cantonPermission.findFirst({
      where: {
        userId,
        cantonId: persona.cantonId,
        canView: true
      }
    });

    if (!cantonPermission) {
      throw new CustomError({
        code: ApiErrorCode.FORBIDDEN,
        message: 'No tienes acceso a este cantón',
        status: 403
      });
    }

    // Verificar si es el creador o tiene permiso específico
    const isCreator = persona.createdBy === userId;
    if (isCreator) {
      return next();
    }

    // Si no es el creador, verificar si tiene permiso específico
    const personaPermission = await prisma.personaPermission.findFirst({
      where: {
        userId,
        personaId: Number(personaId),
        canView: true
      }
    });

    if (!personaPermission) {
      throw new CustomError({
        code: ApiErrorCode.FORBIDDEN,
        message: 'No tienes permiso para ver esta persona',
        status: 403
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Verificar si el usuario puede crear personas en el cantón
export const checkCanCreatePersona = async (
  req: AuthenticatedRequest<CantonParams>,
  _: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { cantonId } = req.body;
    const userId = req.user.id;

    // Si es admin, tiene acceso total
    if (req.user.rol === 'ADMIN') {
      return next();
    }

    // Verificar acceso al cantón
    const cantonPermission = await prisma.cantonPermission.findFirst({
      where: {
        userId,
        cantonId: Number(cantonId),
        canView: true
      }
    });

    if (!cantonPermission) {
      throw new CustomError({
        code: ApiErrorCode.FORBIDDEN,
        message: 'No tienes acceso a este cantón',
        status: 403
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Verificar si el usuario puede editar la persona
export const checkCanEditPersona = async (
  req: AuthenticatedRequest<PersonaParams>,
  _: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('=== Inicio checkCanEditPersona ===');
    const { id: personaId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.rol;
    
    console.log(`Verificando permisos de edición para persona ${personaId}`);
    console.log(`Usuario: ${userId}, Rol: ${userRole}`);

    // Si es admin, tiene acceso total
    if (userRole === 'ADMIN') {
      console.log(`Usuario ${userId} es ADMIN, otorgando acceso total de edición`);
      return next();
    }

    // Obtener la persona
    const persona = await prisma.persona.findUnique({
      where: { id: Number(personaId) },
      include: {
        canton: true
      }
    });

    if (!persona) {
      console.log(`Persona ${personaId} no encontrada`);
      throw new CustomError({
        code: ApiErrorCode.NOT_FOUND,
        message: 'Persona no encontrada',
        status: 404
      });
    }

    console.log(`Persona encontrada: ID=${persona.id}, Creador=${persona.createdBy}, Cantón=${persona.cantonId}`);

    // Verificar acceso al cantón
    const cantonPermission = await prisma.cantonPermission.findFirst({
      where: {
        userId,
        cantonId: persona.cantonId,
        canView: true
      }
    });

    if (!cantonPermission) {
      console.log(`Usuario ${userId} no tiene permiso en el cantón ${persona.cantonId}`);
      throw new CustomError({
        code: ApiErrorCode.FORBIDDEN,
        message: 'No tienes acceso a este cantón',
        status: 403
      });
    }

    console.log(`Usuario ${userId} tiene permiso en el cantón ${persona.cantonId}`);

    // Verificar si es el creador o tiene permisos específicos
    const isCreator = persona.createdBy === userId;
    
    console.log(`¿El usuario ${userId} es el creador de la persona ${personaId}?`, isCreator);
    
    if (isCreator) {
      console.log(`Usuario ${userId} es el creador de la persona ${personaId}, permitiendo edición automática`);
      return next();
    }

    console.log(`Usuario ${userId} no es el creador, verificando permisos específicos...`);

    // Si no es el creador, verificar si tiene permiso específico de edición
    const personaPermission = await prisma.personaPermission.findFirst({
      where: {
        userId,
        personaId: Number(personaId)
      }
    });

    console.log(`Permisos específicos encontrados:`, personaPermission);

    if (!personaPermission?.canEdit) {
      console.log(`Usuario ${userId} no tiene permiso de edición para la persona ${personaId}`);
      throw new CustomError({
        code: ApiErrorCode.FORBIDDEN,
        message: 'No tienes permiso para editar esta persona o sus documentos',
        status: 403
      });
    }

    console.log(`Usuario ${userId} tiene permiso de edición para la persona ${personaId}`);
    console.log('=== Fin checkCanEditPersona ===');
    next();
  } catch (error) {
    console.error('Error en checkCanEditPersona:', error);
    next(error);
  }
};

// Middleware para verificar permisos de cantones
export const checkCantonPermissions = (action: PermissionAction) => {
  return async (req: AuthenticatedRequest<IdParam>, _res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const cantonId = req.params.id ? parseInt(req.params.id) : null;

      // Los administradores tienen todos los permisos
      if (req.user.rol === 'ADMIN') {
        return next();
      }

      // Para crear nuevos cantones, verificar permiso general
      if (action === 'create' && !cantonId) {
        const hasPermission = await prisma.userPermission.findFirst({
          where: {
            userId,
            permission: {
              nombre: 'canton.create'
            }
          }
        });

        if (!hasPermission) {
          throw new CustomError({
            code: ApiErrorCode.FORBIDDEN,
            message: 'No tienes permiso para crear cantones',
            status: 403
          });
        }

        return next();
      }

      // Para otras acciones, verificar permiso específico del cantón
      if (!cantonId) {
        throw new CustomError({
          code: ApiErrorCode.INVALID_INPUT,
          message: 'ID de cantón no proporcionado',
          status: 400
        });
      }

      const permission = await prisma.cantonPermission.findFirst({
        where: {
          userId,
          cantonId,
          ...(action === 'view' && { canView: true }),
          ...(action === 'edit' && { canEdit: true }),
          ...(action === 'create' && { canCreate: true })
        }
      });

      if (!permission) {
        throw new CustomError({
          code: ApiErrorCode.FORBIDDEN,
          message: `No tienes permiso para ${action} este cantón`,
          status: 403
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware para verificar permisos de personas
export const checkPersonaPermissions = (action: PermissionAction) => {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const personaId = req.params.id ? parseInt(req.params.id) : null;

      // Los administradores tienen todos los permisos
      if (req.user?.rol === 'ADMIN') {
        return next();
      }

      if (!userId) {
        throw new CustomError({
          code: ApiErrorCode.UNAUTHORIZED,
          message: 'Usuario no autenticado',
          status: 401
        });
      }

      // Para crear nuevas personas, verificar permiso general
      if (action === 'create' && !personaId) {
        const hasPermission = await prisma.userPermission.findFirst({
          where: {
            userId,
            permission: {
              nombre: 'crear_personas'
            }
          }
        });

        if (!hasPermission) {
          throw new CustomError({
            code: ApiErrorCode.FORBIDDEN,
            message: 'No tienes permiso para crear personas',
            status: 403
          });
        }

        return next();
      }

      // Para acciones sobre personas específicas
      if (personaId) {
        const personaPermission = await prisma.personaPermission.findFirst({
          where: {
            userId,
            personaId
          }
        });

        if (!personaPermission) {
          throw new CustomError({
            code: ApiErrorCode.FORBIDDEN,
            message: 'No tienes permisos sobre esta persona',
            status: 403
          });
        }

        const hasPermission = action === 'view' ? personaPermission.canView :
                            action === 'create' ? personaPermission.canCreate :
                            action === 'edit' ? personaPermission.canCreate :
                            action === 'delete' ? personaPermission.canCreate : false;

        if (!hasPermission) {
          throw new CustomError({
            code: ApiErrorCode.FORBIDDEN,
            message: `No tienes permiso para ${action} esta persona`,
            status: 403
          });
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}; 
import { AuthHandlerWithParams } from '../types/common';
import { CustomError } from '../utils/customError';
import { ApiErrorCode } from '../types/apiError';
import { prisma } from '../lib/prisma';
import { ParamsDictionary } from 'express-serve-static-core';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/common';

interface CantonIdParam extends ParamsDictionary {
  cantonId: string;
}

interface PersonaIdParam extends ParamsDictionary {
  personaId: string;
}

// Middleware para verificar acceso a un cantón
export const verifyCantonAccess: AuthHandlerWithParams<CantonIdParam> = async (
  req,
  _res,
  next
): Promise<void> => {
  try {
    const userId = req.user.id;
    const cantonId = Number(req.params.cantonId) || Number(req.body.cantonId);

    if (!cantonId) {
      throw new CustomError({
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'ID de cantón no proporcionado',
        status: 400
      });
    }

    // Los administradores tienen acceso completo
    if (req.user.rol === 'ADMIN') {
      next();
      return;
    }

    const permission = await prisma.cantonPermission.findUnique({
      where: {
        userId_cantonId: {
          userId,
          cantonId
        }
      }
    });

    if (!permission?.canView) {
      throw new CustomError({
        code: ApiErrorCode.FORBIDDEN,
        message: 'No tiene acceso a este cantón',
        status: 403
      });
    }

    // Agregar los permisos a la request para uso posterior
    req.cantonPermissions = permission;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware para verificar acceso a una persona
export const verifyPersonaAccess: AuthHandlerWithParams<PersonaIdParam> = async (
  req,
  _res,
  next
): Promise<void> => {
  try {
    const userId = req.user.id;
    const personaId = Number(req.params.personaId) || Number(req.body.personaId);

    if (!personaId) {
      throw new CustomError({
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'ID de persona no proporcionado',
        status: 400
      });
    }

    // Los administradores tienen acceso completo
    if (req.user.rol === 'ADMIN') {
      next();
      return;
    }

    const permission = await prisma.personaPermission.findUnique({
      where: {
        userId_personaId: {
          userId,
          personaId
        }
      }
    });

    if (!permission?.canView) {
      throw new CustomError({
        code: ApiErrorCode.FORBIDDEN,
        message: 'No tiene acceso a esta persona',
        status: 403
      });
    }

    // Agregar los permisos a la request para uso posterior
    req.personaPermissions = permission;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware para verificar permisos de edición en un cantón
export const verifyCantonEditAccess: AuthHandlerWithParams<CantonIdParam> = async (
  req,
  _res,
  next
): Promise<void> => {
  try {
    const userId = req.user.id;
    const cantonId = Number(req.params.cantonId) || Number(req.body.cantonId);

    if (!cantonId) {
      throw new CustomError({
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'ID de cantón no proporcionado',
        status: 400
      });
    }

    // Los administradores tienen acceso completo
    if (req.user.rol === 'ADMIN') {
      next();
      return;
    }

    const permission = await prisma.cantonPermission.findUnique({
      where: {
        userId_cantonId: {
          userId,
          cantonId
        }
      }
    });

    if (!permission?.canEdit) {
      throw new CustomError({
        code: ApiErrorCode.FORBIDDEN,
        message: 'No tiene permisos de edición en este cantón',
        status: 403
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware para verificar permisos de edición en una persona
export const verifyPersonaEditAccess: AuthHandlerWithParams<PersonaIdParam> = async (
  req,
  _res,
  next
): Promise<void> => {
  try {
    const userId = req.user.id;
    const personaId = Number(req.params.personaId) || Number(req.body.personaId);

    if (!personaId) {
      throw new CustomError({
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'ID de persona no proporcionado',
        status: 400
      });
    }

    // Los administradores tienen acceso completo
    if (req.user.rol === 'ADMIN') {
      next();
      return;
    }

    const permission = await prisma.personaPermission.findUnique({
      where: {
        userId_personaId: {
          userId,
          personaId
        }
      }
    });

    if (!permission?.canEdit) {
      throw new CustomError({
        code: ApiErrorCode.FORBIDDEN,
        message: 'No tiene permisos de edición en esta persona',
        status: 403
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware para verificar permisos de personas
export const checkPersonaPermission = (requiredPermission: 'view' | 'create' | 'edit') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      console.log(`=== Inicio checkPersonaPermission (${requiredPermission}) ===`);
      const userId = req.user.id;
      const personaId = Number(req.params.personaId);
      const cantonId = Number(req.params.cantonId);
      
      console.log(`Verificando permiso "${requiredPermission}" para persona ${personaId}`);
      console.log(`Usuario: ${userId}, Cantón: ${cantonId}`);

      // Si es admin, tiene todos los permisos
      if (req.user.rol === 'ADMIN') {
        console.log(`Usuario ${userId} es ADMIN, otorgando todos los permisos`);
        return next();
      }

      // Para crear personas, verificar permiso en el cantón
      if (requiredPermission === 'create') {
        console.log(`Verificando permiso para crear personas en cantón ${cantonId}`);
        const cantonPermission = await prisma.cantonPermission.findFirst({
          where: {
            userId,
            cantonId,
          }
        });

        console.log(`Permiso de cantón encontrado:`, cantonPermission);

        if (!cantonPermission) {
          console.log(`Usuario ${userId} no tiene permiso en el cantón ${cantonId}`);
          return res.status(403).json({
            status: 'error',
            message: 'No tiene permiso para crear personas en este cantón'
          });
        }

        const personaPermission = await prisma.personaPermission.findFirst({
          where: {
            userId,
            cantonId,
          }
        });

        console.log(`Permiso de persona para cantón encontrado:`, personaPermission);

        if (!personaPermission?.canCreate) {
          console.log(`Usuario ${userId} no tiene permiso para crear personas`);
          return res.status(403).json({
            status: 'error',
            message: 'No tiene permiso para crear personas'
          });
        }

        console.log(`Usuario ${userId} tiene permiso para crear personas en cantón ${cantonId}`);
        return next();
      }

      // Para ver o editar, verificar permisos específicos
      console.log(`Buscando persona con ID ${personaId}`);
      const persona = await prisma.persona.findUnique({
        where: { id: personaId }
      });

      if (!persona) {
        console.log(`Persona ${personaId} no encontrada`);
        return res.status(404).json({
          status: 'error',
          message: 'Persona no encontrada'
        });
      }

      console.log(`Persona encontrada: ID=${persona.id}, Creador=${persona.createdBy}`);

      // Si es el creador, tiene permiso de edición automáticamente
      const isCreator = persona.createdBy === userId;
      console.log(`¿El usuario ${userId} es el creador de la persona ${personaId}?`, isCreator);
      
      if (requiredPermission === 'edit' && isCreator) {
        console.log(`Usuario ${userId} es el creador de la persona ${personaId}, permitiendo edición automática`);
        return next();
      }

      // Verificar permisos específicos
      console.log(`Verificando permisos específicos para persona ${personaId}`);
      const permission = await prisma.personaPermission.findFirst({
        where: {
          userId,
          personaId
        }
      });

      console.log(`Permisos específicos encontrados:`, permission);

      if (!permission) {
        console.log(`Usuario ${userId} no tiene permisos para la persona ${personaId}`);
        return res.status(403).json({
          status: 'error',
          message: 'No tiene permisos para esta persona'
        });
      }

      const hasPermission = 
        (requiredPermission === 'view' && permission.canView) ||
        (requiredPermission === 'edit' && permission.canEdit);

      console.log(`¿Usuario ${userId} tiene permiso "${requiredPermission}" para persona ${personaId}?`, hasPermission);

      if (!hasPermission) {
        console.log(`Usuario ${userId} no tiene permiso "${requiredPermission}" para persona ${personaId}`);
        return res.status(403).json({
          status: 'error',
          message: `No tiene permiso para ${requiredPermission === 'view' ? 'ver' : 'editar'} esta persona`
        });
      }

      console.log(`Usuario ${userId} tiene permiso "${requiredPermission}" para persona ${personaId}`);
      console.log(`=== Fin checkPersonaPermission (${requiredPermission}) ===`);
      next();
    } catch (error) {
      console.error(`Error en checkPersonaPermission (${requiredPermission}):`, error);
      res.status(500).json({
        status: 'error',
        message: 'Error al verificar permisos'
      });
    }
  };
}; 
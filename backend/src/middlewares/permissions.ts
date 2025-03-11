import { NextFunction } from 'express';
import { RequestWithUser } from '../types/express';
import { CustomError } from '../utils/customError';
import { ApiErrorCode } from '../types/apiError';
import { prisma } from '../lib/prisma';

// Middleware para verificar acceso a un cantón
export const verifyCantonAccess = async (
  req: RequestWithUser,
  _res: any,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const cantonId = Number(req.params.cantonId || req.body.cantonId);

    if (!userId || !cantonId) {
      throw new CustomError({
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'ID de usuario o cantón no proporcionado',
        status: 400
      });
    }

    // Los administradores tienen acceso completo
    if (req.user?.rol === 'ADMIN') {
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
export const verifyPersonaAccess = async (
  req: RequestWithUser,
  _res: any,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const personaId = Number(req.params.personaId || req.body.personaId);

    if (!userId || !personaId) {
      throw new CustomError({
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'ID de usuario o persona no proporcionado',
        status: 400
      });
    }

    // Los administradores tienen acceso completo
    if (req.user?.rol === 'ADMIN') {
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
export const verifyCantonEditAccess = async (
  req: RequestWithUser,
  _res: any,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const cantonId = Number(req.params.cantonId || req.body.cantonId);

    if (!userId || !cantonId) {
      throw new CustomError({
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'ID de usuario o cantón no proporcionado',
        status: 400
      });
    }

    // Los administradores tienen acceso completo
    if (req.user?.rol === 'ADMIN') {
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
export const verifyPersonaEditAccess = async (
  req: RequestWithUser,
  _res: any,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const personaId = Number(req.params.personaId || req.body.personaId);

    if (!userId || !personaId) {
      throw new CustomError({
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'ID de usuario o persona no proporcionado',
        status: 400
      });
    }

    // Los administradores tienen acceso completo
    if (req.user?.rol === 'ADMIN') {
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

    if (!permission?.canEditOwn) {
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
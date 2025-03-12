import { AuthHandlerWithParams } from '../types/common';
import { CustomError } from '../utils/customError';
import { ApiErrorCode } from '../types/apiError';
import { prisma } from '../lib/prisma';
import { ParamsDictionary } from 'express-serve-static-core';

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
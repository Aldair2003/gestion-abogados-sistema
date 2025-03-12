import { Request, Response, NextFunction, RequestHandler } from 'express';
import { UserWithId } from './user';
import { CantonPermissionAttributes, PersonaPermissionAttributes } from './permissions';
import { ParamsDictionary } from 'express-serve-static-core';
import { ApiResponse } from './apiError';

// Extender Request de Express para incluir propiedades opcionales
declare module 'express' {
  interface Request {
    user?: UserWithId;
    cantonPermissions?: CantonPermissionAttributes;
    personaPermissions?: PersonaPermissionAttributes;
  }
}

export enum UserRole {
  ADMIN = 'admin',
  COLABORADOR = 'colaborador'
}

// Tipo base para Request con usuario autenticado
export type AuthenticatedRequest<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any
> = Request<P, ResBody, ReqBody> & {
  user: UserWithId;
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
  file?: Express.Multer.File;
};

// Tipos para handlers autenticados
export type AuthenticatedRequestHandler<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any
> = (
  req: AuthenticatedRequest<P, ResBody, ReqBody>,
  res: Response<ResBody>,
  next: NextFunction
) => Promise<void>;

// Interfaces base para parámetros
export interface BaseParams extends ParamsDictionary {
  [key: string]: string;
}

// Tipos específicos para los controladores de permisos
export interface CantonParams extends ParamsDictionary {
  id: string;
  cantonId: string;
  juezId: string;
}

export interface CantonUserParams extends CantonParams {
  userId: string;
}

export interface PersonaParams extends ParamsDictionary {
  personaId: string;
  userId: string;
}

// Tipos para handlers
export type AuthHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<any>;

export type AuthHandlerWithParams<P extends ParamsDictionary = ParamsDictionary> = (
  req: AuthenticatedRequest<P>,
  res: Response,
  next: NextFunction
) => Promise<any>;

export type TypedAuthHandler<T> = (
  req: AuthenticatedRequest<ParamsDictionary, any, T>,
  res: Response,
  next: NextFunction
) => Promise<any>;

// Helper mejorado para verificar autenticación
export const withAuth = <P = ParamsDictionary, ResBody = ApiResponse, ReqBody = any>(
  handler: AuthenticatedRequestHandler<P, ResBody, ReqBody>
): RequestHandler<P, ResBody, ReqBody> => {
  return async (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ 
        status: 'error',
        message: 'No autorizado',
        error: {
          code: 'UNAUTHORIZED',
          message: 'Usuario no autenticado',
          details: 'Se requiere autenticación para acceder a este recurso'
        }
      } as ResBody);
      return;
    }
    
    try {
      await handler(req as AuthenticatedRequest<P, ResBody, ReqBody>, res, next);
    } catch (error) {
      next(error);
    }
  };
};

// Helper para manejar errores en controladores asíncronos
export const asyncHandler = (handler: RequestHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

// Helper para controladores con body tipado
export const withTypedBody = <T>(handler: TypedAuthHandler<T>): AuthHandler => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      return await handler(req as AuthenticatedRequest<ParamsDictionary, any, T>, res, next);
    } catch (error) {
      next(error);
    }
  };
};
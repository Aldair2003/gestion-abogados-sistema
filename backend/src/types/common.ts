import { Request, Response, NextFunction, RequestHandler } from 'express';

export enum UserRole {
  ADMIN = 'admin',
  COLABORADOR = 'colaborador'
}

export interface RequestWithUser extends Request {
  user: {
    id: number;
    email: string;
    rol: UserRole;
  };
}

// Tipo base para controladores que requieren autenticación
export type AuthenticatedRequest = RequestWithUser;

// Tipo base para controladores con body tipado
export type TypedRequest<T> = AuthenticatedRequest & { body: T };

// Tipo base para todos los controladores
export type ExpressHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

// Tipo para controladores autenticados
export type AuthHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<any>;

// Tipo para controladores con body tipado
export type TypedHandler<T> = (
  req: TypedRequest<T>,
  res: Response,
  next: NextFunction
) => Promise<any>;

// Helper para manejar errores en controladores asíncronos
export const asyncHandler = (handler: ExpressHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

// Helper para verificar autenticación
export const withAuth = (handler: AuthHandler): ExpressHandler => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    return handler(req as AuthenticatedRequest, res, next);
  };
};

// Helper para controladores con body tipado
export const withBody = <T>(handler: TypedHandler<T>): AuthHandler => {
  return async (req, res, next) => {
    return handler(req as TypedRequest<T>, res, next);
  };
};
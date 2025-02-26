import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, UserWithId, RequestWithUser } from '../types/user';
import { logActivity } from '../services/logService';
import { ApiResponse, ApiErrorCode } from '../types/api';
import { prisma } from '../lib/prisma';

interface JwtPayload {
  id: number;
  email: string;
  rol: UserRole;
  isFirstLogin: boolean;
  isProfileCompleted: boolean;
}

export const authenticateToken = async (
  req: Request & { user?: UserWithId },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'Token no proporcionado' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // Verificar si el usuario existe y está activo
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        rol: true,
        isActive: true,
        isFirstLogin: true,
        isProfileCompleted: true
      }
    });

    if (!user || !user.isActive) {
      res.status(401).json({ message: 'Usuario no válido o inactivo' });
      return;
    }

    // Asignar el usuario al request
    const userInfo: UserWithId = {
      id: user.id,
      email: user.email,
      rol: user.rol as UserRole,
      isFirstLogin: user.isFirstLogin,
      isProfileCompleted: user.isProfileCompleted
    };

    req.user = userInfo;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Token inválido' });
      return;
    }
    res.status(500).json({ message: 'Error al validar token' });
  }
};

// Middleware para verificar rol de administrador
export const isAdmin = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.rol !== UserRole.ADMIN) {
      const response: ApiResponse = {
        status: 'error',
        message: 'Acceso denegado',
        error: {
          code: ApiErrorCode.FORBIDDEN,
          details: 'Se requieren permisos de administrador para esta acción'
        }
      };
      
      if (req.user) {
        await logActivity({
          userId: req.user.id,
          action: 'UNAUTHORIZED_ACCESS',
          details: {
            requiredRole: UserRole.ADMIN,
            userRole: req.user.rol,
            path: req.path
          }
        });
      }

      res.status(403).json(response);
      return;
    }
    next();
  } catch (error) {
    const response: ApiResponse = {
      status: 'error',
      message: 'Error al verificar permisos',
      error: {
        code: ApiErrorCode.INTERNAL_ERROR,
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      }
    };
    res.status(500).json(response);
  }
};

// Middleware para verificar rol de colaborador
export const isColaborador = async (
  req: RequestWithUser, 
  res: Response, 
  next: NextFunction
): Promise<Response | void> => {
  if (!req.user || req.user.rol !== UserRole.COLABORADOR) {
    return res.status(403).json({ 
      status: 'error',
      message: 'Acceso denegado'
    });
  }
  return next();
};

// Helper para manejar errores async
export const asyncHandler = (fn: RequestHandler): RequestHandler =>
  (req, res, next): Promise<void> => {
    return Promise.resolve(fn(req, res, next))
      .catch(error => {
        console.error('Error en handler async:', error);
        res.status(500).json({
          status: 'error',
          message: 'Error interno del servidor',
          error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
      });
  };

// Helper para verificar permisos
export const withRole = (allowedRoles: UserRole[]) => {
  return async (
    req: RequestWithUser, 
    res: Response, 
    next: NextFunction
  ): Promise<Response | void> => {
    if (!req.user || !allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        status: 'error',
        message: 'Acceso denegado'
      });
    }
    return next();
  };
};

// Helper para asegurar que el usuario está autenticado
export const withUser = (
  handler: (req: RequestWithUser, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => {
  return async (req: Request & { user?: UserWithId }, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    try {
      return await handler(req as RequestWithUser, res, next);
    } catch (error) {
      next(error);
    }
  };
};

// Middleware para requerir perfil completo
export const requireProfileCompletion = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user || req.user.isFirstLogin || !req.user.isProfileCompleted) {
    res.status(403).json({
      status: 'error',
      message: 'Debe completar su perfil primero',
      requiresProfileCompletion: true
    });
    return;
  }
  next();
};

// Exportar el middleware de autenticación con nombre consistente
export { authenticateToken as authMiddleware }; 
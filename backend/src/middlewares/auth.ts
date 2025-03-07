import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, ActivityCategory } from '@prisma/client';
import { logActivity } from '../services/logService';
import { ApiResponse, ApiErrorCode } from '../types/api';
import { prisma } from '../lib/prisma';
import { UserWithId } from '../types/user';

interface JwtPayload {
  id: number;
  email: string;
  rol: UserRole;
  isFirstLogin: boolean;
  isProfileCompleted: boolean;
  lastActivity?: string;
}

interface UserFromDB {
  id: number;
  email: string;
  nombre: string | null;
  rol: UserRole;
  isActive: boolean;
  isFirstLogin: boolean;
  isProfileCompleted: boolean;
  tokenVersion: number;
  lastLogin: Date | null;
}

export interface RequestWithUser extends Request {
  user?: UserWithId;
}

// Middleware principal de autenticación
export const authenticateToken = async (
  req: Request & { user?: UserWithId },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      await logActivity(-1, 'UNAUTHORIZED_ACCESS', {
        category: ActivityCategory.AUTH,
        details: {
          metadata: {
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            path: req.path,
            method: req.method
          }
        }
      });
      res.status(401).json({ 
        status: 'error',
        message: 'Token no proporcionado',
        error: {
          code: ApiErrorCode.UNAUTHORIZED,
          details: 'No se proporcionó un token de autenticación'
        }
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // Verificar última actividad
    const lastActivity = decoded.lastActivity ? new Date(decoded.lastActivity) : new Date();
    const now = new Date();
    const inactivityTime = now.getTime() - lastActivity.getTime();
    const maxInactivityTime = 30 * 60 * 1000; // 30 minutos

    if (inactivityTime > maxInactivityTime) {
      await logActivity(decoded.id, 'SESSION_EXPIRED', {
        category: ActivityCategory.AUTH,
        details: {
          metadata: {
            reason: 'Inactividad',
            inactiveTime: `${Math.round(inactivityTime / 1000 / 60)} minutos`
          }
        }
      });
      res.status(401).json({
        status: 'error',
        message: 'Sesión expirada por inactividad',
        error: {
          code: ApiErrorCode.UNAUTHORIZED,
          details: 'La sesión ha expirado por inactividad'
        }
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        isActive: true,
        isFirstLogin: true,
        isProfileCompleted: true,
        tokenVersion: true,
        lastLogin: true
      }
    }) as UserFromDB | null;

    console.log('User from database:', user);

    if (!user || !user.isActive) {
      await logActivity(decoded.id, 'UNAUTHORIZED_ACCESS', {
        category: ActivityCategory.AUTH,
        details: {
          metadata: {
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            path: req.path,
            method: req.method,
            reason: !user ? 'Usuario no encontrado' : 'Usuario inactivo'
          }
        }
      });
      res.status(401).json({ 
        status: 'error',
        message: 'Usuario no válido o inactivo',
        error: {
          code: ApiErrorCode.UNAUTHORIZED,
          details: !user ? 'Usuario no encontrado' : 'Usuario inactivo'
        }
      });
      return;
    }

    // Asegurarnos de que tokenVersion esté presente
    if (typeof user.tokenVersion !== 'number') {
      console.error('TokenVersion is missing or invalid:', user.tokenVersion);
      // Si no está presente, usar el valor por defecto de 0
      user.tokenVersion = 0;
    }

    const userInfo = {
      id: user.id,
      email: user.email,
      nombre: user.nombre || undefined,
      rol: user.rol,
      isFirstLogin: user.isFirstLogin,
      isProfileCompleted: user.isProfileCompleted,
      tokenVersion: user.tokenVersion,
      lastActivity: decoded.lastActivity
    } as UserWithId;

    req.user = userInfo;
    next();
  } catch (error) {
    console.error('Error de autenticación:', error);
    
    // Solo registrar actividad si no es un error de token malformado
    if (!(error instanceof jwt.JsonWebTokenError)) {
      try {
        await logActivity(-1, 'UNAUTHORIZED_ACCESS', {
          category: ActivityCategory.AUTH,
          details: {
            metadata: {
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'],
              path: req.path,
              method: req.method,
              error: error instanceof Error ? error.message : 'Error desconocido'
            }
          }
        });
      } catch (logError) {
        console.error('Error al registrar actividad:', logError);
      }
    }

    const response: ApiResponse = {
      status: 'error',
      message: 'Error de autenticación',
      error: {
        code: ApiErrorCode.UNAUTHORIZED,
        details: error instanceof jwt.JsonWebTokenError ? 
          'Token inválido' : 
          'Error al validar token'
      }
    };

    res.status(401).json(response);
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
        await logActivity(req.user.id, 'UNAUTHORIZED_ACCESS', {
          category: ActivityCategory.AUTH,
          details: {
            metadata: {
              requiredRole: UserRole.ADMIN,
              userRole: req.user.rol,
              path: req.path,
              ipAddress: req.ip,
              userAgent: req.headers['user-agent']
            }
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
    const response: ApiResponse = {
      status: 'error',
      message: 'Acceso denegado',
      error: {
        code: ApiErrorCode.FORBIDDEN,
        details: 'Se requieren permisos de colaborador para esta acción'
      }
    };

    if (req.user) {
      await logActivity(req.user.id, 'UNAUTHORIZED_ACCESS', {
        category: ActivityCategory.AUTH,
        details: {
          metadata: {
            requiredRole: UserRole.COLABORADOR,
            userRole: req.user.rol,
            path: req.path,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          }
        }
      });
    }

    return res.status(403).json(response);
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
          error: {
            code: ApiErrorCode.INTERNAL_ERROR,
            details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
          }
        });
      });
  };

// Helper para verificar permisos por roles
export const withRole = (allowedRoles: UserRole[]) => {
  return async (
    req: RequestWithUser, 
    res: Response, 
    next: NextFunction
  ): Promise<Response | void> => {
    if (!req.user || !allowedRoles.includes(req.user.rol)) {
      const response: ApiResponse = {
        status: 'error',
        message: 'Acceso denegado',
        error: {
          code: ApiErrorCode.FORBIDDEN,
          details: 'No tiene los permisos necesarios para esta acción'
        }
      };

      if (req.user) {
        await logActivity(req.user.id, 'UNAUTHORIZED_ACCESS', {
          category: ActivityCategory.AUTH,
          details: {
            metadata: {
              requiredRoles: allowedRoles,
              userRole: req.user.rol,
              path: req.path,
              ipAddress: req.ip,
              userAgent: req.headers['user-agent']
            }
          }
        });
      }

      return res.status(403).json(response);
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
      return res.status(401).json({ 
        status: 'error',
        message: 'No autorizado',
        error: {
          code: ApiErrorCode.UNAUTHORIZED,
          details: 'Usuario no autenticado'
        }
      });
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
    const response: ApiResponse = {
      status: 'error',
      message: 'Perfil incompleto',
      error: {
        code: ApiErrorCode.FORBIDDEN,
        details: 'Debe completar su perfil primero'
      },
      requiresProfileCompletion: true
    };

    res.status(403).json(response);
    return;
  }
  next();
};

// Exportar el middleware de autenticación con nombre consistente
export { authenticateToken as authMiddleware };

export const isAuthenticated = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        status: 'error',
        message: 'No autorizado',
        error: {
          code: ApiErrorCode.UNAUTHORIZED,
          details: 'Token no proporcionado'
        }
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // Obtener el usuario de la base de datos para acceder a tokenVersion
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        tokenVersion: true
      }
    });

    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'No autorizado',
        error: {
          code: ApiErrorCode.UNAUTHORIZED,
          details: 'Usuario no encontrado'
        }
      });
      return;
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      rol: decoded.rol,
      isFirstLogin: decoded.isFirstLogin,
      isProfileCompleted: decoded.isProfileCompleted,
      tokenVersion: user.tokenVersion,
      lastActivity: decoded.lastActivity
    };
    
    next();
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'No autorizado',
      error: {
        code: ApiErrorCode.UNAUTHORIZED,
        details: 'Token inválido'
      }
    });
  }
}; 
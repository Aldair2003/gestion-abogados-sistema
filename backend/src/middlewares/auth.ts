import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { logActivity } from '../services/logService';
import { ApiResponse, ApiErrorCode } from '../types/apiError';
import { prisma } from '../lib/prisma';
import { UserRole } from '@prisma/client';
import { ActivityCategory } from '../types/prisma';
import { AuthenticatedRequest } from '../types/common';
import { UserWithId } from '../types/user';

// Clase ApiError para manejo de errores
class ApiError extends Error {
  constructor(
    public statusCode: number,
    public error: {
      code: ApiErrorCode;
      message: string;
      details: string;
    }
  ) {
    super(error.message);
  }
}

interface ExtendedJwtPayload extends jwt.JwtPayload {
  id: number;
  email: string;
  rol: UserRole;
  isFirstLogin: boolean;
  isProfileCompleted: boolean;
  lastActivity?: string;
  tokenVersion?: number;
  iat?: number;
  exp?: number;
  sessionWarning?: {
    shown: boolean;
    timestamp: string;
    acknowledged?: boolean;
  };
}

// Extender la interfaz Request de Express
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const maxInactivityTime = 60 * 60 * 1000; // 1 hora
const warningTime = 20 * 60 * 1000;      // 20 minutos
const tokenRefreshThreshold = 30 * 60 * 1000; // 30 minutos
const gracePeriod = 5 * 60 * 1000;       // 5 minutos de gracia

// Middleware principal de autenticación
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('[Auth] Iniciando verificación de token para ruta:', req.path);
    
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('[Auth] Token no proporcionado');
      throw new ApiError(401, {
        code: ApiErrorCode.UNAUTHORIZED,
        message: 'Token no proporcionado',
        details: 'No se proporcionó un token de autenticación'
      });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as ExtendedJwtPayload;
    console.log('[Auth] Token decodificado para usuario:', decoded.email);

    // Obtener el usuario y verificar que exista
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        rol: true,
        tokenVersion: true,
        isFirstLogin: true,
        isProfileCompleted: true
      }
    });

    if (!user) {
      console.log('[Auth] Usuario no encontrado:', decoded.email);
      throw new ApiError(401, {
        code: ApiErrorCode.UNAUTHORIZED,
        message: 'Usuario no encontrado',
        details: 'El usuario asociado al token no existe'
      });
    }

    // Verificar la versión del token
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion) {
      console.log('[Auth] Versión de token inválida para usuario:', user.email, {
        decodedVersion: decoded.tokenVersion,
        userVersion: user.tokenVersion
      });
      
      // Intentar renovar el token si la diferencia es de solo 1 versión
      if (user.tokenVersion === (decoded.tokenVersion || 0) + 1) {
        console.log('[Auth] Intentando renovar token por diferencia de versión');
        const newToken = jwt.sign(
          {
            id: user.id,
            email: user.email,
            rol: user.rol,
            tokenVersion: user.tokenVersion,
            isFirstLogin: user.isFirstLogin,
            isProfileCompleted: user.isProfileCompleted
          },
          process.env.JWT_SECRET!,
          { expiresIn: '12h' }
        );

        res.set('Authorization', `Bearer ${newToken}`);
        decoded.tokenVersion = user.tokenVersion;
      } else {
        throw new ApiError(401, {
          code: ApiErrorCode.INVALID_TOKEN,
          message: 'Token inválido',
          details: 'El token ha sido revocado'
        });
      }
    }

    // Calcular tiempo de inactividad basado en el iat del token
    const tokenIat = decoded.iat ? decoded.iat * 1000 : Date.now();
    const inactivityTime = Date.now() - tokenIat;

    console.log('[Auth] Tiempo de inactividad para usuario:', {
      email: user.email,
      inactivityTime: Math.floor(inactivityTime / 1000),
      maxInactivityTime: Math.floor(maxInactivityTime / 1000),
      warningTime: Math.floor(warningTime / 1000),
      gracePeriod: Math.floor(gracePeriod / 1000)
    });

    // Verificar si el usuario está en período de gracia
    if (inactivityTime > maxInactivityTime + gracePeriod) {
      console.log('[Auth] Sesión expirada por inactividad para usuario:', user.email);
      throw new ApiError(401, {
        code: ApiErrorCode.SESSION_EXPIRED,
        message: 'Sesión expirada',
        details: 'La sesión ha expirado por inactividad'
      });
    }

    // Renovar token si es necesario
    const tokenAge = Date.now() - tokenIat;
    if (tokenAge > (12 * 60 * 60 * 1000 - tokenRefreshThreshold)) {
      console.log('[Auth] Renovando token para usuario:', user.email);
      const newToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          rol: user.rol,
          tokenVersion: user.tokenVersion
        },
        process.env.JWT_SECRET!,
        { expiresIn: '12h' }
      );

      res.set('Authorization', `Bearer ${newToken}`);
      
      // Registrar renovación de token
      await logActivity(
        user.id,
        'TOKEN_RENEWED',
        {
          category: ActivityCategory.AUTH,
          details: {
            description: 'Token renovado automáticamente',
            metadata: {
              tokenAge: Math.floor(tokenAge / 1000),
              newExpiry: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
            }
          }
        }
      );
    }

    // Agregar información del usuario a la request
    req.user = user as UserWithId;
    next();
  } catch (error) {
    console.error('[Auth] Error en autenticación:', error);
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        status: 'error',
        error: {
          code: ApiErrorCode.TOKEN_EXPIRED,
          message: 'Token expirado',
          details: 'El token de autenticación ha expirado'
        }
      });
      return;
    }
    
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        status: 'error',
        error: error.error
      });
      return;
    }

    res.status(401).json({
      status: 'error',
      error: {
        code: ApiErrorCode.INVALID_TOKEN,
        message: 'Token inválido',
        details: 'Token inválido o expirado'
      }
    });
    return;
  }
};

// Middleware para verificar rol de administrador
export const isAdmin: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || user.rol !== UserRole.ADMIN) {
      const response: ApiResponse = {
        status: 'error',
        message: 'Acceso denegado',
        error: {
          code: ApiErrorCode.FORBIDDEN,
          message: 'Se requieren permisos de administrador',
          details: 'Se requieren permisos de administrador para esta acción'
        }
      };
      
      if (user) {
        await logActivity(user.id, 'UNAUTHORIZED_ACCESS', {
          category: ActivityCategory.AUTH,
          details: {
            description: `Intento de acceso a ruta protegida de administrador: ${req.path}`,
            metadata: {
              requiredRole: UserRole.ADMIN,
              userRole: user.rol,
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
    next(error);
  }
};

// Middleware para verificar rol de colaborador
export const isColaborador = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<Response | void> => {
  if (req.user.rol !== UserRole.COLABORADOR) {
    const response: ApiResponse = {
      status: 'error',
      message: 'Acceso denegado',
      error: {
        code: ApiErrorCode.FORBIDDEN,
        message: 'Se requieren permisos de colaborador',
        details: 'Se requieren permisos de colaborador para esta acción'
      }
    };

    await logActivity(req.user.id, 'UNAUTHORIZED_ACCESS', {
      category: ActivityCategory.AUTH,
      details: {
        description: `Intento de acceso a ruta protegida de colaborador: ${req.path}`,
        metadata: {
          requiredRole: UserRole.COLABORADOR,
          userRole: req.user.rol,
          path: req.path,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      }
    });

    return res.status(403).json(response);
  }
  return next();
};

// Helper para manejar errores async
export const asyncHandler = (fn: RequestHandler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): Promise<void> => {
    return Promise.resolve(fn(req, res, next))
      .catch(next);
  };

// Helper para verificar permisos por roles
export const withRole = (allowedRoles: UserRole[]) => {
  return async (
    req: AuthenticatedRequest, 
    res: Response, 
    next: NextFunction
  ): Promise<Response | void> => {
    if (!req.user || !allowedRoles.includes(req.user.rol)) {
      const response: ApiResponse = {
        status: 'error',
        message: 'Acceso denegado',
        error: {
          code: ApiErrorCode.FORBIDDEN,
          message: 'Permisos insuficientes',
          details: 'No tiene los permisos necesarios para esta acción'
        }
      };

      await logActivity(req.user.id, 'UNAUTHORIZED_ACCESS', {
        category: ActivityCategory.AUTH,
        details: {
          description: `Intento de acceso a ruta con roles restringidos: ${req.path}`,
          metadata: {
            requiredRoles: allowedRoles,
            userRole: req.user.rol,
            path: req.path,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          }
        }
      });

      return res.status(403).json(response);
    }
    return next();
  };
};

// Helper para asegurar que el usuario está autenticado
export const withUser = (
  handler: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        status: 'error',
        message: 'No autorizado',
        error: {
          code: ApiErrorCode.UNAUTHORIZED,
          message: 'Usuario no autenticado',
          details: 'Se requiere autenticación para acceder a este recurso'
        }
      });
    }
    try {
      return await handler(req as AuthenticatedRequest, res, next);
    } catch (error) {
      next(error);
    }
  };
};

// Middleware para requerir perfil completo
export const requireProfileCompletion = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user || req.user.isFirstLogin || !req.user.isProfileCompleted) {
    const response: ApiResponse = {
      status: 'error',
      message: 'Perfil incompleto',
      error: {
        code: ApiErrorCode.FORBIDDEN,
        message: 'Perfil incompleto',
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
  req: AuthenticatedRequest,
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
          message: 'No autorizado',
          details: 'Token no proporcionado'
        }
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as ExtendedJwtPayload;

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
          message: 'No autorizado',
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
        message: 'No autorizado',
        details: 'Token inválido o expirado'
      }
    });
  }
};

// Helper para asegurar autenticación
export const withAuth = (handler: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'No autorizado',
        error: {
          code: ApiErrorCode.UNAUTHORIZED,
          message: 'Usuario no autenticado',
          details: 'Se requiere autenticación para esta acción'
        }
      });
    }
    return handler(req, res, next);
  };
};

// Helper para manejar middlewares autenticados con tipos
export const withAuthenticatedHandler = (handler: any): RequestHandler => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'No autorizado',
        error: {
          code: ApiErrorCode.UNAUTHORIZED,
          message: 'Usuario no autenticado',
          details: 'Se requiere autenticación para acceder a este recurso'
        }
      });
    }
    return handler(req, res, next);
  });
};

export default {
  authenticateToken,
  isAdmin,
  withAuth
}; 
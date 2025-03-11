import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { logActivity } from '../services/logService';
import { ApiResponse, ApiErrorCode } from '../types/apiError';
import { prisma } from '../lib/prisma';
import { UserWithId, UserRole } from '../types/user';
import { ActivityCategory } from '../types/prisma';

interface JwtPayload {
  id: number;
  email: string;
  rol: UserRole;
  isFirstLogin: boolean;
  isProfileCompleted: boolean;
  lastActivity?: string;
  tokenVersion?: number;
  sessionWarning?: {
    shown: boolean;
    timestamp: string;
    acknowledged?: boolean;
  };
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
    console.log('[Auth] Iniciando verificación de token para ruta:', req.path);
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('[Auth] Token no proporcionado');
      await logActivity(-1, 'UNAUTHORIZED_ACCESS', {
        category: ActivityCategory.AUTH,
        details: {
          description: `Intento de acceso no autorizado a ${req.path}`,
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
          message: 'Token no proporcionado',
          details: 'No se proporcionó un token de autenticación'
        }
      });
      return;
    }

    console.log('[Auth] Decodificando token');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    console.log('[Auth] Token decodificado para usuario:', decoded.email);

    // Verificar última actividad
    const lastActivity = decoded.lastActivity ? new Date(decoded.lastActivity) : new Date();
    const now = new Date();
    const inactivityTime = now.getTime() - lastActivity.getTime();
    console.log('[Auth] Tiempo de inactividad:', Math.round(inactivityTime / 1000), 'segundos');
    const maxInactivityTime = 60 * 60 * 1000; // 1 hora
    const warningTime = 20 * 60 * 1000; // 20 minutos
    const gracePeriod = 5 * 60 * 1000; // 5 minutos
    const tokenRefreshThreshold = 10 * 60 * 1000; // 10 minutos

    // Si ya pasó el tiempo máximo más el período de gracia, cerrar sesión
    if (inactivityTime > (maxInactivityTime + gracePeriod)) {
      console.log('[Auth] Sesión expirada por inactividad');
      await logActivity(decoded.id, 'SESSION_EXPIRED', {
        category: ActivityCategory.AUTH,
        details: {
          description: `Sesión expirada por inactividad después de ${Math.round(inactivityTime / 1000 / 60)} minutos`,
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
          code: ApiErrorCode.SESSION_EXPIRED,
          message: 'Sesión expirada por inactividad',
          details: 'La sesión ha expirado por inactividad'
        }
      });
      return;
    }

    // Obtener el usuario
    console.log('[Auth] Buscando usuario en la base de datos');
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      console.log('[Auth] Usuario no encontrado en la base de datos');
      throw new Error('Usuario no encontrado');
    }

    // Si el tiempo de inactividad está cerca del umbral de renovación o si se solicita mantener la sesión
    if (inactivityTime > (maxInactivityTime - tokenRefreshThreshold) || req.headers['x-keep-session'] === 'true') {
      console.log('[Auth] Renovando token por cercanía al umbral o solicitud explícita');
      const newToken = jwt.sign(
        {
          id: decoded.id,
          email: decoded.email,
          rol: decoded.rol,
          isFirstLogin: decoded.isFirstLogin,
          isProfileCompleted: decoded.isProfileCompleted,
          lastActivity: now.toISOString(),
          tokenVersion: user.tokenVersion,
          sessionWarning: null
        },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      console.log('[Auth] Token renovado exitosamente');
      res.set('Authorization', `Bearer ${newToken}`);
      res.set('X-Session-Extended', 'true');
    }
    // Si el tiempo de inactividad está cerca del máximo y no se ha mostrado la advertencia
    else if (inactivityTime > (maxInactivityTime - warningTime) && !decoded.sessionWarning?.shown) {
      console.log('[Auth] Enviando advertencia de sesión próxima a expirar');
      const newToken = jwt.sign(
        {
          ...decoded,
          sessionWarning: {
            shown: true,
            timestamp: now.toISOString(),
            acknowledged: false
          }
        },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      res.set('Authorization', `Bearer ${newToken}`);
      res.set('X-Session-Warning', 'true');
      res.set('X-Time-Remaining', String(Math.ceil((maxInactivityTime + gracePeriod - inactivityTime) / 1000)));
      res.set('X-Warning-Type', 'session_expiring');
    }

    // Si hay una advertencia activa, seguir enviando el tiempo restante
    if (decoded.sessionWarning?.shown && !decoded.sessionWarning.acknowledged) {
      console.log('[Auth] Advertencia activa, tiempo restante:', 
        Math.ceil((maxInactivityTime + gracePeriod - inactivityTime) / 1000), 'segundos');
      res.set('X-Session-Warning', 'true');
      res.set('X-Time-Remaining', String(Math.ceil((maxInactivityTime + gracePeriod - inactivityTime) / 1000)));
      res.set('X-Warning-Type', 'session_expiring');
    }

    console.log('[Auth] Autenticación exitosa para usuario:', user.email);
    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth] Error de autenticación:', error);
    if (error instanceof jwt.TokenExpiredError) {
      console.log('[Auth] Token expirado');
      res.status(401).json({
        status: 'error',
        message: 'Token expirado',
        error: {
          code: ApiErrorCode.SESSION_EXPIRED,
          message: 'La sesión ha expirado',
          details: 'El token de autenticación ha expirado'
        }
      });
    } else {
      console.log('[Auth] Token inválido:', error instanceof Error ? error.message : 'Error desconocido');
      res.status(401).json({
        status: 'error',
        message: 'Token inválido',
        error: {
          code: ApiErrorCode.INVALID_TOKEN,
          message: 'Token inválido o expirado',
          details: error instanceof Error ? error.message : 'Error desconocido'
        }
      });
    }
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
          message: 'Se requieren permisos de administrador',
          details: 'Se requieren permisos de administrador para esta acción'
        }
      };
      
      if (req.user) {
        await logActivity(req.user.id, 'UNAUTHORIZED_ACCESS', {
          category: ActivityCategory.AUTH,
          details: {
            description: `Intento de acceso a ruta protegida de administrador: ${req.path}`,
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
        message: 'Error interno del servidor',
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
        message: 'Se requieren permisos de colaborador',
        details: 'Se requieren permisos de colaborador para esta acción'
      }
    };

    if (req.user) {
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
            message: 'Error interno del servidor',
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
          message: 'Permisos insuficientes',
          details: 'No tiene los permisos necesarios para esta acción'
        }
      };

      if (req.user) {
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
          message: 'No autorizado',
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
          message: 'No autorizado',
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
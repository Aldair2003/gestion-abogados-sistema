import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middlewares/auth';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest, withAuth } from '../types/common';
import { logActivity } from '../services/logService';
import { ActivityCategory } from '../types/prisma';
import { ApiErrorCode } from '../types/apiError';
import jwt, { JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Interfaces para las solicitudes
interface RefreshTokenRequest {
  refreshToken: string;
}

// Rutas públicas de autenticación
const router = Router();

// Handler de login
const loginHandler = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    console.log('[Auth] Recibida petición de login:', {
      body: req.body,
      headers: req.headers
    });

    const { email, password } = req.body;

    if (!email || !password) {
      console.log('[Auth] Error: Datos incompletos');
      res.status(400).json({
        status: 'error',
        message: 'Datos incompletos',
        error: {
          code: ApiErrorCode.VALIDATION_ERROR,
          message: 'Email y contraseña son requeridos',
          details: 'Debe proporcionar email y contraseña'
        }
      });
      return;
    }

    console.log('[Auth] Buscando usuario con email:', email);
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.log('[Auth] Error: Usuario no encontrado');
      res.status(401).json({
        status: 'error',
        message: 'Credenciales inválidas',
        error: {
          code: ApiErrorCode.INVALID_CREDENTIALS,
          message: 'Email o contraseña incorrectos',
          details: 'Las credenciales proporcionadas son inválidas'
        }
      });
      return;
    }

    console.log('[Auth] Usuario encontrado, verificando contraseña');
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      console.log('[Auth] Error: Contraseña inválida');
      await logActivity(user.id, 'FAILED_LOGIN', {
        category: ActivityCategory.AUTH,
        details: {
          description: 'Intento de inicio de sesión fallido',
          metadata: {
            reason: 'Contraseña incorrecta',
            email: user.email,
            ipAddress: req.ip
          }
        }
      });

      res.status(401).json({
        status: 'error',
        message: 'Credenciales inválidas',
        error: {
          code: ApiErrorCode.INVALID_CREDENTIALS,
          message: 'Email o contraseña incorrectos',
          details: 'Las credenciales proporcionadas son inválidas'
        }
      });
      return;
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        rol: user.rol,
        isFirstLogin: user.isFirstLogin,
        isProfileCompleted: user.isProfileCompleted,
        lastActivity: new Date().toISOString(),
        tokenVersion: user.tokenVersion
      },
      process.env.JWT_SECRET!,
      { expiresIn: '12h' }
    );

    // Generar refresh token con más duración
    const refreshToken = jwt.sign(
      {
        id: user.id,
        tokenVersion: user.tokenVersion
      },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    console.log('[Auth] Token generado para usuario:', {
      userId: user.id,
      email: user.email,
      tokenExpiry: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Registrar la actividad de generación de token
    await logActivity(user.id, 'TOKEN_GENERATED', {
      category: ActivityCategory.AUTH,
      details: {
        description: 'Nuevo token de acceso generado',
        metadata: {
          tokenExpiry: '12h',
          refreshTokenExpiry: '7d',
          timestamp: new Date().toISOString()
        }
      }
    });

    await logActivity(user.id, 'LOGIN', {
      category: ActivityCategory.AUTH,
      details: {
        description: 'Inicio de sesión exitoso',
        metadata: {
          email: user.email,
          ipAddress: req.ip
        }
      }
    });

    res.json({
      status: 'success',
      message: 'Login exitoso',
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol,
        isFirstLogin: user.isFirstLogin,
        isProfileCompleted: user.isProfileCompleted,
        refreshToken
      }
    });
  } catch (error) {
    console.error('[Auth] Error en login:', error);
    next(error);
  }
};

// Handler de verificación de token
const verifyHandler = withAuth(async (
  req: AuthenticatedRequest, 
  res: Response
): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'Usuario no encontrado',
        error: {
          code: ApiErrorCode.NOT_FOUND,
          message: 'Usuario no encontrado',
          details: 'El usuario asociado al token no existe'
        }
      });
      return;
    }

    res.json({
      status: 'success',
      message: 'Token válido',
      data: {
        user: {
          id: user.id,
          email: user.email,
          rol: user.rol,
          isFirstLogin: user.isFirstLogin,
          isProfileCompleted: user.isProfileCompleted
        }
      }
    });
  } catch (error) {
    console.error('Error al verificar token:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor',
      error: {
        code: ApiErrorCode.INTERNAL_ERROR,
        message: 'Error al procesar la solicitud',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      }
    });
  }
});

// Handler de logout
const logoutHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // Obtener el token del header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // Si no hay token, simplemente retornamos éxito
      res.json({
        status: 'success',
        message: 'Sesión cerrada exitosamente'
      });
      return;
    }

    try {
      // Intentar decodificar el token sin verificar la firma
      const decoded = jwt.decode(token) as JwtPayload;
      
      if (decoded && decoded.id) {
        // Incrementar la versión del token si podemos
        try {
          await prisma.user.update({
            where: { id: decoded.id },
            data: { tokenVersion: { increment: 1 } }
          });

          // Intentar registrar la actividad
          try {
            await logActivity(decoded.id, 'LOGOUT', {
              category: ActivityCategory.AUTH,
              details: {
                description: 'Cierre de sesión exitoso',
                metadata: {
                  email: decoded.email,
                  ipAddress: req.ip,
                  reason: 'Logout manual'
                }
              }
            });
          } catch (error) {
            console.warn('Error al registrar actividad de logout:', error);
          }
        } catch (error) {
          console.warn('Error al actualizar tokenVersion:', error);
        }
      }
    } catch (error) {
      console.warn('Error al decodificar token durante logout:', error);
    }

    // Siempre retornamos éxito
    res.json({
      status: 'success',
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    // Aún si hay error, retornamos éxito para asegurar que el frontend limpie la sesión
    res.json({
      status: 'success',
      message: 'Sesión cerrada exitosamente'
    });
  }
};

// Handler de refresh token
const refreshTokenHandler = async (
  req: Request, 
  res: Response
): Promise<void> => {
  try {
    const { refreshToken } = req.body as RefreshTokenRequest;

    if (!refreshToken) {
      res.status(400).json({
        status: 'error',
        message: 'Refresh token no proporcionado',
        error: {
          code: ApiErrorCode.VALIDATION_ERROR,
          message: 'Refresh token es requerido',
          details: 'Debe proporcionar un refresh token'
        }
      });
      return;
    }

    // Verificar el refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as JwtPayload;
    
    // Obtener el usuario
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'Usuario no encontrado',
        error: {
          code: ApiErrorCode.NOT_FOUND,
          message: 'Usuario no encontrado',
          details: 'El usuario asociado al token no existe'
        }
      });
      return;
    }

    // Verificar la versión del token
    if (decoded.tokenVersion !== user.tokenVersion) {
      res.status(401).json({
        status: 'error',
        message: 'Token inválido',
        error: {
          code: ApiErrorCode.INVALID_TOKEN,
          message: 'Token inválido o revocado',
          details: 'El token ha sido revocado'
        }
      });
      return;
    }

    // Generar nuevo token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        rol: user.rol,
        isFirstLogin: user.isFirstLogin,
        isProfileCompleted: user.isProfileCompleted,
        lastActivity: new Date().toISOString(),
        tokenVersion: user.tokenVersion
      },
      process.env.JWT_SECRET!,
      { expiresIn: '4h' }
    );

    // Registrar la actividad
    await logActivity(user.id, 'TOKEN_REFRESH', {
      category: ActivityCategory.AUTH,
      details: {
        description: 'Token renovado exitosamente',
        metadata: {
          timestamp: new Date().toISOString()
        }
      }
    });

    res.json({
      status: 'success',
      message: 'Token renovado exitosamente',
      data: {
        token
      }
    });
  } catch (error) {
    console.error('Error al renovar token:', error);
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        status: 'error',
        message: 'Refresh token expirado',
        error: {
          code: ApiErrorCode.SESSION_EXPIRED,
          message: 'El refresh token ha expirado',
          details: 'Debe iniciar sesión nuevamente'
        }
      });
    } else {
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

// Rutas
router.post('/login', loginHandler);
router.post('/verify', authenticateToken, verifyHandler);
router.post('/logout', logoutHandler);
router.post('/refresh-token', refreshTokenHandler);

export default router; 
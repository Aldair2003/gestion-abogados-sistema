import { Router, Response, Request } from 'express';
import { login, register, forgotPassword, resetPassword } from '../controllers/userController';
import { isAuthenticated, RequestWithUser } from '../middlewares/auth';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { ApiErrorCode } from '../utils/ApiErrorCode';
import { logActivity } from '../services/logService';

const router = Router();

// Rutas públicas
router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Ruta para mantener la sesión activa
router.post('/keep-alive', isAuthenticated, (req: RequestWithUser, res: Response) => {
  const token = jwt.sign(
    { 
      id: req.user!.id,
      email: req.user!.email,
      rol: req.user!.rol,
      lastActivity: new Date().toISOString()
    },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );

  res.json({ token });
});

// Ruta para refrescar el token
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(401).json({
        status: 'error',
        message: 'No se proporcionó refresh token',
        error: {
          code: ApiErrorCode.UNAUTHORIZED
        }
      });
      return;
    }

    // Verificar refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as {
      id: number;
      tokenVersion: number;
    };

    // Obtener usuario y verificar token version
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user || user.tokenVersion !== decoded.tokenVersion) {
      res.status(401).json({
        status: 'error',
        message: 'Refresh token inválido',
        error: {
          code: ApiErrorCode.REFRESH_TOKEN_INVALID
        }
      });
      return;
    }

    // Generar nuevo access token
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        rol: user.rol,
        isFirstLogin: user.isFirstLogin,
        isProfileCompleted: user.isProfileCompleted,
        lastActivity: new Date().toISOString()
      },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    // Generar nuevo refresh token
    const newRefreshToken = jwt.sign(
      {
        id: user.id,
        tokenVersion: user.tokenVersion
      },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: '7d' }
    );

    // Registrar actividad
    await logActivity({
      userId: user.id,
      action: 'SESSION_REFRESHED',
      category: 'SESSION',
      details: {
        description: 'Sesión renovada exitosamente',
        metadata: {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      }
    });

    res.json({
      status: 'success',
      message: 'Tokens renovados exitosamente',
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        status: 'error',
        message: 'El refresh token ha expirado',
        error: {
          code: ApiErrorCode.REFRESH_TOKEN_EXPIRED
        }
      });
      return;
    }

    console.error('Error al refrescar token:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al refrescar la sesión',
      error: {
        code: ApiErrorCode.INTERNAL_ERROR
      }
    });
  }
});

// Ruta para cerrar sesión
router.post('/logout', isAuthenticated, async (req: RequestWithUser, res: Response) => {
  try {
    if (req.user) {
      await logActivity({
        userId: req.user.id,
        action: 'LOGOUT',
        category: 'SESSION',
        details: {
          metadata: {
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          }
        }
      });
    }
    res.json({ status: 'success', message: 'Sesión cerrada exitosamente' });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error al cerrar sesión' 
    });
  }
});

export default router; 
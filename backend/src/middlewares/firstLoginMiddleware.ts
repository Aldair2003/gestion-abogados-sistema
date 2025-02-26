import { Response, NextFunction } from 'express';
import { RequestWithUser } from './auth';

export const handleFirstLogin = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Si no es primer login, continuar normalmente
    if (!req.user.isFirstLogin) {
      return next();
    }

    // Si es primer login pero no está intentando completar el perfil
    if (req.path !== '/api/users/profile/complete') {
      res.status(403).json({
        status: 'error',
        message: 'Debe completar su perfil antes de continuar',
        code: 'PROFILE_COMPLETION_REQUIRED',
        isFirstLogin: true
      });
      return;
    }

    // Si está intentando completar el perfil, permitir continuar
    next();
  } catch (error) {
    next(error);
  }
}; 
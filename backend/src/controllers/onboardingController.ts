import { Response, Request } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../types/auth';

export const getOnboardingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isFirstLogin: true,
        isProfileCompleted: true,
        isTemporaryPassword: true,
        email: true,
        rol: true
      }
    });

    if (!user) {
      res.status(404).json({
        message: 'Usuario no encontrado',
        error: 'No se pudo encontrar el usuario especificado'
      });
      return;
    }

    res.status(200).json({
      message: 'Estado de onboarding recuperado exitosamente',
      data: {
        isFirstLogin: user.isFirstLogin,
        isProfileCompleted: user.isProfileCompleted,
        isTemporaryPassword: user.isTemporaryPassword,
        email: user.email,
        rol: user.rol,
        pendingSteps: {
          requiresPasswordChange: user.isTemporaryPassword,
          requiresProfileCompletion: !user.isProfileCompleted,
          isFirstTimeUser: user.isFirstLogin
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener estado de onboarding:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'No se pudo obtener el estado de onboarding'
    });
  }
}; 
import { Response } from 'express';
import { RequestWithUser } from '../middlewares/auth';
import { prisma } from '../lib/prisma';
import { validateCedula } from '../utils/validators';
import { logActivity } from '../services/logService';
import { createNotification } from '../services/notificationService';
import { NotificationType } from '../types/notification';

export const getUserProfile = async (req: RequestWithUser, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        nombre: true,
        cedula: true,
        telefono: true,
        nivelEstudios: true,
        universidad: true,
        matricula: true,
        domicilio: true,
        isProfileCompleted: true,
        rol: true
      }
    });

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener perfil' });
  }
};

export const updateUserProfile = async (req: RequestWithUser, res: Response) => {
  try {
    const { id } = req.user;
    const profileData = req.body;

    // Validar datos
    if (profileData.cedula && !validateCedula(profileData.cedula)) {
      return res.status(400).json({ message: 'Cédula inválida' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...profileData,
        updatedAt: new Date()
      }
    });

    await logActivity({
      userId: id,
      action: 'UPDATE_PROFILE',
      details: {
        changes: profileData
      }
    });

    await createNotification(
      id,
      NotificationType.SUCCESS,
      'Perfil actualizado exitosamente',
      { updatedFields: Object.keys(profileData) }
    );

    return res.json({
      message: 'Perfil actualizado exitosamente',
      user: updatedUser
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar perfil' });
  }
}; 
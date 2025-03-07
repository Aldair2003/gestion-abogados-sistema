import { Response } from 'express';
import { RequestWithUser } from '../types/user';
import { prisma } from '../lib/prisma';
import { validateCedula, validatePhone } from '../utils/validators';
import { logActivity } from '../services/logService';
import { createNotification } from '../services/notificationService';
import { NotificationType } from '../types/notification';
import { Prisma, ActivityCategory } from '@prisma/client';

export const getUserProfile = async (req: RequestWithUser, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        nombre: true,
        cedula: true,
        telefono: true,
        estadoProfesional: true,
        universidad: true,
        numeroMatricula: true,
        domicilio: true,
        isProfileCompleted: true,
        rol: true,
        photoUrl: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.json(user);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    return res.status(500).json({ message: 'Error al obtener perfil' });
  }
};

export const updateUserProfile = async (req: RequestWithUser, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const profileData = req.body;

    // Validar datos
    if (profileData.cedula && !validateCedula(profileData.cedula)) {
      return res.status(400).json({ message: 'Cédula inválida' });
    }

    if (profileData.telefono && !validatePhone(profileData.telefono)) {
      return res.status(400).json({ message: 'Formato de teléfono inválido' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...profileData,
        updatedAt: new Date()
      }
    });

    await logActivity(req.user.id, 'UPDATE_PROFILE', {
      category: ActivityCategory.PROFILE,
      details: {
        description: 'Actualización de perfil de usuario',
        changes: {
          before: req.user,
          after: updatedUser
        },
        metadata: {
          updatedFields: Object.keys(profileData),
          timestamp: new Date().toISOString()
        }
      }
    });

    await createNotification(
      req.user.id,
      NotificationType.SUCCESS,
      'Perfil actualizado exitosamente',
      { updatedFields: Object.keys(profileData) }
    );

    return res.json({
      message: 'Perfil actualizado exitosamente',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    return res.status(500).json({ message: 'Error al actualizar perfil' });
  }
};

/**
 * Actualizar el perfil personal del usuario autenticado
 */
export const updatePersonalProfile = async (
  req: RequestWithUser & { file?: Express.Multer.File },
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ 
        status: 'error',
        message: 'Usuario no autenticado' 
      });
      return;
    }

    // Validar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      res.status(404).json({ 
        status: 'error',
        message: 'Usuario no encontrado' 
      });
      return;
    }

    // Construir objeto de actualización
    const updateData: Prisma.UserUpdateInput = {};

    // Validar y procesar campos permitidos
    if (req.body.nombre) {
      updateData.nombre = req.body.nombre.trim();
    }

    if (req.body.cedula) {
      // Validar formato de cédula
      if (!validateCedula(req.body.cedula)) {
        res.status(400).json({
          status: 'error',
          message: 'La cédula ingresada no es válida',
          error: 'INVALID_CEDULA'
        });
        return;
      }
      // Verificar duplicado solo si la cédula cambió
      if (req.body.cedula !== existingUser.cedula) {
        const userWithCedula = await prisma.user.findUnique({
          where: { cedula: req.body.cedula }
        });
        if (userWithCedula) {
          res.status(400).json({
            status: 'error',
            message: 'La cédula ya está registrada',
            error: 'DUPLICATE_CEDULA'
          });
          return;
        }
      }
      updateData.cedula = req.body.cedula.trim();
    }

    if (req.body.telefono) {
      // Validar formato de teléfono
      if (!validatePhone(req.body.telefono)) {
        res.status(400).json({
          status: 'error',
          message: 'El formato del teléfono no es válido (debe ser 09XXXXXXXX)',
          error: 'INVALID_PHONE'
        });
        return;
      }
      updateData.telefono = req.body.telefono.trim();
    }

    // Campos opcionales
    if (req.body.domicilio !== undefined) {
      updateData.domicilio = req.body.domicilio?.trim() || null;
    }
    if (req.body.estadoProfesional !== undefined) {
      updateData.estadoProfesional = req.body.estadoProfesional || null;
    }
    if (req.body.numeroMatricula !== undefined) {
      updateData.numeroMatricula = req.body.numeroMatricula?.trim() || null;
    }
    if (req.body.universidad !== undefined) {
      updateData.universidad = req.body.universidad?.trim() || null;
    }

    // Si hay un archivo de foto, actualizar la URL
    if (req.file) {
      updateData.photoUrl = `/uploads/profile-photos/${req.file.filename}`;
    }

    // Actualizar fecha de modificación
    updateData.updatedAt = new Date();

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: Number(userId) },
      data: updateData,
      select: {
        id: true,
        nombre: true,
        email: true,
        cedula: true,
        telefono: true,
        domicilio: true,
        estadoProfesional: true,
        numeroMatricula: true,
        universidad: true,
        photoUrl: true,
        rol: true,
        isActive: true
      }
    });

    // Registrar actividad
    await logActivity(userId, 'UPDATE_PERSONAL_PROFILE', {
      category: ActivityCategory.PROFILE,
      details: {
        description: 'Actualización de perfil personal',
        changes: {
          before: existingUser,
          after: updatedUser
        },
        metadata: {
          updatedFields: Object.keys(updateData),
          timestamp: new Date().toISOString()
        }
      }
    });

    res.json({
      status: 'success',
      message: 'Perfil actualizado correctamente',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error en updatePersonalProfile:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(400).json({
        status: 'error',
        message: 'Error al actualizar el perfil',
        error: error.code
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Error interno del servidor',
        error: 'INTERNAL_ERROR'
      });
    }
  }
}; 
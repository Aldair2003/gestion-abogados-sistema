import path from 'path';
import fs from 'fs/promises';
import { CustomError } from '../utils/customError';
import { ApiErrorCode } from '../types/apiError';
import { prisma } from '../lib/prisma';
import { logActivity } from './logService';
import { ActivityCategory } from '../types/prisma';

// Configuración de imágenes
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const UPLOAD_DIR = path.join(process.cwd(), 'uploads/profile-photos');

export class ProfilePhotoService {
  /**
   * Valida una imagen antes de procesarla
   */
  private static async validateImage(file: Express.Multer.File): Promise<void> {
    // Validar tipo MIME
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new CustomError({
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'Tipo de imagen no permitido',
        status: 400,
        details: {
          allowedTypes: ALLOWED_MIME_TYPES,
          receivedType: file.mimetype
        }
      });
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      throw new CustomError({
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'La imagen excede el tamaño máximo permitido',
        status: 400,
        details: {
          maxSize: MAX_FILE_SIZE,
          receivedSize: file.size
        }
      });
    }
  }

  /**
   * Elimina físicamente una imagen del sistema de archivos
   */
  private static async deleteImageFile(photoUrl: string | null): Promise<void> {
    if (!photoUrl) return;

    try {
      const filePath = path.join(process.cwd(), photoUrl.replace(/^\/uploads\/profile-photos\//, 'uploads/profile-photos/'));
      await fs.unlink(filePath);
    } catch (error) {
      // Si el archivo no existe, ignoramos el error
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Error al eliminar foto de perfil:', error);
      }
    }
  }

  /**
   * Elimina la foto anterior de un usuario
   */
  private static async deleteOldPhoto(userId: number): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { photoUrl: true }
    });

    if (user?.photoUrl) {
      await this.deleteImageFile(user.photoUrl);
    }
  }

  /**
   * Guarda una nueva foto de perfil
   */
  static async savePhoto(file: Express.Multer.File, userId: number): Promise<string> {
    try {
      // Validar imagen
      await this.validateImage(file);

      // Generar nombre único
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const fileName = `photo-${userId}-${uniqueSuffix}${ext}`;
      const filePath = path.join(UPLOAD_DIR, fileName);

      // Asegurarse de que el directorio existe
      await fs.mkdir(UPLOAD_DIR, { recursive: true });

      // Mover archivo
      await fs.rename(file.path, filePath);

      // Construir URL relativa
      const photoUrl = `/uploads/profile-photos/${fileName}`;

      // Registrar actividad
      await logActivity(userId, 'UPDATE_PROFILE_PHOTO', {
        category: ActivityCategory.PROFILE,
        targetId: userId,
        details: {
          description: 'Foto de perfil actualizada',
          metadata: {
            fileName,
            fileType: file.mimetype,
            fileSize: file.size
          }
        }
      });

      return photoUrl;
    } catch (error) {
      // Limpiar archivo temporal si existe
      if (file.path) {
        await this.deleteImageFile(file.path);
      }
      throw error;
    }
  }

  /**
   * Actualiza la foto de perfil de un usuario
   */
  static async updatePhoto(file: Express.Multer.File, userId: number): Promise<string> {
    try {
      // Eliminar foto anterior
      await this.deleteOldPhoto(userId);
      
      // Guardar nueva foto
      const newPhotoUrl = await this.savePhoto(file, userId);

      // Actualizar URL en la base de datos
      await prisma.user.update({
        where: { id: userId },
        data: { 
          photoUrl: newPhotoUrl,
          updatedAt: new Date()
        }
      });

      return newPhotoUrl;
    } catch (error) {
      // Si algo falla, asegurarse de limpiar el archivo temporal
      if (file.path) {
        await this.deleteImageFile(file.path);
      }
      throw error;
    }
  }

  /**
   * Elimina la foto de perfil de un usuario
   */
  static async deletePhoto(userId: number): Promise<void> {
    try {
      // Obtener y eliminar la foto actual
      await this.deleteOldPhoto(userId);

      // Actualizar el usuario para quitar la referencia a la foto
      await prisma.user.update({
        where: { id: userId },
        data: { 
          photoUrl: null,
          updatedAt: new Date()
        }
      });

      // Registrar actividad
      await logActivity(userId, 'DELETE_PROFILE_PHOTO', {
        category: ActivityCategory.PROFILE,
        targetId: userId,
        details: {
          description: 'Foto de perfil eliminada',
          metadata: {
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      throw new CustomError({
        code: ApiErrorCode.INTERNAL_ERROR,
        message: 'Error al eliminar la foto de perfil',
        status: 500,
        details: { userId, error }
      });
    }
  }
} 
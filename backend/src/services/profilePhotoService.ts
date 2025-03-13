import { uploadFile, deleteFile } from '../config/cloudinary';
import { CustomError } from '../utils/customError';
import { ApiErrorCode } from '../types/apiError';
import { prisma } from '../lib/prisma';
import { logActivity } from './logService';
import { ActivityCategory } from '../types/prisma';

// Configuración de imágenes
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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
   * Elimina una imagen de Cloudinary
   */
  private static async deleteCloudinaryImage(photoUrl: string | null): Promise<void> {
    if (!photoUrl || !photoUrl.includes('cloudinary')) return;

    try {
      // Extraer el public_id de la URL de Cloudinary
      const urlParts = photoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1].split('.')[0];
      const publicId = `gestion-abogados/profile-photos/${fileName}`;

      await deleteFile(publicId);
    } catch (error) {
      console.error('Error al eliminar foto de Cloudinary:', error);
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
      await this.deleteCloudinaryImage(user.photoUrl);
    }
  }

  /**
   * Guarda una nueva foto de perfil en Cloudinary
   */
  static async savePhoto(file: Express.Multer.File, userId: number): Promise<string> {
    try {
      // Validar imagen
      await this.validateImage(file);

      // Subir a Cloudinary
      const photoUrl = await uploadFile(file, 'profile-photos');

      // Registrar actividad
      await logActivity(userId, 'UPDATE_PROFILE_PHOTO', {
        category: ActivityCategory.PROFILE,
        targetId: userId,
        details: {
          description: 'Foto de perfil actualizada',
          metadata: {
            fileName: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size,
            cloudinaryUrl: photoUrl
          }
        }
      });

      return photoUrl;
    } catch (error) {
      console.error('Error al subir foto a Cloudinary:', error);
      throw new CustomError({
        code: ApiErrorCode.INTERNAL_ERROR,
        message: 'Error al guardar la foto de perfil',
        status: 500,
        details: { error }
      });
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
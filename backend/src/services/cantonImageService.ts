import { CustomError } from '../utils/customError';
import { ApiErrorCode } from '../types/apiError';
import { prisma } from '../lib/prisma';
import { ActivityCategory } from '@prisma/client';
import { storageService } from './storageService';

// Configuración de imágenes
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export class CantonImageService {
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
   * Guarda una nueva imagen para un cantón
   */
  static async saveImage(
    file: Express.Multer.File,
    cantonId: number,
    userId: number
  ): Promise<string> {
    try {
      // Validar la imagen antes de procesarla
      await this.validateImage(file);

      // Guardar la imagen usando el storageService
      const imageUrl = await storageService.saveFile(file, 'cantones');

      // Registrar la actividad
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'UPLOAD_CANTON_IMAGE',
          category: ActivityCategory.CANTON,
          targetId: cantonId,
          details: {
            description: 'Imagen de cantón subida exitosamente',
            metadata: {
              cantonId,
              filename: file.originalname,
              imageUrl
            }
          }
        }
      });

      return imageUrl;
    } catch (error) {
      // Si algo falla y existe un archivo temporal, eliminarlo
      if (file.path) {
        try {
          await storageService.deleteFile(file.path);
        } catch (deleteError) {
          console.error('Error al eliminar archivo temporal:', deleteError);
        }
      }
      throw error;
    }
  }

  /**
   * Actualiza la imagen de un cantón
   */
  static async updateImage(
    file: Express.Multer.File,
    cantonId: number,
    userId: number
  ): Promise<string> {
    try {
      // Validar la imagen antes de procesarla
      await this.validateImage(file);

      // Obtener la imagen anterior
      const canton = await prisma.canton.findUnique({
        where: { id: cantonId }
      });

      // Si hay una imagen anterior, eliminarla
      if (canton?.imagenUrl) {
        await storageService.deleteFile(canton.imagenUrl);
      }

      // Guardar la nueva imagen
      const imageUrl = await storageService.saveFile(file, 'cantones');

      // Registrar la actividad
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'UPDATE_CANTON_IMAGE',
          category: ActivityCategory.CANTON,
          targetId: cantonId,
          details: {
            description: 'Imagen de cantón actualizada',
            metadata: {
              cantonId,
              oldImageUrl: canton?.imagenUrl,
              newImageUrl: imageUrl
            }
          }
        }
      });

      return imageUrl;
    } catch (error) {
      // Si algo falla y existe un archivo temporal, eliminarlo
      if (file.path) {
        try {
          await storageService.deleteFile(file.path);
        } catch (deleteError) {
          console.error('Error al eliminar archivo temporal:', deleteError);
        }
      }
      throw error;
    }
  }

  /**
   * Elimina la imagen de un cantón
   */
  static async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      await storageService.deleteFile(imageUrl);
      return true;
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
      return false;
    }
  }
} 
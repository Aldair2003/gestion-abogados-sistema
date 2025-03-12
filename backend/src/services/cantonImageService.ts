import path from 'path';
import fs from 'fs/promises';
import { CustomError } from '../utils/customError';
import { ApiErrorCode } from '../types/apiError';
import { prisma } from '../lib/prisma';
import { logActivity } from './logService';
import { ActivityCategory } from '../types/prisma';

// Configuración de imágenes
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const UPLOAD_DIR = path.join(process.cwd(), 'uploads/cantones');

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
   * Elimina físicamente una imagen del sistema de archivos
   */
  private static async deleteImageFile(imageUrl: string | null): Promise<void> {
    if (!imageUrl) return;

    try {
      const filePath = path.join(process.cwd(), imageUrl.replace(/^\/uploads\/cantones\//, 'uploads/cantones/'));
      await fs.unlink(filePath);
    } catch (error) {
      // Si el archivo no existe, ignoramos el error
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Error al eliminar imagen:', error);
      }
    }
  }

  /**
   * Elimina la imagen anterior de un cantón
   */
  private static async deleteOldImage(cantonId: number): Promise<void> {
    const canton = await prisma.canton.findUnique({
      where: { id: cantonId },
      select: { imagenUrl: true }
    });

    if (canton?.imagenUrl) {
      await this.deleteImageFile(canton.imagenUrl);
    }
  }

  /**
   * Guarda una nueva imagen para un cantón
   */
  static async saveImage(file: Express.Multer.File, cantonId: number, userId: number): Promise<string> {
    try {
      // Validar imagen
      await this.validateImage(file);

      // Generar nombre único
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const fileName = `canton-${cantonId}-${uniqueSuffix}${ext}`;
      const filePath = path.join(UPLOAD_DIR, fileName);

      // Asegurarse de que el directorio existe
      await fs.mkdir(UPLOAD_DIR, { recursive: true });

      // Mover archivo
      await fs.rename(file.path, filePath);

      // Construir URL relativa
      const imageUrl = `/uploads/cantones/${fileName}`;

      // Registrar actividad
      await logActivity(userId, 'UPDATE_CANTON_IMAGE', {
        category: ActivityCategory.CANTON,
        targetId: cantonId,
        details: {
          description: 'Imagen de cantón actualizada',
          metadata: {
            fileName,
            fileType: file.mimetype,
            fileSize: file.size
          }
        }
      });

      return imageUrl;
    } catch (error) {
      // Limpiar archivo temporal si existe
      if (file.path) {
        await this.deleteImageFile(file.path);
      }
      throw error;
    }
  }

  /**
   * Actualiza la imagen de un cantón
   */
  static async updateImage(file: Express.Multer.File, cantonId: number, userId: number): Promise<string> {
    try {
      // Eliminar imagen anterior
      await this.deleteOldImage(cantonId);
      
      // Guardar nueva imagen
      const newImageUrl = await this.saveImage(file, cantonId, userId);

      // Actualizar URL en la base de datos
      await prisma.canton.update({
        where: { id: cantonId },
        data: { 
          imagenUrl: newImageUrl,
          updatedBy: userId
        }
      });

      return newImageUrl;
    } catch (error) {
      // Si algo falla, asegurarse de limpiar el archivo temporal
      if (file.path) {
        await this.deleteImageFile(file.path);
      }
      throw error;
    }
  }

  /**
   * Elimina la imagen de un cantón
   */
  static async deleteImage(cantonId: number, userId: number): Promise<void> {
    try {
      // Obtener y eliminar la imagen actual
      await this.deleteOldImage(cantonId);

      // Actualizar el cantón para quitar la referencia a la imagen
      await prisma.canton.update({
        where: { id: cantonId },
        data: { 
          imagenUrl: null,
          updatedBy: userId
        }
      });

      // Registrar actividad
      await logActivity(userId, 'DELETE_CANTON_IMAGE', {
        category: ActivityCategory.CANTON,
        targetId: cantonId,
        details: {
          description: 'Imagen de cantón eliminada',
          metadata: {
            timestamp: new Date().toISOString(),
            cantonId,
            action: 'DELETE'
          }
        }
      });
    } catch (error) {
      throw new CustomError({
        code: ApiErrorCode.INTERNAL_ERROR,
        message: 'Error al eliminar la imagen del cantón',
        status: 500,
        details: { cantonId, error }
      });
    }
  }
} 
import { CustomError } from '../utils/customError';
import { ApiErrorCode } from '../types/apiError';
import { prisma } from '../lib/prisma';
import { ActivityCategory } from '@prisma/client';
import { StorageService } from './storageService';

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
   * Sube o actualiza la imagen de un cantón
   */
  static async uploadImage(cantonId: number, file: Express.Multer.File, userId: number) {
    try {
      console.log('=== Iniciando carga de imagen para cantón ===', { cantonId, userId });
      
      // Validar la imagen antes de procesarla
      await this.validateImage(file);
      console.log('Imagen validada correctamente');

      // Verificar que el cantón existe
      const canton = await prisma.canton.findUnique({
        where: { id: cantonId },
        select: { id: true, imagenUrl: true }
      });

      if (!canton) {
        console.error('Cantón no encontrado:', cantonId);
        throw new CustomError({
          code: ApiErrorCode.NOT_FOUND,
          message: 'Cantón no encontrado',
          status: 404,
          details: { cantonId }
        });
      }
      console.log('Cantón encontrado:', canton);

      // Si ya existe una imagen, eliminarla primero
      if (canton.imagenUrl) {
        try {
          console.log('Eliminando imagen anterior:', canton.imagenUrl);
          await StorageService.deleteFile(canton.imagenUrl);
          console.log('Imagen anterior eliminada correctamente');
        } catch (error) {
          console.error('Error al eliminar imagen anterior:', error);
          // Continuamos con la operación aunque falle la eliminación
        }
      }

      // Subir la nueva imagen
      console.log('Subiendo nueva imagen...');
      const { url: imagenUrl } = await StorageService.saveFile(file, 'cantones');
      console.log('Nueva imagen subida correctamente:', imagenUrl);

      // Actualizar la URL de la imagen en la base de datos
      console.log('Actualizando registro en base de datos...');
      const updatedCanton = await prisma.canton.update({
        where: { id: cantonId },
        data: {
          imagenUrl,
          updatedBy: userId
        }
      });
      console.log('Base de datos actualizada correctamente');

      // Registrar la actividad
      console.log('Registrando actividad...');
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'CANTON_IMAGE_UPDATED',
          category: ActivityCategory.CANTON,
          targetId: cantonId,
          details: {
            description: canton.imagenUrl ? 'Imagen de cantón actualizada' : 'Imagen de cantón subida',
            metadata: {
              cantonId,
              oldImageUrl: canton.imagenUrl,
              newImageUrl: imagenUrl,
              filename: file.originalname
            }
          }
        }
      });
      console.log('Actividad registrada correctamente');

      return updatedCanton;
    } catch (error) {
      console.error('=== Error en uploadImage ===');
      console.error('Detalles del error:', error);
      
      // Si algo falla y existe un archivo temporal, eliminarlo
      if (file.path) {
        try {
          console.log('Eliminando archivo temporal:', file.path);
          await StorageService.deleteFile(file.path);
          console.log('Archivo temporal eliminado correctamente');
        } catch (deleteError) {
          console.error('Error al eliminar archivo temporal:', deleteError);
        }
      }

      if (error instanceof CustomError) throw error;
      
      throw new CustomError({
        code: ApiErrorCode.UPLOAD_ERROR,
        message: 'Error al subir la imagen del cantón',
        status: 500,
        details: {
          error: error instanceof Error ? error.message : 'Error desconocido',
          cantonId,
          fileName: file.originalname
        }
      });
    }
  }

  /**
   * Elimina la imagen de un cantón
   */
  static async deleteImage(cantonId: number, userId: number) {
    try {
      // Verificar que el cantón existe y obtener su imagen actual
      const canton = await prisma.canton.findUnique({
        where: { id: cantonId },
        select: { id: true, imagenUrl: true }
      });

      if (!canton) {
        throw new CustomError({
          code: ApiErrorCode.NOT_FOUND,
          message: 'Cantón no encontrado',
          status: 404
        });
      }

      if (!canton.imagenUrl) {
        throw new CustomError({
          code: ApiErrorCode.NOT_FOUND,
          message: 'El cantón no tiene una imagen para eliminar',
          status: 404
        });
      }

      // Eliminar la imagen del almacenamiento
      await StorageService.deleteFile(canton.imagenUrl);

      // Actualizar el cantón en la base de datos
      const updatedCanton = await prisma.canton.update({
        where: { id: cantonId },
        data: {
          imagenUrl: null,
          updatedBy: userId
        }
      });

      // Registrar la actividad
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'CANTON_IMAGE_DELETED',
          category: ActivityCategory.CANTON,
          targetId: cantonId,
          details: {
            description: 'Imagen de cantón eliminada',
            metadata: {
              cantonId,
              previousImageUrl: canton.imagenUrl
            }
          }
        }
      });

      return updatedCanton;
    } catch (error) {
      console.error('Error en deleteImage:', error);
      if (error instanceof CustomError) throw error;
      throw new CustomError({
        code: ApiErrorCode.DELETE_ERROR,
        message: 'Error al eliminar la imagen',
        status: 500
      });
    }
  }
} 
import path from 'path';
import { promises as fs } from 'fs';
import { CustomError } from '../utils/customError';
import { ApiErrorCode } from '../types/apiError';
import {
  UPLOAD_BASE_PATH,
  CANTONES_PATH,
  DOCUMENTOS_PATH,
  validateFileType,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES
} from '../config/storage';
import { logActivity } from './logService';
import { ActivityCategory } from '.prisma/client';

export interface FileMetadata {
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedBy: number;
  category: 'canton' | 'documento';
  entityId?: number;
}

class FileService {
  /**
   * Guarda un archivo y registra sus metadatos
   */
  async saveFile(
    file: Express.Multer.File,
    userId: number,
    category: 'canton' | 'documento',
    entityId?: number
  ): Promise<FileMetadata> {
    try {
      // Validar tipo de archivo
      const allowedTypes = category === 'canton' ? ALLOWED_IMAGE_TYPES : ALLOWED_DOCUMENT_TYPES;
      if (!validateFileType(file, allowedTypes)) {
        throw new CustomError({
          code: ApiErrorCode.INVALID_FILE_TYPE,
          message: 'Tipo de archivo no permitido',
          status: 400,
          details: {
            allowedTypes,
            receivedType: file.mimetype
          }
        });
      }

      // Determinar ruta de destino
      const destinationPath = category === 'canton' ? CANTONES_PATH : DOCUMENTOS_PATH;
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const fileName = `${category}-${uniqueSuffix}${ext}`;
      const finalPath = path.join(destinationPath, fileName);

      // Mover archivo a su ubicación final
      await fs.rename(file.path, finalPath);

      // Crear metadatos
      const metadata: FileMetadata = {
        originalName: file.originalname,
        fileName,
        mimeType: file.mimetype,
        size: file.size,
        path: finalPath,
        uploadedBy: userId,
        category,
        entityId
      };

      // Registrar actividad
      await logActivity(userId, `UPLOAD_${category.toUpperCase()}`, {
        category: ActivityCategory.SYSTEM,
        targetId: entityId,
        details: {
          description: `Archivo subido: ${file.originalname}`,
          metadata: {
            fileName,
            fileType: file.mimetype,
            fileSize: file.size
          }
        }
      });

      return metadata;
    } catch (error) {
      // Limpiar archivo temporal si existe
      if (file.path && await fs.access(file.path).then(() => true).catch(() => false)) {
        await fs.unlink(file.path);
      }
      throw error;
    }
  }

  /**
   * Elimina un archivo y sus metadatos
   */
  async deleteFile(
    filePath: string,
    userId: number,
    category: 'canton' | 'documento',
    entityId?: number
  ): Promise<void> {
    try {
      // Verificar que el archivo existe
      await fs.access(filePath);
      
      // Eliminar archivo
      await fs.unlink(filePath);

      // Registrar actividad
      await logActivity(userId, `DELETE_${category.toUpperCase()}`, {
        category: ActivityCategory.SYSTEM,
        targetId: entityId,
        details: {
          description: `Archivo eliminado: ${path.basename(filePath)}`,
          metadata: {
            filePath,
            deletedAt: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error as any).code === 'ENOENT') {
        throw new CustomError({
          code: ApiErrorCode.FILE_NOT_FOUND,
          message: 'Archivo no encontrado',
          status: 404,
          details: { filePath }
        });
      }
      throw error;
    }
  }

  /**
   * Obtiene la ruta relativa de un archivo para acceso web
   */
  getWebPath(filePath: string): string {
    const relativePath = path.relative(UPLOAD_BASE_PATH, filePath);
    return `/uploads/${relativePath.replace(/\\/g, '/')}`;
  }

  /**
   * Verifica si un archivo existe
   */
  async fileExists(filePath: string): Promise<boolean> {
    return fs.access(filePath).then(() => true).catch(() => false);
  }

  /**
   * Obtiene los metadatos de un archivo
   */
  async getFileStats(filePath: string): Promise<{ size: number; created: Date; modified: Date }> {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  }
}

export const fileService = new FileService(); 
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { UPLOAD_BASE_PATH } from '../config/storage';
import { DriveService } from './driveService';
import { FOLDER_IDS } from '../config/googleDrive';
import { CustomError } from '../utils/customError';
import { ApiErrorCode } from '../types/apiError';

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dbzwygjr0',
  api_key: process.env.CLOUDINARY_API_KEY || '216772599449817',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'f76xrmJETvk3eJwGp0mZSqpL70w',
  secure: true
});

// Tipo de almacenamiento
type StorageType = 'local' | 'cloudinary' | 'google-drive';

// Configuración del servicio
const STORAGE_TYPE = (process.env.STORAGE_TYPE || 'google-drive') as StorageType;

export class StorageService {
  private static cloudinary = cloudinary;
  
  static async saveFile(file: Express.Multer.File, folder: string = 'documentos'): Promise<{ url: string; fileId?: string }> {
    try {
      // Determinar el tipo de almacenamiento basado en el tipo de archivo y carpeta
      const isImage = file.mimetype.startsWith('image/');
      const storageType = isImage ? 'cloudinary' : STORAGE_TYPE;

      console.log('Guardando archivo con configuración:', {
        mimetype: file.mimetype,
        isImage,
        storageType,
        folder
      });

      switch (storageType) {
        case 'google-drive':
          const folderId = FOLDER_IDS[folder.toUpperCase() as keyof typeof FOLDER_IDS];
          if (!folderId) {
            throw new Error(`Folder ${folder} no encontrado en Google Drive`);
          }
          const url = await DriveService.uploadFile(file, folderId);
          // Extraer el ID del archivo de la URL
          const fileId = url.match(/\/d\/([^/]+)/)?.[1];
          if (!fileId) {
            throw new Error('No se pudo extraer el ID del archivo de Google Drive');
          }
          return { url, fileId };

        case 'cloudinary':
          const result = await this.saveToCloudinary(file);
          return { url: result.secure_url };

        case 'local':
          const localPath = await this.saveLocally(file, folder);
          return { url: localPath };

        default:
          throw new Error(`Tipo de almacenamiento no soportado: ${storageType}`);
      }
    } catch (error) {
      console.error('Error en saveFile:', error);
      throw new CustomError({
        code: ApiErrorCode.UPLOAD_ERROR,
        message: 'Error al guardar el archivo',
        status: 500,
        details: { error }
      });
    }
  }

  static async deleteFile(url: string, fileId?: string): Promise<void> {
    try {
      switch (STORAGE_TYPE) {
        case 'google-drive':
          if (fileId) {
            await DriveService.deleteFile(fileId);
          } else {
            console.warn('No se proporcionó fileId para eliminar archivo de Google Drive');
          }
          break;

        case 'cloudinary':
          await this.deleteFromCloudinary(url);
          break;

        case 'local':
          await this.deleteLocally(url);
          break;

        default:
          throw new Error(`Tipo de almacenamiento no soportado: ${STORAGE_TYPE}`);
      }
    } catch (error) {
      console.error('Error en deleteFile:', error);
      throw new CustomError({
        code: ApiErrorCode.DELETE_ERROR,
        message: 'Error al eliminar el archivo',
        status: 500,
        details: { error }
      });
    }
  }

  private static async saveToCloudinary(file: Express.Multer.File): Promise<any> {
    if (!this.cloudinary) {
      throw new Error('Cloudinary no está configurado');
    }
    
    const isImage = file.mimetype.startsWith('image/');
    const uploadOptions = {
      folder: `gestion-abogados/${isImage ? 'cantones' : 'documentos'}`,
      resource_type: (isImage ? 'image' : 'raw') as 'image' | 'raw',
      access_mode: 'public',
      unique_filename: true,
      ...(isImage && {
        transformation: [
          { width: 1200, crop: 'limit' },
          { quality: 'auto' }
        ]
      })
    };

    console.log('Subiendo archivo a Cloudinary:', {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      hasBuffer: !!file.buffer,
      uploadOptions
    });

    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Error en uploadStream:', error);
            reject(error);
          } else if (result) {
            console.log('Archivo subido exitosamente:', {
              publicId: result.public_id,
              url: result.secure_url,
              format: result.format
            });
            resolve(result);
          } else {
            reject(new Error('No se recibió respuesta de Cloudinary'));
          }
        }
      );

      if (!file.buffer) {
        reject(new Error('No hay contenido de archivo para subir'));
        return;
      }

      uploadStream.end(file.buffer);
    });
  }

  private static async deleteFromCloudinary(url: string): Promise<void> {
    if (!this.cloudinary) {
      throw new Error('Cloudinary no está configurado');
    }

    const publicId = url.split('/').pop()?.split('.')[0];
    if (!publicId) {
      throw new Error('No se pudo extraer el public_id de la URL');
    }

    await this.cloudinary.uploader.destroy(publicId);
  }

  private static async saveLocally(file: Express.Multer.File, folder: string): Promise<string> {
    const uploadDir = path.join(process.cwd(), 'uploads', folder);
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${Date.now()}-${file.originalname}`;
    const filepath = path.join(uploadDir, filename);

    // Guardar archivo
    await fs.promises.writeFile(filepath, file.buffer);

    // Devolver ruta relativa
    return path.join('uploads', folder, filename);
  }

  private static async deleteLocally(filepath: string): Promise<void> {
    const absolutePath = path.join(process.cwd(), filepath);
    
    if (fs.existsSync(absolutePath)) {
      await fs.promises.unlink(absolutePath);
    }
  }

  static getFileUrl(relativePath: string): string {
    if (STORAGE_TYPE === 'cloudinary' || relativePath.includes('cloudinary.com')) {
      return relativePath; // Ya es una URL completa de Cloudinary
    }
    if (STORAGE_TYPE === 'google-drive' || relativePath.includes('drive.google.com')) {
      return relativePath; // Ya es una URL completa de Google Drive
    }
    // Para local, construir URL completa
    return `${process.env.BASE_URL || 'http://localhost:3000'}${relativePath}`;
  }
} 
import { driveClient, FOLDER_IDS, createFolderIfNotExists } from '../config/googleDrive';
import { Readable } from 'stream';
import { CustomError } from '../utils/customError';
import { ApiErrorCode } from '../types/apiError';
import { drive_v3 } from 'googleapis';

export class DriveService {
  private static readonly MAX_RETRIES = 3;
  private static readonly INITIAL_RETRY_DELAY = 1000; // 1 segundo

  /**
   * Utilidad para reintentar operaciones con backoff exponencial
   */
  private static async retryOperation<T>(
    operation: () => Promise<T>,
    errorMessage: string,
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Si no es un error de autorización o es el último intento, no reintentar
        if (error?.response?.status !== 403 || attempt === maxRetries) {
          throw new CustomError({
            code: ApiErrorCode.DRIVE_ERROR,
            message: `${errorMessage}: ${error.message}`,
            status: error?.response?.status || 500
          });
        }
        
        // Calcular delay con backoff exponencial
        const delay = this.INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
        console.log(`Intento ${attempt} fallido. Reintentando en ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Asegura que la carpeta existe y tiene los permisos correctos
   */
  private static async ensureFolder(folderId: string): Promise<string> {
    try {
      // Verificar si la carpeta existe
      await driveClient.files.get({ fileId: folderId });
      console.log('Carpeta encontrada:', folderId);
      
      // Verificar permisos de la carpeta
      const permissions = await driveClient.permissions.list({ fileId: folderId });
      const hasPublicAccess = permissions.data.permissions?.some(p => p.type === 'anyone');
      const adminEmail = process.env.GOOGLE_DRIVE_ADMIN_EMAIL || 'luis.toala.r3@gmail.com';
      const hasAdminAccess = permissions.data.permissions?.some(p => p.emailAddress === adminEmail);
      
      // Configurar permisos públicos si no existen
      if (!hasPublicAccess) {
        console.log('Configurando permisos públicos de la carpeta...');
        await driveClient.permissions.create({
          fileId: folderId,
          requestBody: {
            role: 'reader',
            type: 'anyone'
          }
        });
      }

      // Compartir con el administrador si aún no tiene acceso
      if (!hasAdminAccess && adminEmail) {
        console.log('Compartiendo carpeta con el administrador:', adminEmail);
        await driveClient.permissions.create({
          fileId: folderId,
          requestBody: {
            role: 'writer',
            type: 'user',
            emailAddress: adminEmail
          },
          sendNotificationEmail: true
        });
      }
      
      // Obtener el enlace compartido
      const file = await driveClient.files.get({
        fileId: folderId,
        fields: 'webViewLink'
      });
      
      console.log('Enlace de la carpeta:', file.data.webViewLink);
      
      return folderId;
    } catch (error) {
      console.log('Carpeta no encontrada, creando nueva...', error);
      const newFolderId = await createFolderIfNotExists('documentos');
      // Recursivamente configurar permisos para la nueva carpeta
      return this.ensureFolder(newFolderId);
    }
  }

  /**
   * Sube un archivo a Google Drive
   */
  static async uploadFile(file: Express.Multer.File, folderId: string = FOLDER_IDS.DOCUMENTOS): Promise<string> {
    return this.retryOperation(async () => {
      try {
        console.log('=== Iniciando carga de archivo a Google Drive ===');
        console.log('Folder ID:', folderId);
        
        // Asegurar que la carpeta existe y tiene permisos
        const validFolderId = await this.ensureFolder(folderId);
        console.log('Usando carpeta:', validFolderId);

        // Subir el archivo
        console.log('Subiendo archivo...');
        const response = await driveClient.files.create({
          requestBody: {
            name: file.originalname,
            mimeType: file.mimetype,
            parents: [validFolderId],
            // Configurar permisos iniciales
            permissionIds: ['anyoneWithLink'],
            copyRequiresWriterPermission: false,
            viewersCanCopyContent: true
          },
          media: {
            mimeType: file.mimetype,
            body: Readable.from(file.buffer)
          },
          fields: 'id, webViewLink'
        });

        if (!response.data.id) {
          throw new Error('No se pudo obtener el ID del archivo');
        }
        console.log('Archivo subido con ID:', response.data.id);

        // Configurar permisos más permisivos para la previsualización
        console.log('Configurando permisos del archivo...');
        await this.retryOperation(
          () => driveClient.permissions.create({
            fileId: response.data.id!,
            requestBody: {
              role: 'reader',
              type: 'anyone'
            }
          }),
          'Error al configurar permisos del archivo'
        );
        console.log('Permisos configurados correctamente');

        // Actualizar la configuración del archivo para permitir la previsualización
        console.log('Actualizando configuración del archivo...');
        await this.retryOperation(
          () => driveClient.files.update({
            fileId: response.data.id!,
            requestBody: {
              copyRequiresWriterPermission: false,
              viewersCanCopyContent: true
            }
          }),
          'Error al actualizar la configuración del archivo'
        );
        console.log('Configuración actualizada correctamente');

        // Construir una URL de previsualización más robusta
        const previewUrl = `https://drive.google.com/file/d/${response.data.id}/preview`;
        console.log('URL de previsualización generada:', previewUrl);
        
        return previewUrl;
      } catch (error) {
        console.error('Error en uploadFile:', error);
        throw new CustomError({
          code: ApiErrorCode.UPLOAD_ERROR,
          message: 'Error al subir archivo a Google Drive',
          status: 500,
          details: {
            error: error instanceof Error ? error.message : 'Error desconocido',
            fileName: file.originalname,
            folderId
          }
        });
      }
    }, 'Error al subir archivo a Drive');
  }

  /**
   * Obtiene la URL de previsualización de un archivo
   */
  static async getPreviewUrl(fileId: string): Promise<string> {
    return this.retryOperation(async () => {
      // Verificar que el archivo existe y obtener sus permisos
      const file = await driveClient.files.get({
        fileId,
        fields: 'id, capabilities, permissions'
      });

      // Si el archivo existe, verificar permisos
      if (file.data.id) {
        // Asegurar que el archivo tiene permisos de lectura pública
        const hasPublicAccess = file.data.permissions?.some(p => p.type === 'anyone');
        if (!hasPublicAccess) {
          await this.retryOperation(
            () => driveClient.permissions.create({
              fileId: file.data.id!,
              requestBody: {
                role: 'reader',
                type: 'anyone'
              }
            }),
            'Error al configurar permisos del archivo'
          );
        }
        
        return `https://drive.google.com/file/d/${file.data.id}/preview`;
      }

      throw new Error('Archivo no encontrado');
    }, 'Error al obtener URL de previsualización');
  }

  /**
   * Elimina un archivo de Google Drive
   */
  static async deleteFile(fileId: string): Promise<void> {
    try {
      await driveClient.files.delete({
        fileId
      });
    } catch (error) {
      console.error('Error al eliminar archivo de Drive:', error);
      throw new CustomError({
        code: ApiErrorCode.DELETE_ERROR,
        message: 'Error al eliminar el archivo de Google Drive',
        status: 500
      });
    }
  }

  /**
   * Actualiza un archivo en Google Drive
   */
  static async updateFile(fileId: string, file: Express.Multer.File): Promise<string> {
    try {
      const response = await driveClient.files.update({
        fileId,
        requestBody: {
          name: file.originalname,
          mimeType: file.mimetype
        },
        media: {
          mimeType: file.mimetype,
          body: Readable.from(file.buffer)
        },
        fields: 'id, webViewLink'
      });

      return response.data.webViewLink || '';
    } catch (error) {
      console.error('Error al actualizar archivo en Drive:', error);
      throw new CustomError({
        code: ApiErrorCode.UPDATE_ERROR,
        message: 'Error al actualizar el archivo en Google Drive',
        status: 500
      });
    }
  }
} 
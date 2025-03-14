import { prisma } from '../lib/prisma';
import { TipoDocumento } from '@prisma/client';
import { CustomError } from '../utils/customError';
import { ApiErrorCode } from '../types/apiError';
import { StorageService } from './storageService';

const DOCUMENTOS_OBLIGATORIOS = [
  TipoDocumento.CEDULA,
  TipoDocumento.CERTIFICADO_VOTACION,
  TipoDocumento.MATRICULA_VEHICULO
];

export class DocumentoService {
  static async saveDocumento(
    file: Express.Multer.File,
    personaId: number,
    tipo: TipoDocumento,
    userId: number
  ) {
    try {
      console.log('=== Iniciando guardado de documento ===');
      console.log('Datos recibidos:', {
        filename: file.originalname,
        tipo,
        personaId,
        userId
      });

      // Validar que la persona existe
      const persona = await prisma.persona.findUnique({
        where: { id: personaId },
        select: {
          id: true,
          cantonId: true
        }
      });

      if (!persona) {
        console.error('Persona no encontrada:', personaId);
        throw new CustomError({
          code: ApiErrorCode.NOT_FOUND,
          message: 'Persona no encontrada',
          status: 404,
          details: { personaId }
        });
      }

      console.log('Persona encontrada:', persona);

      // Buscar si ya existe un documento activo del mismo tipo
      const documentoExistente = await prisma.documento.findFirst({
        where: {
          personaId,
          tipo,
          isActive: true
        },
        select: {
          id: true,
          url: true,
          driveFileId: true
        }
      });

      if (documentoExistente) {
        console.log('Documento existente encontrado:', documentoExistente);
        console.log('Procediendo a desactivar y eliminar archivo anterior...');
        
        await StorageService.deleteFile(documentoExistente.url, documentoExistente.driveFileId || undefined);
        await prisma.documento.update({
          where: { id: documentoExistente.id },
          data: {
            isActive: false,
            updatedBy: userId
          }
        });
        
        console.log('Documento anterior desactivado correctamente');
      }

      // Guardar el archivo usando StorageService
      console.log('Guardando archivo en storage...');
      const { url: fileUrl, fileId: driveFileId } = await StorageService.saveFile(file, 'documentos');
      console.log('Archivo guardado exitosamente:', { fileUrl, driveFileId });

      // Crear el registro del nuevo documento
      console.log('Creando registro en base de datos...');
      const documento = await prisma.documento.create({
        data: {
          tipo,
          url: fileUrl,
          driveFileId,
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          personaId,
          createdBy: userId,
          updatedBy: userId
        },
        select: {
          id: true,
          tipo: true,
          url: true,
          driveFileId: true,
          filename: true,
          persona: {
            select: {
              id: true,
              cantonId: true
            }
          }
        }
      });

      console.log('Documento creado exitosamente:', documento);

      // Registrar la actividad
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'DOCUMENTO_CREADO',
          category: 'DOCUMENTO',
          targetId: documento.id,
          details: {
            tipo,
            personaId,
            cantonId: persona.cantonId,
            filename: file.originalname
          }
        }
      });

      console.log('Actividad registrada correctamente');

      // Actualizar el estado de documentos completos
      await this.actualizarEstadoDocumentos(personaId);
      console.log('Estado de documentos actualizado');

      return documento;
    } catch (error) {
      console.error('Error en saveDocumento:', error);
      throw error;
    }
  }

  static async eliminarDocumento(documentoId: number, personaId: number, userId: number) {
    try {
      if (!documentoId || !personaId || !userId) {
        throw new CustomError({
          code: ApiErrorCode.VALIDATION_ERROR,
          message: 'Faltan parámetros requeridos',
          status: 400,
          details: { documentoId, personaId, userId }
        });
      }

      const documento = await prisma.documento.findFirst({
        where: {
          id: documentoId,
          personaId: personaId,
          isActive: true
        },
        select: {
          id: true,
          url: true,
          driveFileId: true,
          tipo: true,
          filename: true,
          persona: {
            select: {
              cantonId: true
            }
          }
        }
      });

      if (!documento) {
        throw new CustomError({
          code: ApiErrorCode.NOT_FOUND,
          message: 'Documento no encontrado o ya fue eliminado',
          status: 404,
          details: { documentoId, personaId }
        });
      }

      // Eliminar archivo
      let archivoEliminado = false;
      try {
        await StorageService.deleteFile(documento.url, documento.driveFileId || undefined);
        archivoEliminado = true;
      } catch (error) {
        console.error('Error al eliminar archivo:', error);
      }

      // Desactivar el documento en la base de datos
      const documentoActualizado = await prisma.documento.update({
        where: { id: documentoId },
        data: {
          isActive: false,
          updatedBy: userId
        }
      });

      // Registrar la actividad
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'DOCUMENTO_ELIMINADO',
          category: 'DOCUMENTO',
          targetId: documentoId,
          details: {
            tipo: documento.tipo,
            personaId,
            cantonId: documento.persona.cantonId,
            filename: documento.filename
          }
        }
      });

      // Actualizar el estado de documentos completos
      await this.actualizarEstadoDocumentos(personaId);

      return {
        success: true,
        archivoEliminado,
        documentoDesactivado: true
      };
    } catch (error) {
      console.error('Error en eliminarDocumento:', error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError({
        code: ApiErrorCode.INTERNAL_ERROR,
        message: 'Error al eliminar el documento',
        status: 500,
        details: { documentoId, personaId }
      });
    }
  }

  static async actualizarEstadoDocumentos(personaId: number) {
    // Obtener todos los documentos activos de la persona
    const documentosActivos = await prisma.documento.findMany({
      where: {
        personaId,
        isActive: true
      }
    });

    // Verificar si tiene todos los documentos obligatorios
    const tieneObligatorios = DOCUMENTOS_OBLIGATORIOS.every(tipoObligatorio =>
      documentosActivos.some(doc => doc.tipo === tipoObligatorio)
    );

    // Actualizar el estado en la persona
    await prisma.persona.update({
      where: { id: personaId },
      data: {
        documentosCompletos: tieneObligatorios
      }
    });
  }

  static async getDocumentosByPersona(personaId: number) {
    const documentos = await prisma.documento.findMany({
      where: {
        personaId,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return documentos;
  }

  static validateDocumentoType(tipo: string): TipoDocumento {
    if (!Object.values(TipoDocumento).includes(tipo as TipoDocumento)) {
      throw new CustomError({
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'Tipo de documento inválido',
        status: 400,
        details: { tipo, validTypes: Object.values(TipoDocumento) }
      });
    }
    return tipo as TipoDocumento;
  }
} 
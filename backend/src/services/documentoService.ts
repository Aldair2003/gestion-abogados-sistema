import { prisma } from '../lib/prisma';
import { TipoDocumento } from '@prisma/client';
import { CustomError } from '../utils/customError';
import { ApiErrorCode } from '../types/apiError';
import { storageService } from './storageService';

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
      // Validar que la persona existe
      const persona = await prisma.persona.findUnique({
        where: { id: personaId }
      });

      if (!persona) {
        throw new CustomError({
          code: ApiErrorCode.NOT_FOUND,
          message: 'Persona no encontrada',
          status: 404,
          details: { personaId }
        });
      }

      // Buscar si ya existe un documento activo del mismo tipo
      const documentoExistente = await prisma.documento.findFirst({
        where: {
          personaId,
          tipo,
          isActive: true
        }
      });

      // Si existe un documento anterior, lo desactivamos y eliminamos el archivo
      if (documentoExistente) {
        await this.eliminarArchivoFisico(documentoExistente.url);
        await prisma.documento.update({
          where: { id: documentoExistente.id },
          data: {
            isActive: false,
            updatedBy: userId
          }
        });
      }

      // Guardar el archivo usando storageService
      const fileUrl = await storageService.saveFile(file, 'documentos');

      // Crear el registro del nuevo documento
      const documento = await prisma.documento.create({
        data: {
          tipo,
          url: fileUrl,
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          personaId,
          createdBy: userId,
          updatedBy: userId
        }
      });

      // Actualizar el estado de documentos completos
      await this.actualizarEstadoDocumentos(personaId);

      return documento;
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

  static async eliminarArchivoFisico(fileUrl: string) {
    try {
      await storageService.deleteFile(fileUrl);
      return true;
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      return false;
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

      console.log('Iniciando eliminación de documento:', {
        documentoId,
        personaId,
        userId,
        parametrosValidos: {
          documentoId: !isNaN(documentoId),
          personaId: !isNaN(personaId),
          userId: !isNaN(userId)
        }
      });

      const documento = await prisma.documento.findFirst({
        where: {
          id: documentoId,
          personaId: personaId,
          isActive: true
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

      console.log('Documento encontrado:', documento);

      // Intentar eliminar el archivo físico
      const archivoEliminado = await this.eliminarArchivoFisico(documento.url);
      console.log('Resultado eliminación física:', archivoEliminado);

      // Desactivar el documento en la base de datos
      const documentoActualizado = await prisma.documento.update({
        where: { id: documentoId },
        data: {
          isActive: false,
          updatedBy: userId
        }
      });

      console.log('Documento desactivado en BD:', documentoActualizado);

      // Actualizar el estado de documentos completos
      await this.actualizarEstadoDocumentos(personaId);

      return {
        success: true,
        archivoEliminado,
        documentoDesactivado: true
      };
    } catch (error) {
      console.error('Error en eliminarDocumento:', {
        error,
        documentoId,
        personaId,
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      if (error instanceof CustomError) {
        throw error;
      }
      
      throw new CustomError({
        code: ApiErrorCode.INTERNAL_ERROR,
        message: 'Error al eliminar el documento',
        status: 500,
        details: { 
          documentoId, 
          personaId,
          error: error instanceof Error ? error.message : 'Error desconocido'
        }
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
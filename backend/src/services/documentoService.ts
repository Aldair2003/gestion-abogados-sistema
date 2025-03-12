import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma';
import { TipoDocumento } from '@prisma/client';
import { CustomError } from '../utils/customError';
import { ApiErrorCode } from '../types/apiError';

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

      // Crear el registro del nuevo documento
      const documento = await prisma.documento.create({
        data: {
          tipo,
          url: `uploads/documentos/${file.filename}`.replace(/\\/g, '/'),
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
      // Si algo falla, eliminar el archivo si se subió
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw error;
    }
  }

  static async eliminarArchivoFisico(urlRelativa: string) {
    try {
      // Normalizar la ruta relativa eliminando /uploads/ si existe
      const rutaNormalizada = urlRelativa
        .replace(/^\/uploads\//, '')
        .replace(/^uploads\//, '');
      
      // Construir la ruta completa
      const rutaCompleta = path.join(process.cwd(), 'uploads', rutaNormalizada);
      
      console.log('Eliminando archivo:', {
        urlOriginal: urlRelativa,
        rutaNormalizada,
        rutaCompleta,
        exists: fs.existsSync(rutaCompleta),
        cwd: process.cwd()
      });

      if (fs.existsSync(rutaCompleta)) {
        fs.unlinkSync(rutaCompleta);
        console.log('Archivo eliminado físicamente:', rutaCompleta);
        return true;
      } else {
        console.log('El archivo no existe físicamente:', rutaCompleta);
        return false;
      }
    } catch (error) {
      console.error('Error al eliminar archivo físico:', {
        error,
        urlRelativa,
        stack: error instanceof Error ? error.stack : undefined,
        errorCode: error instanceof Error && 'code' in error ? (error as any).code : undefined
      });
      // No lanzamos el error para que no afecte el flujo principal
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
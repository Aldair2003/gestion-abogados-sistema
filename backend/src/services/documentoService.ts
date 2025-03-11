import fs from 'fs';
import { prisma } from '../lib/prisma';
import { TipoDocumento } from '@prisma/client';
import { CustomError } from '../utils/customError';
import { ApiErrorCode } from '../types/apiError';

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

      // Crear el registro del documento
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

      return documento;
    } catch (error) {
      // Si algo falla, eliminar el archivo si se subió
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw error;
    }
  }

  static async deleteDocumento(documentoId: number, userId: number) {
    // Verificar que el documento existe
    const documento = await prisma.documento.findUnique({
      where: { id: documentoId }
    });

    if (!documento) {
      throw new CustomError({
        code: ApiErrorCode.NOT_FOUND,
        message: 'Documento no encontrado',
        status: 404,
        details: { documentoId }
      });
    }

    // Eliminar el archivo físico
    if (documento.url && fs.existsSync(documento.url)) {
      fs.unlinkSync(documento.url);
    }

    // Actualizar el documento como inactivo y registrar quién lo eliminó
    await prisma.documento.update({
      where: { id: documentoId },
      data: {
        isActive: false,
        updatedBy: userId
      }
    });

    return true;
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
        details: {
          tipoRecibido: tipo,
          tiposPermitidos: Object.values(TipoDocumento)
        }
      });
    }

    return tipo as TipoDocumento;
  }
} 
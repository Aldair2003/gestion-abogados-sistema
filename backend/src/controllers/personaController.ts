import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { logActivity } from '../services/logService';
import { ActivityCategory } from '../types/prisma';
import { validateTelefono, validateMatriculas } from '../utils/validators';
import {
  CreatePersonaDTO,
  CreateDocumentoDTO,
  UpdateDocumentoDTO,
  DocumentoFilters
} from '../types/persona';
import { RequestWithUser } from '../types/user';
import { Prisma } from '.prisma/client';
import { CustomError } from '../utils/customError';
import { ApiErrorCode } from '../types/apiError';
import { DocumentoService } from '../services/documentoService';

// Crear persona
export const createPersona = async (
  req: RequestWithUser & { body: CreatePersonaDTO },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { cedula, nombres, apellidos, telefono, contactoRef, email, domicilio, matriculasVehiculo } = req.body;
    const cantonId = Number(req.params.cantonId);
    const userId = req.user!.id;

    // Validar que no exista la persona en el mismo cantón
    const existingPersona = await prisma.persona.findFirst({
      where: {
        cedula,
        cantonId
      }
    });

    if (existingPersona) {
      throw new CustomError({
        code: ApiErrorCode.DUPLICATE_ENTRY,
        message: 'Ya existe una persona con esta cédula en este cantón',
        status: 400,
        details: { cedula, cantonId }
      });
    }

    // Crear la persona
    const persona = await prisma.persona.create({
      data: {
        cedula,
        nombres,
        apellidos,
        telefono,
        contactoRef,
        email,
        domicilio,
        matriculasVehiculo: matriculasVehiculo || [],
        cantonId,
        createdBy: userId,
        updatedBy: userId
      },
      include: {
        canton: true
      }
    });

    // Registrar la actividad
    await logActivity(userId, 'CREATE_PERSONA', {
      category: ActivityCategory.PERSONA,
      targetId: persona.id,
      details: {
        description: 'Persona creada exitosamente',
        metadata: {
          personaCedula: persona.cedula,
          cantonId: persona.cantonId
        }
      }
    });

    res.status(201).json({
      status: 'success',
      data: persona
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar persona
export const updatePersona = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { nombres, apellidos, telefono, contactoRef, email, domicilio, matriculasVehiculo, isActive } = req.body;

    // Validar los datos antes de crear el objeto de actualización
    if (telefono && !validateTelefono(telefono)) {
      throw new CustomError({
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'Formato de teléfono inválido',
        status: 400,
        details: { 
          telefono,
          formato: 'Debe ser un número válido de Ecuador (fijo o celular)'
        }
      });
    }

    if (contactoRef && !validateTelefono(contactoRef)) {
      throw new CustomError({
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'Formato de teléfono de contacto inválido',
        status: 400,
        details: { 
          contactoRef,
          formato: 'Debe ser un número válido de Ecuador (fijo o celular)'
        }
      });
    }

    if (matriculasVehiculo && Array.isArray(matriculasVehiculo) && !validateMatriculas(matriculasVehiculo)) {
      throw new CustomError({
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'Una o más matrículas tienen formato inválido',
        status: 400,
        details: { 
          matriculasVehiculo,
          formato: 'Formato válido: ABC-1234'
        }
      });
    }

    const updateData: Prisma.PersonaUpdateInput = {
      ...(nombres && { nombres: { set: nombres } }),
      ...(apellidos && { apellidos: { set: apellidos } }),
      ...(telefono && { telefono: { set: telefono } }),
      ...(contactoRef && { contactoRef: { set: contactoRef } }),
      ...(email && { email: { set: email } }),
      ...(domicilio && { domicilio: { set: domicilio } }),
      ...(Array.isArray(matriculasVehiculo) && { matriculasVehiculo: { set: matriculasVehiculo } }),
      ...(typeof isActive === 'boolean' && { isActive: { set: isActive } })
    };

    const persona = await prisma.persona.update({
      where: { id: Number(id) },
      data: {
        ...updateData,
        updatedBy: req.user!.id
      }
    });

    await logActivity(req.user!.id, 'UPDATE_PERSONA', {
      category: ActivityCategory.PERSONA,
      targetId: persona.id,
      details: {
        description: 'Persona actualizada exitosamente',
        metadata: {
          personaCedula: persona.cedula,
          updatedFields: Object.keys(updateData)
        }
      }
    });

    res.json({
      status: 'success',
      data: persona
    });
  } catch (error) {
    next(error);
  }
};

// Obtener personas con paginación y filtros avanzados
export const getPersonas = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { 
      search,
      isActive,
      startDate,
      endDate,
      hasDocuments,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10 
    } = req.query;
    
    const cantonId = req.params.cantonId;
    const userId = req.user!.id;
    const skip = (Number(page) - 1) * Number(limit);

    console.log('Parámetros recibidos:', {
      cantonId,
      search,
      isActive,
      userId,
      page,
      limit
    });

    // Construir la consulta base con filtros avanzados
    const where: Prisma.PersonaWhereInput = {
      cantonId: Number(cantonId),
      isActive: typeof isActive === 'string' ? isActive === 'true' : undefined,
      
      // Búsqueda en múltiples campos
      ...(search && {
        OR: [
          { cedula: { contains: search as string, mode: 'insensitive' } },
          { telefono: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { domicilio: { contains: search as string, mode: 'insensitive' } },
          { matriculasVehiculo: { hasSome: [search as string] } }
        ]
      }),

      // Filtro por rango de fechas
      ...(startDate && {
        createdAt: {
          gte: new Date(startDate as string)
        }
      }),
      ...(endDate && {
        createdAt: {
          lte: new Date(endDate as string)
        }
      }),

      // Filtro por documentos
      ...(hasDocuments !== undefined && {
        documentos: {
          some: hasDocuments === 'true' ? {} : undefined,
          none: hasDocuments === 'false' ? {} : undefined
        }
      })
    };

    console.log('Consulta construida:', { where });

    // Si no es admin, solo mostrar las personas que creó o tiene permiso para ver
    if (req.user!.rol !== 'ADMIN') {
      where.OR = [
        { createdBy: userId },
        {
          permissions: {
            some: {
              userId,
              canView: true
            }
          }
        }
      ];
    }

    // Validar y construir el ordenamiento
    const allowedSortFields = ['createdAt', 'cedula', 'telefono', 'email'] as const;
    type SortField = typeof allowedSortFields[number];
    const sortByField = allowedSortFields.includes(sortBy as any) ? sortBy as SortField : 'createdAt';
    
    const orderBy: Prisma.PersonaOrderByWithRelationInput = {
      [sortByField]: sortOrder === 'asc' ? 'asc' : 'desc'
    };

    console.log('Ejecutando consulta a la base de datos...');

    const [personas, total] = await Promise.all([
      prisma.persona.findMany({
        where,
        include: {
          canton: true,
          documentos: {
            where: { isActive: true },
            select: {
              id: true,
              tipo: true,
              filename: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              documentos: true
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy
      }),
      prisma.persona.count({ where })
    ]);

    console.log('Resultados obtenidos:', {
      totalPersonas: personas.length,
      totalRegistros: total
    });

    // Agregar estadísticas adicionales
    const stats = {
      totalDocumentos: personas.reduce((sum, p) => sum + p._count.documentos, 0),
      promedioDocumentosPorPersona: personas.length > 0 
        ? personas.reduce((sum, p) => sum + p._count.documentos, 0) / personas.length 
        : 0
    };

    res.json({
      status: 'success',
      data: {
        personas: personas.map(({ _count, ...persona }) => persona),
        stats,
        pagination: {
          total,
          pages: Math.ceil(total / Number(limit)),
          page: Number(page),
          limit: Number(limit),
          hasMore: skip + personas.length < total
        }
      }
    });
  } catch (error) {
    console.error('Error en getPersonas:', error);
    next(error);
  }
};

// Obtener persona por ID
export const getPersonaById = async (
  req: RequestWithUser & { params: { id: string } },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const persona = await prisma.persona.findUnique({
      where: { id: Number(id) },
      include: {
        documentos: true,
        canton: true
      }
    });

    if (!persona) {
      throw new CustomError({
        code: ApiErrorCode.NOT_FOUND,
        message: 'Persona no encontrada',
        status: 404,
        details: { id }
      });
    }

    res.json({
      status: 'success',
      data: persona
    });
  } catch (error) {
    next(error);
  }
};

// Crear documento
export const createDocumento = async (
  req: RequestWithUser & { body: CreateDocumentoDTO },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tipo, file, personaId } = req.body;

    // Verificar que la persona existe
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

    const documento = await prisma.documento.create({
      data: {
        tipo,
        url: `/uploads/documentos/${file.filename}`,
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        personaId,
        createdBy: req.user!.id,
        updatedBy: req.user!.id
      }
    });

    await logActivity(req.user!.id, 'CREATE_DOCUMENTO', {
      category: ActivityCategory.DOCUMENTO,
      targetId: documento.id,
      details: {
        description: 'Documento creado exitosamente',
        metadata: {
          documentoTipo: documento.tipo,
          documentoNombre: documento.filename,
          personaId: documento.personaId
        }
      }
    });

    res.status(201).json({
      status: 'success',
      data: documento
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar documento
export const updateDocumento = async (
  req: RequestWithUser & { params: { id: string }; body: UpdateDocumentoDTO },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const documento = await prisma.documento.update({
      where: { id: Number(id) },
      data: {
        ...updateData,
        updatedBy: req.user!.id
      }
    });

    await logActivity(req.user!.id, 'UPDATE_DOCUMENTO', {
      category: ActivityCategory.DOCUMENTO,
      targetId: documento.id,
      details: {
        description: 'Documento actualizado exitosamente',
        metadata: {
          documentoTipo: documento.tipo,
          updatedFields: Object.keys(updateData)
        }
      }
    });

    res.json({
      status: 'success',
      data: documento
    });
  } catch (error) {
    next(error);
  }
};

// Obtener documentos con paginación y filtros
export const getDocumentos = async (
  _req: Request<{}, {}, {}, DocumentoFilters>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tipo, personaId, isActive, page = 1, limit = 10 } = _req.query;

    const where = {
      ...(tipo && { tipo }),
      ...(personaId && { personaId: Number(personaId) }),
      ...(isActive !== undefined && { isActive })
    };

    const [documentos, total] = await Promise.all([
      prisma.documento.findMany({
        where,
        include: {
          persona: true
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.documento.count({ where })
    ]);

    const totalPages = Math.ceil(total / Number(limit));
    const hasMore = Number(page) < totalPages;

    res.json({
      status: 'success',
      data: {
        documentos,
        total,
        page: Number(page),
        totalPages,
        hasMore
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener documento por ID
export const getDocumentoById = async (
  _req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = _req.params;

    const documento = await prisma.documento.findUnique({
      where: { id: Number(id) },
      include: {
        persona: true
      }
    });

    if (!documento) {
      throw new CustomError({
        code: ApiErrorCode.NOT_FOUND,
        message: 'Documento no encontrado',
        status: 404,
        details: { id }
      });
    }

    res.json({
      status: 'success',
      data: documento
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar persona
export const deletePersona = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Verificar que la persona existe
    const persona = await prisma.persona.findUnique({
      where: { id: Number(id) },
      include: {
        documentos: true
      }
    });

    if (!persona) {
      throw new CustomError({
        code: ApiErrorCode.NOT_FOUND,
        message: 'Persona no encontrada',
        status: 404,
        details: { id }
      });
    }

    // Eliminar documentos asociados primero
    if (persona.documentos.length > 0) {
      await prisma.documento.deleteMany({
        where: { personaId: Number(id) }
      });
    }

    // Eliminar la persona
    await prisma.persona.delete({
      where: { id: Number(id) }
    });

    // Registrar la actividad
    await logActivity(req.user!.id, 'DELETE_PERSONA', {
      category: ActivityCategory.PERSONA,
      targetId: Number(id),
      details: {
        description: 'Persona eliminada exitosamente',
        metadata: {
          personaId: id,
          cedula: persona.cedula,
          documentosEliminados: persona.documentos.length
        }
      }
    });

    res.json({
      status: 'success',
      message: 'Persona eliminada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// Agregar documento a persona
export const addDocumentoToPersona = async (
  req: RequestWithUser & { params: { id: string }; file?: Express.Multer.File },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { tipo } = req.body;

    if (!req.file) {
      throw new CustomError({
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'No se ha proporcionado ningún archivo',
        status: 400
      });
    }

    const tipoDocumento = DocumentoService.validateDocumentoType(tipo);

    const documento = await DocumentoService.saveDocumento(
      req.file,
      parseInt(id),
      tipoDocumento,
      req.user!.id
    );

    await logActivity(req.user!.id, 'ADD_DOCUMENTO', {
      category: ActivityCategory.DOCUMENTO,
      targetId: documento.id,
      details: {
        description: 'Documento agregado exitosamente',
        metadata: {
          personaId: id,
          documentoTipo: tipo,
          documentoNombre: req.file.originalname
        }
      }
    });

    res.status(201).json({
      status: 'success',
      data: documento
    });
  } catch (error) {
    next(error);
  }
};

// Obtener documentos de una persona
export const getDocumentosByPersona = async (
  req: RequestWithUser & { params: { id: string } },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const documentos = await DocumentoService.getDocumentosByPersona(parseInt(id));

    res.json({
      status: 'success',
      data: documentos
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar documento de una persona
export const deleteDocumentoFromPersona = async (
  req: RequestWithUser & { params: { id: string; documentoId: string } },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { documentoId } = req.params;

    await DocumentoService.deleteDocumento(parseInt(documentoId), req.user!.id);

    await logActivity(req.user!.id, 'DELETE_DOCUMENTO', {
      category: ActivityCategory.DOCUMENTO,
      targetId: parseInt(documentoId),
      details: {
        description: 'Documento eliminado exitosamente',
        metadata: {
          documentoId
        }
      }
    });

    res.json({
      status: 'success',
      message: 'Documento eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// Obtener estadísticas de personas
export const getPersonaStats = async (
  _req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await prisma.$transaction([
      // Total de personas
      prisma.persona.count({
        where: { isActive: true }
      }),
      // Total de documentos
      prisma.documento.count({
        where: { isActive: true }
      }),
      // Personas por cantón
      prisma.canton.findMany({
        select: {
          id: true,
          nombre: true,
          _count: {
            select: {
              personas: {
                where: { isActive: true }
              }
            }
          }
        }
      })
    ]);

    const [totalPersonas, totalDocumentos, personasPorCanton] = stats;

    res.json({
      status: 'success',
      data: {
        totalPersonas,
        totalDocumentos,
        personasPorCanton: personasPorCanton.map(canton => ({
          cantonId: canton.id,
          cantonNombre: canton.nombre,
          totalPersonas: canton._count.personas
        }))
      }
    });
  } catch (error) {
    next(error);
  }
}; 
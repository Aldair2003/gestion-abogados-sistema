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
import { AuthenticatedRequest } from '../types/common';
import { Prisma } from '.prisma/client';
import { CustomError } from '../utils/customError';
import { ApiErrorCode } from '../types/apiError';
import { DocumentoService } from '../services/documentoService';

// Crear persona
export const createPersona = async (
  req: AuthenticatedRequest & { body: CreatePersonaDTO },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('=== Inicio createPersona ===');
    const { cedula, nombres, apellidos, telefono, contactoRef, email, domicilio, matriculasVehiculo } = req.body;
    const cantonId = Number(req.params.cantonId);
    const userId = req.user!.id;
    const userRole = req.user!.rol;
    
    console.log(`Creando persona en cantón ${cantonId}`);
    console.log(`Usuario: ${userId}, Rol: ${userRole}`);
    console.log('Datos de la persona:', { cedula, nombres, apellidos, telefono, email });

    // Validar que no exista la persona en el mismo cantón
    const existingPersona = await prisma.persona.findFirst({
      where: {
        cedula,
        cantonId
      }
    });

    if (existingPersona) {
      console.log(`Ya existe una persona con cédula ${cedula} en el cantón ${cantonId}`);
      throw new CustomError({
        code: ApiErrorCode.DUPLICATE_ENTRY,
        message: 'Ya existe una persona con esta cédula en este cantón',
        status: 400,
        details: { cedula, cantonId }
      });
    }

    // Crear la persona
    console.log('Creando registro de persona...');
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

    console.log(`Persona creada exitosamente: ID=${persona.id}`);

    // Asignar automáticamente permisos al creador si no es admin
    if (userRole !== 'ADMIN') {
      console.log(`Usuario ${userId} no es admin, verificando si necesita permisos automáticos...`);
      
      // Verificar si ya existe un permiso para esta persona
      const existingPermission = await prisma.personaPermission.findFirst({
        where: {
          userId,
          personaId: persona.id
        }
      });

      console.log(`¿Ya existe permiso para esta persona?`, existingPermission ? 'Sí' : 'No');

      // Si no existe, crear el permiso
      if (!existingPermission) {
        console.log(`Creando permisos automáticos para usuario ${userId} sobre persona ${persona.id}...`);
        
        const newPermission = await prisma.personaPermission.create({
          data: {
            userId,
            personaId: persona.id,
            cantonId: persona.cantonId,
            canView: true,
            canCreate: true,
            canEdit: true
          }
        });

        console.log(`Permisos asignados automáticamente: ID=${newPermission.id}`);
        console.log(`Usuario ${userId} ahora puede ver, crear y editar la persona ${persona.id}`);
      }
    } else {
      console.log(`Usuario ${userId} es admin, no necesita permisos adicionales`);
    }

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

    console.log('=== Fin createPersona ===');
    res.status(201).json({
      status: 'success',
      data: persona
    });
  } catch (error) {
    console.error('Error en createPersona:', error);
    next(error);
  }
};

// Actualizar persona
export const updatePersona = async (
  req: AuthenticatedRequest,
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

// Obtener personas con filtros y validación de permisos
export const getPersonas = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('=== Inicio getPersonas (backend) ===');
    const { cantonId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.rol;
    
    console.log(`Solicitud de personas para cantón ${cantonId}`);
    console.log(`Usuario: ${userId}, Rol: ${userRole}`);

    // Parámetros de paginación y ordenamiento
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
    const search = (req.query.search as string) || '';
    
    console.log('Parámetros de consulta:', { page, limit, sortBy, sortOrder, search });

    // Calcular offset para paginación
    const offset = (page - 1) * limit;

    // Construir condiciones de búsqueda
    const searchCondition = search
      ? {
          OR: [
            { cedula: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
            { nombres: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
            { apellidos: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
            { telefono: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
            { email: { contains: search, mode: 'insensitive' as Prisma.QueryMode } }
          ]
        }
      : {};

    // Verificar si el usuario es administrador
    const isAdmin = userRole === 'ADMIN';
    console.log(`¿Es administrador?: ${isAdmin}`);

    // Construir condiciones de filtrado
    let whereCondition: any = {
      cantonId: Number(cantonId),
      ...searchCondition
    };

    // Si no es administrador, verificar permisos
    if (!isAdmin) {
      console.log('Usuario no es administrador, verificando permisos...');
      
      // Verificar si tiene permiso en el cantón
      const cantonPermission = await prisma.cantonPermission.findFirst({
        where: {
          userId,
          cantonId: Number(cantonId)
        }
      });

      console.log('Permiso de cantón:', cantonPermission);

      if (!cantonPermission) {
        console.log('Usuario no tiene permiso en este cantón');
        throw new CustomError({
          code: ApiErrorCode.FORBIDDEN,
          message: 'No tiene permisos para ver personas en este cantón',
          status: 403
        });
      }

      // Obtener personas a las que tiene acceso específico
      const personaPermissions = await prisma.personaPermission.findMany({
        where: {
          userId,
          cantonId: Number(cantonId),
          canView: true
        },
        select: {
          personaId: true
        }
      });

      console.log(`Permisos de personas encontrados: ${personaPermissions.length}`);

      // Obtener personas creadas por el usuario
      const personasCreadas = await prisma.persona.findMany({
        where: {
          createdBy: userId,
          cantonId: Number(cantonId)
        },
        select: {
          id: true
        }
      });

      console.log(`Personas creadas por el usuario: ${personasCreadas.length}`);

      // Combinar IDs de personas con permiso y creadas por el usuario
      const personaIds = [
        ...personaPermissions.map(p => p.personaId),
        ...personasCreadas.map(p => p.id)
      ];

      console.log(`Total de IDs de personas con acceso: ${personaIds.length}`);
      console.log('IDs de personas con acceso:', personaIds);

      // Si no tiene permisos específicos, no mostrar ninguna persona
      if (personaIds.length === 0) {
        console.log('Usuario no tiene permisos específicos para ninguna persona');
        res.json({
          status: 'success',
          data: {
            personas: [],
            stats: {
              totalDocumentos: 0,
              promedioDocumentosPorPersona: 0
            },
            pagination: {
              total: 0,
              pages: 0,
              page,
              limit,
              hasMore: false
            }
          }
        });
        return;
      }

      // Filtrar por personas con permiso
      whereCondition = {
        ...whereCondition,
        id: { in: personaIds }
      };
    } else {
      console.log('Usuario es administrador, mostrando todas las personas del cantón sin restricciones');
    }

    console.log('Condición de búsqueda final:', JSON.stringify(whereCondition, null, 2));

    // Obtener total de personas que coinciden con la búsqueda
    const totalPersonas = await prisma.persona.count({
      where: whereCondition
    });

    console.log(`Total de personas encontradas: ${totalPersonas}`);

    // Obtener personas con paginación
    const personas = await prisma.persona.findMany({
      where: whereCondition,
      include: {
        canton: {
          select: {
            id: true,
            nombre: true,
            codigo: true
          }
        },
        documentos: {
          select: {
            id: true,
            tipo: true,
            url: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: offset,
      take: limit
    });

    console.log(`Personas recuperadas: ${personas.length}`);
    if (personas.length > 0) {
      console.log('IDs de personas recuperadas:', personas.map(p => p.id));
    }

    // Calcular estadísticas de documentos
    const totalDocumentos = personas.reduce((sum, persona) => sum + persona.documentos.length, 0);
    const promedioDocumentosPorPersona = personas.length > 0 ? totalDocumentos / personas.length : 0;

    console.log(`Estadísticas - Total documentos: ${totalDocumentos}, Promedio: ${promedioDocumentosPorPersona}`);

    // Calcular información de paginación
    const totalPages = Math.ceil(totalPersonas / limit);
    const hasMore = page < totalPages;

    console.log(`Paginación - Total páginas: ${totalPages}, Página actual: ${page}, ¿Hay más?: ${hasMore}`);

    // Enviar respuesta
    res.json({
      status: 'success',
      data: {
        personas,
        stats: {
          totalDocumentos,
          promedioDocumentosPorPersona
        },
        pagination: {
          total: totalPersonas,
          pages: totalPages,
          page,
          limit,
          hasMore
        }
      }
    });
    
    console.log('=== Fin getPersonas (backend) ===');
  } catch (error) {
    console.error('Error en getPersonas:', error);
    next(error);
  }
};

// Obtener persona por ID
export const getPersonaById = async (
  req: AuthenticatedRequest & { params: { id: string } },
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
  req: AuthenticatedRequest & { body: CreateDocumentoDTO },
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
  req: AuthenticatedRequest & { params: { id: string }; body: UpdateDocumentoDTO },
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
  req: AuthenticatedRequest,
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
  req: AuthenticatedRequest & { params: { id: string }; file?: Express.Multer.File },
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
  req: AuthenticatedRequest & { params: { id: string } },
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

// Eliminar documento
export const deleteDocumentoFromPersona = async (
  req: AuthenticatedRequest & { params: { id: string; documentoId: string } },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, documentoId } = req.params;
    
    console.log('Parámetros recibidos:', {
      id,
      documentoId,
      userId: req.user?.id
    });

    // Convertir IDs a números y validar
    const personaIdNum = parseInt(id, 10);
    const documentoIdNum = parseInt(documentoId, 10);

    if (isNaN(personaIdNum) || isNaN(documentoIdNum)) {
      throw new CustomError({
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'IDs inválidos',
        status: 400,
        details: { personaId: id, documentoId }
      });
    }

    console.log('IDs convertidos:', {
      personaIdNum,
      documentoIdNum
    });

    await DocumentoService.eliminarDocumento(
      documentoIdNum,
      personaIdNum,
      req.user!.id
    );

    // Registrar la actividad
    await logActivity(req.user!.id, 'DELETE_DOCUMENTO', {
      category: ActivityCategory.DOCUMENTO,
      targetId: documentoIdNum,
      details: {
        description: 'Documento eliminado exitosamente',
        metadata: {
          documentoId: documentoIdNum,
          personaId: personaIdNum
        }
      }
    });

    res.json({
      status: 'success',
      message: 'Documento eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteDocumentoFromPersona:', {
      error,
      params: req.params,
      stack: error instanceof Error ? error.stack : undefined
    });
    next(error);
  }
};

// Obtener estadísticas de personas
export const getPersonaStats = async (
  _req: AuthenticatedRequest,
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

// Obtener personas creadas por un usuario
export const getPersonasCreatedByUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = Number(req.params.userId) || req.user.id;
    const cantonId = Number(req.params.cantonId);

    // Verificar acceso al cantón si no es admin
    if (req.user.rol !== 'ADMIN' && req.user.id !== userId) {
      const cantonPermission = await prisma.cantonPermission.findFirst({
        where: {
          userId: req.user.id,
          cantonId
        }
      });

      if (!cantonPermission) {
        res.status(403).json({
          status: 'error',
          message: 'No tiene acceso a este cantón'
        });
        return;
      }
    }

    const personas = await prisma.persona.findMany({
      where: {
        createdBy: userId,
        cantonId
      },
      include: {
        canton: true
      }
    });

    res.json({
      status: 'success',
      data: {
        personas
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener estadísticas de permisos
export const getPermissionStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = Number(req.params.userId) || req.user.id;

    // Solo admins pueden ver estadísticas de otros usuarios
    if (req.user.rol !== 'ADMIN' && req.user.id !== userId) {
      res.status(403).json({
        status: 'error',
        message: 'No tiene permiso para ver estas estadísticas'
      });
      return;
    }

    // Obtener estadísticas
    const stats = await prisma.$transaction([
      // Total de personas creadas
      prisma.persona.count({
        where: { createdBy: userId }
      }),
      // Total de personas con permiso de ver
      prisma.personaPermission.count({
        where: {
          userId,
          canView: true
        }
      }),
      // Total de personas con permiso de editar
      prisma.personaPermission.count({
        where: {
          userId,
          canEdit: true
        }
      }),
      // Cantones con permisos
      prisma.cantonPermission.findMany({
        where: { userId },
        include: {
          canton: {
            select: {
              id: true,
              nombre: true
            }
          }
        }
      })
    ]);

    const [
      totalCreated,
      totalCanView,
      totalCanEdit,
      cantonPermissions
    ] = stats;

    // Obtener el conteo de permisos por cantón
    const cantonStats = await Promise.all(
      cantonPermissions.map(async (cp) => {
        const totalPermisos = await prisma.personaPermission.count({
          where: {
            userId,
            persona: {
              cantonId: cp.cantonId
            }
          }
        });

        return {
          canton: cp.canton.nombre,
          totalPersonasWithPermissions: totalPermisos
        };
      })
    );

    res.json({
      status: 'success',
      data: {
        totalCreated,
        totalCanView,
        totalCanEdit,
        cantonStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener todas las personas (para administradores)
export const getAllPersonas = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Verificar si el usuario es administrador
    if (req.user.rol !== 'ADMIN') {
      res.status(403).json({
        status: 'error',
        message: 'No tiene permisos para ver todas las personas'
      });
      return;
    }

    const personas = await prisma.persona.findMany({
      include: {
        canton: {
          select: {
            id: true,
            nombre: true,
            codigo: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      status: 'success',
      data: {
        personas
      }
    });
  } catch (error) {
    next(error);
  }
}; 
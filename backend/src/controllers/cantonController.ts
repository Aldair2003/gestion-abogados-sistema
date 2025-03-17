import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { logActivity } from '../services/logService';
import { ActivityCategory } from '../types/prisma';
import { Prisma } from '.prisma/client';
import { 
  CreateCantonDTO, 
  UpdateCantonDTO,
  CreateJuezDTO,
  UpdateJuezDTO
} from '../types/canton';
import { AuthenticatedRequest } from '../types/common';
import { ApiErrorCode } from '../types/apiError';
import { CustomError } from '../utils/customError';
import { CantonImageService } from '../services/cantonImageService';

// Crear cantón
export const createCanton = async (
  req: AuthenticatedRequest & { body: CreateCantonDTO; file?: Express.Multer.File },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { nombre, codigo } = req.body;

    if (!nombre || !codigo) {
      throw new CustomError({
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'Nombre y código son requeridos',
        status: 400,
        details: {
          nombre: !nombre ? 'El nombre es requerido' : undefined,
          codigo: !codigo ? 'El código es requerido' : undefined
        }
      });
    }

    // Verificar si ya existe un cantón con el mismo código
    const existingCanton = await prisma.canton.findUnique({
      where: { codigo }
    });

    if (existingCanton) {
      throw new CustomError({
        code: ApiErrorCode.DUPLICATE_ENTRY,
        message: 'Ya existe un cantón con este código',
        status: 400,
        details: { codigo }
      });
    }

    // Procesar imagen si se proporcionó una
    let imagenUrl = null;
    let canton;
    
    if (req.file) {
      canton = await prisma.canton.create({
        data: {
          nombre,
          codigo,
          imagenUrl: null, // Temporalmente null
          createdBy: req.user!.id,
          updatedBy: req.user!.id
        }
      });

      const updatedCanton = await CantonImageService.uploadImage(canton.id, req.file, req.user!.id);
      canton = updatedCanton;
    } else {
      canton = await prisma.canton.create({
        data: {
          nombre,
          codigo,
          imagenUrl,
          createdBy: req.user!.id,
          updatedBy: req.user!.id
        }
      });
    }

    await logActivity(req.user!.id, 'CREATE_CANTON', {
      category: ActivityCategory.CANTON,
      targetId: canton.id,
      details: {
        description: 'Cantón creado exitosamente',
        metadata: {
          cantonNombre: canton.nombre,
          cantonCodigo: canton.codigo,
          imagenUrl
        }
      }
    });

    res.status(201).json({
      status: 'success',
      data: canton
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar cantón
export const updateCanton = async (
  req: AuthenticatedRequest & { params: { id: string }; body: UpdateCantonDTO; file?: Express.Multer.File },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Validar que el cantón existe
    const existingCanton = await prisma.canton.findUnique({
      where: { id: Number(id) }
    });

    if (!existingCanton) {
      throw new CustomError({
        code: ApiErrorCode.NOT_FOUND,
        message: 'Cantón no encontrado',
        status: 404,
        details: { id }
      });
    }

    // Si se está actualizando el código, verificar que no exista otro cantón con ese código
    if (updateData.codigo) {
      const cantonWithCode = await prisma.canton.findFirst({
        where: {
          codigo: updateData.codigo,
          id: { not: Number(id) }
        }
      });

      if (cantonWithCode) {
        throw new CustomError({
          code: ApiErrorCode.DUPLICATE_ENTRY,
          message: 'Ya existe otro cantón con este código',
          status: 400,
          details: { codigo: updateData.codigo }
        });
      }
    }

    // Procesar nueva imagen si se proporcionó una
    if (req.file) {
      const updatedCanton = await CantonImageService.uploadImage(Number(id), req.file, req.user!.id);
      updateData.imagenUrl = updatedCanton.imagenUrl;
    }

    const canton = await prisma.canton.update({
      where: { id: Number(id) },
      data: {
        ...updateData,
        updatedBy: req.user!.id
      }
    });

    await logActivity(req.user!.id, 'UPDATE_CANTON', {
      category: ActivityCategory.CANTON,
      targetId: canton.id,
      details: {
        description: 'Cantón actualizado exitosamente',
        metadata: {
          cantonNombre: canton.nombre,
          cantonCodigo: canton.codigo,
          updatedFields: Object.keys(updateData),
          newImageUrl: updateData.imagenUrl
        }
      }
    });

    res.json({
      status: 'success',
      data: canton
    });
  } catch (error) {
    next(error);
  }
};

// Obtener cantones con paginación y filtros
export const getCantones = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, isActive, page = 1, limit = 10, sortBy = 'nombre', sortOrder = 'asc' } = req.query;

    // Validar parámetros de paginación
    if (Number(page) < 1 || Number(limit) < 1) {
      throw new CustomError({
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'Parámetros de paginación inválidos',
        status: 400,
        details: {
          page: Number(page) < 1 ? 'La página debe ser mayor a 0' : undefined,
          limit: Number(limit) < 1 ? 'El límite debe ser mayor a 0' : undefined
        }
      });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const where: Prisma.CantonWhereInput = {
      isActive: typeof isActive === 'string' ? isActive === 'true' : undefined,
      ...(search && {
        OR: [
          {
            nombre: {
              contains: search as string,
              mode: 'insensitive',
            },
          },
          {
            codigo: {
              contains: search as string,
              mode: 'insensitive',
            },
          },
        ],
      }),
    };

    const [cantones, total] = await Promise.all([
      prisma.canton.findMany({
        where,
        select: {
          id: true,
          nombre: true,
          codigo: true,
          imagenUrl: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          jueces: {
            include: {
              juez: true,
            },
          },
          personas: {
            where: { isActive: true },
            select: {
              id: true,
              documentos: {
                where: { isActive: true },
                select: {
                  id: true
                }
              }
            }
          },
          _count: {
            select: {
              personas: {
                where: { isActive: true }
              }
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { [sortBy as string]: sortOrder },
      }),
      prisma.canton.count({ where }),
    ]);

    console.log('Cantones antes de procesar:', cantones); // Debug log

    // Mapear los cantones para incluir el total de personas y documentos
    const cantonesConTotales = cantones.map(canton => {
      // Calcular total de documentos
      const totalDocs = canton.personas?.reduce((sum, persona) => {
        return sum + (persona.documentos?.length || 0);
      }, 0) || 0;

      console.log('Canton:', canton.nombre);
      console.log('Personas:', canton.personas?.length);
      console.log('Total documentos calculado:', totalDocs);
      
      return {
        ...canton,
        totalPersonas: canton._count.personas,
        totalDocumentos: totalDocs,
        personas: undefined // Removemos los datos de personas ya que solo necesitábamos el conteo
      };
    });

    console.log('Cantones procesados:', cantonesConTotales); // Debug log

    const totalPages = Math.ceil(total / Number(limit));
    const hasMore = Number(page) < totalPages;

    res.json({
      status: 'success',
      data: {
        cantones: cantonesConTotales,
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

// Obtener cantón por ID
export const getCantonById = async (
  req: AuthenticatedRequest & { params: { id: string } },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const canton = await prisma.canton.findUnique({
      where: { id: Number(id) },
      include: {
        jueces: {
          include: {
            juez: true
          }
        }
      }
    });

    if (!canton) {
      throw new CustomError({
        code: ApiErrorCode.NOT_FOUND,
        message: 'Cantón no encontrado',
        status: 404,
        details: { id }
      });
    }

    res.json({
      status: 'success',
      data: canton
    });
  } catch (error) {
    next(error);
  }
};

// Crear juez
export const createJuez = async (
  req: AuthenticatedRequest & { body: CreateJuezDTO },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { nombre, secretario, cantones } = req.body;

    if (!nombre || !cantones?.length) {
      throw new CustomError({
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'Datos de juez inválidos',
        status: 400,
        details: {
          nombre: !nombre ? 'El nombre es requerido' : undefined,
          cantones: !cantones?.length ? 'Debe asignar al menos un cantón' : undefined
        }
      });
    }

    // Verificar que los cantones existen
    const existingCantones = await prisma.canton.findMany({
      where: {
        id: {
          in: cantones
        }
      }
    });

    if (existingCantones.length !== cantones.length) {
      const missingCantones = cantones.filter(
        (id: number) => !existingCantones.find(canton => canton.id === id)
      );
      throw new CustomError({
        code: ApiErrorCode.NOT_FOUND,
        message: 'Algunos cantones no existen',
        status: 404,
        details: { cantones: missingCantones }
      });
    }

    const juez = await prisma.juez.create({
      data: {
        nombre,
        secretario,
        createdBy: req.user!.id,
        updatedBy: req.user!.id,
        cantones: {
          create: cantones.map((cantonId: number) => ({
            canton: { connect: { id: cantonId } }
          }))
        }
      },
      include: {
        cantones: {
          include: {
            canton: true
          }
        }
      }
    });

    await logActivity(req.user!.id, 'CREATE_JUEZ', {
      category: ActivityCategory.JUEZ,
      targetId: juez.id,
      details: {
        description: 'Juez creado exitosamente',
        metadata: {
          juezNombre: juez.nombre,
          cantones: juez.cantones.map(c => c.canton.nombre)
        }
      }
    });

    res.status(201).json({
      status: 'success',
      data: juez
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar juez
export const updateJuez = async (
  req: AuthenticatedRequest & { params: { id: string }; body: UpdateJuezDTO },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { nombre, secretario, cantones, isActive } = req.body;

    // Validar que el juez existe
    const existingJuez = await prisma.juez.findUnique({
      where: { id: Number(id) },
      include: {
        cantones: true
      }
    });

    if (!existingJuez) {
      throw new CustomError({
        code: ApiErrorCode.NOT_FOUND,
        message: 'Juez no encontrado',
        status: 404,
        details: { id }
      });
    }

    // Preparar datos de actualización
    const updateData: any = {
      updatedBy: req.user!.id
    };

    if (nombre !== undefined) updateData.nombre = nombre;
    if (secretario !== undefined) updateData.secretario = secretario;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Actualizar juez
    const updatedJuez = await prisma.juez.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        cantones: {
          include: {
            canton: true
          }
        }
      }
    });

    await logActivity(req.user!.id, 'UPDATE_JUEZ', {
      category: ActivityCategory.JUEZ,
      targetId: updatedJuez.id,
      details: {
        description: 'Juez actualizado exitosamente',
        metadata: {
          juezNombre: updatedJuez.nombre,
          cantones: updatedJuez.cantones.map(c => c.canton.nombre)
        }
      }
    });

    res.json({
      status: 'success',
      data: updatedJuez
    });
  } catch (error) {
    next(error);
  }
};

// Obtener jueces con paginación y filtros
export const getJueces = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, isActive, cantonId, page = 1, limit = 10 } = req.query;

    // Validar parámetros de paginación
    if (Number(page) < 1 || Number(limit) < 1) {
      throw new CustomError({
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'Parámetros de paginación inválidos',
        status: 400,
        details: {
          page: Number(page) < 1 ? 'La página debe ser mayor a 0' : undefined,
          limit: Number(limit) < 1 ? 'El límite debe ser mayor a 0' : undefined
        }
      });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const where: Prisma.JuezWhereInput = {
      isActive: typeof isActive === 'string' ? isActive === 'true' : undefined,
      ...(cantonId && {
        cantones: {
          some: {
            cantonId: Number(cantonId),
          },
        },
      }),
      ...(search && {
        nombre: {
          contains: search as string,
          mode: 'insensitive',
        },
      }),
    };

    const [jueces, total] = await Promise.all([
      prisma.juez.findMany({
        where,
        include: {
          cantones: {
            include: {
              canton: true
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { nombre: 'asc' }
      }),
      prisma.juez.count({ where })
    ]);

    const totalPages = Math.ceil(total / Number(limit));
    const hasMore = Number(page) < totalPages;

    res.json({
      status: 'success',
      data: {
        jueces,
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

// Obtener juez por ID
export const getJuezById = async (
  req: AuthenticatedRequest & { params: { id: string } },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const juez = await prisma.juez.findUnique({
      where: { id: Number(id) },
      include: {
        cantones: {
          include: {
            canton: true
          }
        }
      }
    });

    if (!juez) {
      throw new CustomError({
        code: ApiErrorCode.NOT_FOUND,
        message: 'Juez no encontrado',
        status: 404,
        details: { id }
      });
    }

    await logActivity(req.user!.id, 'GET_JUEZ', {
      category: ActivityCategory.JUEZ,
      targetId: Number(id),
      details: {
        description: 'Consulta de información de juez',
        metadata: {
          juezId: id,
          juezNombre: juez.nombre
        }
      }
    });

    res.json({
      status: 'success',
      data: juez
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar cantón
export const deleteCanton = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Verificar que el cantón existe y obtener toda la información relacionada
    const canton = await prisma.canton.findUnique({
      where: { id: Number(id) },
      include: {
        jueces: {
          include: {
            juez: true
          }
        },
        personas: {
          include: {
            documentos: true
          }
        }
      }
    });

    if (!canton) {
      throw new CustomError({
        code: ApiErrorCode.NOT_FOUND,
        message: 'Cantón no encontrado',
        status: 404,
        details: { id }
      });
    }

    // Preparar información detallada
    const cantonesPorJuez = canton.jueces.map(jc => ({
      juezId: jc.juez.id,
      juezNombre: jc.juez.nombre
    }));

    const totalJueces = canton.jueces.length;
    const totalPersonas = canton.personas.length;
    const totalDocumentos = canton.personas.reduce(
      (sum, persona) => sum + persona.documentos.length,
      0
    );

    // Eliminar en cascada usando una transacción
    await prisma.$transaction(async (prisma) => {
      // 1. Eliminar documentos de todas las personas del cantón
      await prisma.documento.deleteMany({
        where: {
          persona: {
            cantonId: Number(id)
          }
        }
      });

      // 2. Eliminar todas las personas del cantón
      await prisma.persona.deleteMany({
        where: {
          cantonId: Number(id)
        }
      });

      // 3. Eliminar relaciones con jueces
      await prisma.juezCanton.deleteMany({
        where: {
          cantonId: Number(id)
        }
      });

      // 4. Eliminar permisos del cantón
      await prisma.cantonPermission.deleteMany({
        where: {
          cantonId: Number(id)
        }
      });

      // 5. Eliminar el cantón
      await prisma.canton.delete({
        where: {
          id: Number(id)
        }
      });
    });

    // Registrar la actividad con información detallada
    await logActivity(req.user!.id, 'DELETE_CANTON', {
      category: ActivityCategory.CANTON,
      targetId: Number(id),
      details: {
        description: 'Cantón eliminado exitosamente',
        metadata: {
          cantonId: id,
          cantonNombre: canton.nombre,
          cantonCodigo: canton.codigo,
          estadisticas: {
            totalJueces,
            totalPersonas,
            totalDocumentos
          },
          juecesAfectados: cantonesPorJuez
        }
      }
    });

    res.json({
      status: 'success',
      message: 'Cantón eliminado exitosamente',
      details: {
        totalJueces,
        totalPersonas,
        totalDocumentos,
        juecesAfectados: cantonesPorJuez
      }
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar juez
export const deleteJuez = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Verificar que el juez existe
    const juez = await prisma.juez.findUnique({
      where: { id: Number(id) },
      include: {
        cantones: {
          include: {
            canton: true
          }
        }
      }
    });

    if (!juez) {
      throw new CustomError({
        code: ApiErrorCode.NOT_FOUND,
        message: 'Juez no encontrado',
        status: 404,
        details: { id }
      });
    }

    // Eliminar las relaciones con cantones primero
    await prisma.juezCanton.deleteMany({
      where: { juezId: Number(id) }
    });

    // Eliminar el juez
    await prisma.juez.delete({
      where: { id: Number(id) }
    });

    // Registrar la actividad
    await logActivity(req.user!.id, 'DELETE_JUEZ', {
      category: ActivityCategory.CANTON,
      targetId: Number(id),
      details: {
        description: 'Juez eliminado exitosamente',
        metadata: {
          juezId: id,
          juezNombre: juez.nombre,
          cantones: juez.cantones.map(jc => ({
            id: jc.canton.id,
            nombre: jc.canton.nombre
          }))
        }
      }
    });

    res.json({
      status: 'success',
      message: 'Juez eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// Obtener jueces de un cantón específico
export const getJuecesByCanton = async (
  req: AuthenticatedRequest & { params: { id: string } },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Primero obtenemos los jueces del cantón específico
    const juecesDelCanton = await prisma.juezCanton.findMany({
      where: { cantonId: Number(id) },
      include: {
        juez: {
          include: {
            cantones: {
              include: {
                canton: true
              }
            }
          }
        }
      }
    });

    if (!juecesDelCanton) {
      throw new CustomError({
        code: ApiErrorCode.NOT_FOUND,
        message: 'No se encontraron jueces para este cantón',
        status: 404,
        details: { id }
      });
    }

    // Transformamos los datos para incluir todos los cantones de cada juez
    const jueces = juecesDelCanton.map(jc => ({
      id: jc.juez.id,
      nombre: jc.juez.nombre,
      secretario: jc.juez.secretario,
      isActive: jc.juez.isActive,
      createdAt: jc.createdAt,
      cantones: jc.juez.cantones
    }));

    res.json({
      status: 'success',
      data: jueces
    });
  } catch (error) {
    next(error);
  }
};

// Agregar un juez a un cantón
export const createJuezInCanton = async (
  req: AuthenticatedRequest & { params: { id: string }; body: { nombre: string; secretario?: string; cantones: number[] } },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { nombre, secretario, cantones = [] } = req.body;

    if (!nombre) {
      throw new CustomError({
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'El nombre del juez es requerido',
        status: 400
      });
    }

    // Asegurarse de que el cantón actual esté incluido en el array de cantones y que todos sean números
    const cantonesIds = Array.from(new Set([
      Number(id), 
      ...(cantones || []).map(Number)
    ])).filter(id => !isNaN(id));

    // Verificar que todos los cantones existen
    const existingCantones = await prisma.canton.findMany({
      where: {
        id: {
          in: cantonesIds
        }
      }
    });

    if (existingCantones.length !== cantonesIds.length) {
      const missingCantones = cantonesIds.filter(
        cantonId => !existingCantones.find(c => c.id === cantonId)
      );
      throw new CustomError({
        code: ApiErrorCode.NOT_FOUND,
        message: 'Algunos cantones no existen',
        status: 404,
        details: { cantones: missingCantones }
      });
    }

    // Crear el juez y asignarlo a los cantones
    const juez = await prisma.juez.create({
      data: {
        nombre,
        secretario,
        createdBy: req.user!.id,
        updatedBy: req.user!.id,
        cantones: {
          create: cantonesIds.map(cantonId => ({
            canton: { connect: { id: cantonId } }
          }))
        }
      },
      include: {
        cantones: {
          include: {
            canton: true
          }
        }
      }
    });

    await logActivity(req.user!.id, 'CREATE_JUEZ', {
      category: ActivityCategory.JUEZ,
      targetId: juez.id,
      details: {
        description: 'Juez creado y asignado a cantones exitosamente',
        metadata: {
          juezNombre: juez.nombre,
          cantones: juez.cantones.map(jc => ({
            id: jc.canton.id,
            nombre: jc.canton.nombre
          }))
        }
      }
    });

    res.status(201).json({
      status: 'success',
      data: juez
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar un juez de un cantón
export const deleteJuezFromCanton = async (
  req: AuthenticatedRequest & { params: { id: string; juezId: string } },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, juezId } = req.params;

    // Verificar que existe la relación
    const juezCanton = await prisma.juezCanton.findFirst({
      where: {
        juezId: Number(juezId),
        cantonId: Number(id)
      },
      include: {
        juez: true,
        canton: true
      }
    });

    if (!juezCanton) {
      throw new CustomError({
        code: ApiErrorCode.NOT_FOUND,
        message: 'El juez no está asignado a este cantón',
        status: 404,
        details: { cantonId: id, juezId }
      });
    }

    // Eliminar la relación
    await prisma.juezCanton.delete({
      where: {
        id: juezCanton.id
      }
    });

    // Verificar si el juez tiene más cantones asignados
    const otherAssignments = await prisma.juezCanton.count({
      where: {
        juezId: Number(juezId)
      }
    });

    // Si no tiene más cantones, eliminar el juez
    if (otherAssignments === 0) {
      await prisma.juez.delete({
        where: {
          id: Number(juezId)
        }
      });
    }

    await logActivity(req.user!.id, 'DELETE_JUEZ_FROM_CANTON', {
      category: ActivityCategory.JUEZ,
      targetId: Number(juezId),
      details: {
        description: 'Juez eliminado del cantón exitosamente',
        metadata: {
          juezNombre: juezCanton.juez.nombre,
          cantonId: id,
          cantonNombre: juezCanton.canton.nombre,
          juezEliminado: otherAssignments === 0
        }
      }
    });

    res.json({
      status: 'success',
      message: 'Juez eliminado del cantón exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// Obtener estadísticas de jueces por cantón
export const getJuecesStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await prisma.juezCanton.groupBy({
      by: ['cantonId'],
      _count: {
        juezId: true
      }
    });

    const formattedStats = stats.map(stat => ({
      cantonId: stat.cantonId,
      totalJueces: stat._count.juezId
    }));

    await logActivity(req.user!.id, 'GET_JUECES_STATS', {
      category: ActivityCategory.JUEZ,
      details: {
        description: 'Consulta de estadísticas de jueces por cantón',
        metadata: {
          totalCantones: stats.length,
          totalJueces: stats.reduce((acc, stat) => acc + stat._count.juezId, 0)
        }
      }
    });

    res.json({
      status: 'success',
      data: formattedStats
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createCanton,
  updateCanton,
  getCantones,
  getCantonById,
  deleteCanton,
  createJuez,
  updateJuez,
  getJueces,
  getJuezById,
  deleteJuez,
  getJuecesByCanton,
  createJuezInCanton,
  deleteJuezFromCanton,
  getJuecesStats
}; 
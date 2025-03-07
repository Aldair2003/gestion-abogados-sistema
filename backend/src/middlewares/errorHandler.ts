import { Request, Response, NextFunction } from 'express';
import { ApiResponse, ApiErrorCode } from '../types/api';
import { Prisma, ActivityCategory } from '@prisma/client';
import { logActivity } from '../services/logService';

// Tipos de error personalizados
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// Middleware de manejo de errores centralizado
export const errorHandler = async (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  console.error('Error:', error);

  let statusCode = 500;
  const response: ApiResponse = {
    status: 'error',
    message: 'Error interno del servidor'
  };

  // Manejar errores específicos
  if (error instanceof ValidationError) {
    statusCode = 400;
    response.message = error.message;
    response.error = {
      code: ApiErrorCode.VALIDATION_ERROR,
      details: error.message
    };
  } else if (error instanceof NotFoundError) {
    statusCode = 404;
    response.message = error.message;
    response.error = {
      code: ApiErrorCode.NOT_FOUND,
      details: error.message
    };
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Manejar errores específicos de Prisma
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        statusCode = 409;
        response.message = 'El registro ya existe';
        response.error = {
          code: 'DUPLICATE_ENTRY',
          details: `El campo ${error.meta?.target} debe ser único`
        };
        break;
      case 'P2025': // Record not found
        statusCode = 404;
        response.message = 'Registro no encontrado';
        response.error = {
          code: ApiErrorCode.NOT_FOUND,
          details: error.message
        };
        break;
      default:
        response.error = {
          code: `PRISMA_${error.code}`,
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        };
    }
  }

  // Registrar el error
  await logActivity(
    (req as any).user?.id || 0,
    'ERROR',
    {
      category: ActivityCategory.SYSTEM,
      details: {
        description: 'Error en la aplicación',
        metadata: {
          path: req.path,
          method: req.method,
          errorName: error.name,
          errorMessage: error.message,
          statusCode,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      }
    }
  );

  res.status(statusCode).json(response);
}; 
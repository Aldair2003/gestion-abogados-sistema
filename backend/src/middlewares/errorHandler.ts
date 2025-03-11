import { Request, Response, NextFunction } from 'express';
import { Prisma } from '.prisma/client';
import { ApiErrorCode, ApiResponse } from '../types/apiError';
import { CustomError } from '../utils/customError';
import { logActivity } from '../services/logService';
import { ActivityCategory } from '../types/prisma';

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

export const errorHandler = async (
  error: Error | CustomError | Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Error:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    userId: (req as any).user?.id
  });

  let response: ApiResponse = {
    status: 'error',
    error: {
      code: ApiErrorCode.INTERNAL_ERROR,
      message: 'Ha ocurrido un error interno',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
  };

  let statusCode = 500;

  // Manejar errores personalizados
  if (error instanceof CustomError) {
    response.error = {
      code: error.code,
      message: error.message,
      details: error.details
    };
    statusCode = error.status;
  }
  // Manejar errores de Prisma
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        response.error = {
          code: ApiErrorCode.DUPLICATE_ENTRY,
          message: 'Ya existe un registro con estos datos',
          details: {
            fields: (error.meta as any)?.target
          }
        };
        statusCode = 400;
        break;
      case 'P2025': // Record not found
        response.error = {
          code: ApiErrorCode.NOT_FOUND,
          message: 'Registro no encontrado',
          details: error.meta
        };
        statusCode = 404;
        break;
      default:
        response.error = {
          code: ApiErrorCode.DATABASE_ERROR,
          message: 'Error en la base de datos',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        };
        statusCode = 500;
    }
  }
  // Manejar errores de validación
  else if (error.name === 'ValidationError') {
    response.error = {
      code: ApiErrorCode.VALIDATION_ERROR,
      message: 'Error de validación',
      details: error.message
    };
    statusCode = 400;
  }
  // Manejar errores de JWT
  else if (error.name === 'JsonWebTokenError') {
    response.error = {
      code: ApiErrorCode.INVALID_TOKEN,
      message: 'Token inválido',
    };
    statusCode = 401;
  }
  else if (error.name === 'TokenExpiredError') {
    response.error = {
      code: ApiErrorCode.SESSION_EXPIRED,
      message: 'La sesión ha expirado',
    };
    statusCode = 401;
  }

  // Registrar error en el sistema de actividades si es grave
  if (statusCode >= 500) {
    try {
      await logActivity((req as any).user?.id || -1, 'SYSTEM_ERROR', {
        category: ActivityCategory.SYSTEM,
        details: {
          description: 'Error del sistema',
          metadata: {
            timestamp: new Date().toISOString(),
            requestInfo: {
              path: req.path,
              method: req.method,
              userAgent: req.headers['user-agent'],
              ip: req.ip
            }
          },
          error: {
            code: response.error?.code,
            message: response.error?.message,
            path: req.path,
            method: req.method
          }
        }
      });
    } catch (logError) {
      console.error('Error al registrar actividad de error:', logError);
    }
  }

  res.status(statusCode).json(response);
}; 
import { ApiErrorCode } from '../types/apiError';

interface CustomErrorParams {
  code: ApiErrorCode;
  message: string;
  status: number;
  details?: Record<string, any>;
}

export class CustomError extends Error {
  code: ApiErrorCode;
  status: number;
  details?: Record<string, any>;

  constructor({ code, message, status, details }: CustomErrorParams) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
    this.name = 'CustomError';
  }
} 
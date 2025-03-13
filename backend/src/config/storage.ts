import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { CustomError } from '../utils/customError';
import { ApiErrorCode } from '../types/apiError';

// Tipos de archivos permitidos
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// Tamaños máximos
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

// Rutas base de almacenamiento
export const UPLOAD_BASE_PATH = path.join(__dirname, '../../uploads');
export const CANTONES_PATH = path.join(UPLOAD_BASE_PATH, 'cantones');
export const DOCUMENTOS_PATH = path.join(UPLOAD_BASE_PATH, 'documentos');
export const TEMP_PATH = path.join(UPLOAD_BASE_PATH, 'temp');

// Crear directorios si no existen
[UPLOAD_BASE_PATH, CANTONES_PATH, DOCUMENTOS_PATH, TEMP_PATH].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Validador de tipo de archivo
export const validateFileType = (
  file: Express.Multer.File,
  allowedTypes: string[]
): boolean => {
  return allowedTypes.includes(file.mimetype);
};

// Configuración base de Multer
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    const uploadType = _req.body.uploadType || 'temp';
    const destinations: { [key: string]: string } = {
      canton: CANTONES_PATH,
      documento: DOCUMENTOS_PATH,
      temp: TEMP_PATH
    };
    
    const destination = destinations[uploadType] || TEMP_PATH;
    cb(null, destination);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// Filtro de archivos
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const uploadType = req.body.uploadType || 'temp';
  const allowedTypes = uploadType === 'canton' ? ALLOWED_IMAGE_TYPES : ALLOWED_DOCUMENT_TYPES;
  
  if (!validateFileType(file, allowedTypes)) {
    const error = new CustomError({
      code: ApiErrorCode.INVALID_FILE_TYPE,
      message: 'Tipo de archivo no permitido',
      status: 400,
      details: {
        allowedTypes,
        receivedType: file.mimetype
      }
    });
    return cb(error);
  }
  
  cb(null, true);
};

// Configuraciones específicas para cada tipo de archivo
export const uploadConfig = {
  canton: multer({
    storage,
    fileFilter,
    limits: {
      fileSize: MAX_IMAGE_SIZE
    }
  }),
  
  documento: multer({
    storage,
    fileFilter,
    limits: {
      fileSize: MAX_DOCUMENT_SIZE
    }
  })
};

// Función para limpiar archivos temporales
export const cleanTempFiles = async (): Promise<void> => {
  const files = await fs.promises.readdir(TEMP_PATH);
  const deletePromises = files.map(file => 
    fs.promises.unlink(path.join(TEMP_PATH, file))
  );
  await Promise.all(deletePromises);
};

// Función para mover archivo de temp a destino final
export const moveFile = async (
  tempPath: string,
  targetPath: string
): Promise<void> => {
  await fs.promises.rename(tempPath, targetPath);
};

// Función para eliminar archivo
export const deleteFile = async (filePath: string): Promise<void> => {
  if (await fs.promises.access(filePath).then(() => true).catch(() => false)) {
    await fs.promises.unlink(filePath);
  }
}; 
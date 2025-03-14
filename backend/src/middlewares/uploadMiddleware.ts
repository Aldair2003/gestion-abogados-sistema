import multer from 'multer';
import path from 'path';

// Tipos de archivos permitidos para documentos
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// Validación de tipos de archivo
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.fieldname === 'imagen' || file.fieldname === 'photo') {
    // Validar imágenes
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Solo se permiten archivos de imagen'));
      return;
    }
  } else if (file.fieldname === 'documento') {
    // Validar documentos
    if (!ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
      cb(new Error('Tipo de archivo no permitido'));
      return;
    }
  }
  
  cb(null, true);
};

// Configuraciones específicas
export const uploadCantonImage = multer({
  storage: multer.memoryStorage(), // Usar almacenamiento en memoria para imágenes
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

export const uploadProfilePhoto = multer({
  storage: multer.memoryStorage(), // Usar almacenamiento en memoria para fotos de perfil
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
});

// Para documentos también usamos almacenamiento en memoria
export const uploadDocumentos = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
}); 
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

// Configuración base de multer
const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    // Determinar el directorio según el tipo de archivo
    let uploadPath = 'uploads/';
    
    if (file.fieldname === 'imagen') {
      uploadPath += 'cantones/';
    } else if (file.fieldname === 'photo') {
      uploadPath += 'profile-photos/';
    } else if (file.fieldname === 'documento') {
      uploadPath += 'documentos/';
    }
    
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    let prefix = '';
    
    if (file.fieldname === 'imagen') {
      prefix = 'canton';
    } else if (file.fieldname === 'photo') {
      prefix = 'photo';
    } else if (file.fieldname === 'documento') {
      prefix = 'doc';
    }
    
    cb(null, `${prefix}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

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
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

export const uploadProfilePhoto = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
});

export const uploadDocumentos = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
}); 
import { v2 as cloudinary } from 'cloudinary';

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Configuración global para subidas
const defaultUploadOptions = {
  resource_type: 'raw' as const,
  access_mode: 'public',
  use_filename: true,
  unique_filename: true,
  overwrite: true,
  type: 'upload'
};

// Función para subir archivo
export const uploadFile = async (file: Express.Multer.File, folder: string): Promise<string> => {
  try {
    const options = {
      ...defaultUploadOptions,
      folder: `gestion-abogados/${folder}`,
      public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, "")}`
    };

    console.log('Subiendo archivo a Cloudinary:', {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      options
    });

    const result = await cloudinary.uploader.upload(file.path, options);
    
    console.log('Resultado de subida:', {
      publicId: result.public_id,
      url: result.secure_url,
      format: result.format,
      resourceType: result.resource_type
    });

    return result.secure_url;
  } catch (error) {
    console.error('Error al subir archivo a Cloudinary:', error);
    throw new Error('Error al subir archivo');
  }
};

// Función para eliminar archivo
export const deleteFile = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error al eliminar archivo de Cloudinary:', error);
    throw new Error('Error al eliminar archivo');
  }
};

export default cloudinary; 
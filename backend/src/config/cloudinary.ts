import { v2 as cloudinary } from 'cloudinary';

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Función para subir imagen
export const uploadImage = async (file: Express.Multer.File, folder: string): Promise<string> => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: `gestion-abogados/${folder}`,
      resource_type: "auto"
    });
    return result.secure_url;
  } catch (error) {
    console.error('Error al subir archivo a Cloudinary:', error);
    throw new Error('Error al subir archivo');
  }
};

// Función para eliminar imagen
export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error al eliminar archivo de Cloudinary:', error);
    throw new Error('Error al eliminar archivo');
  }
};

export default cloudinary; 
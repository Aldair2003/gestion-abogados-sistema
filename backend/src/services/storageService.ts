import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { UPLOAD_BASE_PATH } from '../config/storage';

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dbzwygjr0',
  api_key: process.env.CLOUDINARY_API_KEY || '216772599449817',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'f76xrmJETvk3eJwGp0mZSqpL70w',
  secure: true
});

// Tipo de almacenamiento
type StorageType = 'local' | 'cloudinary';

// Configuración del servicio
const STORAGE_TYPE: StorageType = process.env.NODE_ENV === 'production' ? 'cloudinary' : (process.env.STORAGE_TYPE as StorageType) || 'local';

export class StorageService {
  private cloudinary: any;
  
  constructor() {
    this.cloudinary = cloudinary;
  }

  async saveFile(file: Express.Multer.File, folder: string): Promise<string> {
    if (STORAGE_TYPE === 'cloudinary') {
      return this.saveToCloudinary(file, folder);
    }
    return this.saveLocally(file, folder);
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (STORAGE_TYPE === 'cloudinary' || fileUrl.includes('cloudinary.com')) {
      await this.deleteFromCloudinary(fileUrl);
    } else {
      await this.deleteLocally(fileUrl);
    }
  }

  public async saveToCloudinary(file: Express.Multer.File, folder: string): Promise<string> {
    if (!this.cloudinary) {
      throw new Error('Cloudinary no está configurado');
    }
    
    const result = await this.cloudinary.uploader.upload(file.path, {
      folder: folder,
      resource_type: 'auto'
    });

    return result.secure_url;
  }

  private async saveLocally(file: Express.Multer.File, folder: string): Promise<string> {
    const targetPath = path.join(UPLOAD_BASE_PATH, folder);
    
    // Crear directorio si no existe
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }

    // Mover el archivo al directorio correcto si no está ahí
    const fileName = path.basename(file.path);
    const targetFilePath = path.join(targetPath, fileName);
    
    if (file.path !== targetFilePath) {
      await fs.promises.rename(file.path, targetFilePath);
    }

    // Devolver la ruta relativa para acceso web
    const relativePath = path.join(folder, fileName).replace(/\\/g, '/');
    return `/${relativePath}`;
  }

  private async deleteFromCloudinary(fileUrl: string): Promise<void> {
    try {
      const publicId = this.getPublicIdFromUrl(fileUrl);
      if (!publicId) {
        throw new Error('No se pudo obtener el public_id de la URL de Cloudinary');
      }
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Error al eliminar archivo de Cloudinary:', error);
      throw new Error('Error al eliminar archivo de Cloudinary');
    }
  }

  private async deleteLocally(fileUrl: string): Promise<void> {
    try {
      const filePath = path.join(UPLOAD_BASE_PATH, fileUrl.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error al eliminar archivo local:', error);
      throw new Error('Error al eliminar archivo local');
    }
  }

  private getPublicIdFromUrl(url: string): string | null {
    try {
      // Extraer el public_id de una URL de Cloudinary
      const matches = url.match(/\/v\d+\/([^/]+)\.[^.]+$/);
      if (matches && matches[1]) {
        return `gestion-abogados/${matches[1]}`;
      }
      return null;
    } catch {
      return null;
    }
  }

  getFileUrl(relativePath: string): string {
    if (STORAGE_TYPE === 'cloudinary' || relativePath.includes('cloudinary.com')) {
      return relativePath; // Ya es una URL completa de Cloudinary
    }
    // Para local, construir URL completa
    return `${process.env.BASE_URL || 'http://localhost:3000'}${relativePath}`;
  }
}

export const storageService = new StorageService(); 
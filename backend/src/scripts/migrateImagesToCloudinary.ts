import { prisma } from '../lib/prisma';
import { storageService } from '../services/storageService';
import fs from 'fs';
import path from 'path';
import { UPLOAD_BASE_PATH } from '../config/storage';

async function migrateImages() {
  console.log('Iniciando migración de imágenes a Cloudinary...');

  try {
    // 1. Migrar fotos de perfil de usuarios
    const users = await prisma.user.findMany({
      where: {
        photoUrl: {
          not: null,
          notIn: ['', 'https://']
        }
      }
    });

    console.log(`Encontrados ${users.length} usuarios con fotos de perfil para migrar`);

    for (const user of users) {
      if (!user.photoUrl) continue;

      try {
        const localPath = path.join(UPLOAD_BASE_PATH, user.photoUrl.replace(/^\//, ''));
        
        if (fs.existsSync(localPath)) {
          // Crear un objeto File simulado para storageService
          const file = {
            path: localPath,
            originalname: path.basename(localPath)
          } as Express.Multer.File;

          // Subir a Cloudinary usando el método público saveFile
          const cloudinaryUrl = await storageService.saveFile(file, 'profile-photos');
          
          // Actualizar la URL en la base de datos
          await prisma.user.update({
            where: { id: user.id },
            data: { photoUrl: cloudinaryUrl }
          });

          console.log(`Migrada foto de perfil para usuario ${user.id}`);
        } else {
          console.log(`No se encontró el archivo local para usuario ${user.id}: ${localPath}`);
        }
      } catch (error) {
        console.error(`Error al migrar foto de usuario ${user.id}:`, error);
      }
    }

    // 2. Migrar imágenes de cantones
    const cantones = await prisma.canton.findMany({
      where: {
        imagenUrl: {
          not: null,
          notIn: ['', 'https://']
        }
      }
    });

    console.log(`Encontrados ${cantones.length} cantones con imágenes para migrar`);

    for (const canton of cantones) {
      if (!canton.imagenUrl) continue;

      try {
        const localPath = path.join(UPLOAD_BASE_PATH, canton.imagenUrl.replace(/^\//, ''));
        
        if (fs.existsSync(localPath)) {
          const file = {
            path: localPath,
            originalname: path.basename(localPath)
          } as Express.Multer.File;

          const cloudinaryUrl = await storageService.saveFile(file, 'cantones');
          
          await prisma.canton.update({
            where: { id: canton.id },
            data: { imagenUrl: cloudinaryUrl }
          });

          console.log(`Migrada imagen para cantón ${canton.id}`);
        } else {
          console.log(`No se encontró el archivo local para cantón ${canton.id}: ${localPath}`);
        }
      } catch (error) {
        console.error(`Error al migrar imagen de cantón ${canton.id}:`, error);
      }
    }

    console.log('Migración completada exitosamente');
  } catch (error) {
    console.error('Error durante la migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la migración
migrateImages(); 
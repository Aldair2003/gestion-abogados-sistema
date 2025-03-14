import { driveClient, createFolderIfNotExists } from '../config/googleDrive';

async function setupGoogleDriveFolders() {
  try {
    console.log('Creando carpetas en Google Drive...');

    // Crear carpeta principal
    const mainFolderId = await createFolderIfNotExists('Sistema-Gestion-Abogados');
    console.log('Carpeta principal creada:', mainFolderId);

    // Crear subcarpetas
    const documentosFolderId = await createFolderIfNotExists('Documentos');
    console.log('Carpeta de documentos creada:', documentosFolderId);

    const tempFolderId = await createFolderIfNotExists('Temp');
    console.log('Carpeta temporal creada:', tempFolderId);

    console.log('\nAgrega estos IDs a tu archivo .env:');
    console.log(`GOOGLE_DRIVE_DOCUMENTOS_FOLDER_ID="${documentosFolderId}"`);
    console.log(`GOOGLE_DRIVE_TEMP_FOLDER_ID="${tempFolderId}"`);

  } catch (error) {
    console.error('Error al configurar carpetas:', error);
  }
}

setupGoogleDriveFolders(); 
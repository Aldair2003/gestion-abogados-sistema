import { google } from 'googleapis';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

// Configuración de credenciales
const CREDENTIALS = {
  type: 'service_account',
  project_id: 'gestion-abogados-sistema',
  private_key_id: process.env.GOOGLE_DRIVE_PRIVATE_KEY_ID,
  private_key: process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
  client_id: process.env.GOOGLE_DRIVE_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: process.env.GOOGLE_DRIVE_CERT_URL,
  universe_domain: 'googleapis.com'
};

// Crear cliente autenticado
const auth = new google.auth.GoogleAuth({
  credentials: CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/drive.file']
});

// Crear cliente de Drive
export const driveClient = google.drive({ version: 'v3', auth });

// Configuración de carpetas
export const FOLDER_IDS = {
  DOCUMENTOS: process.env.GOOGLE_DRIVE_DOCUMENTOS_FOLDER_ID || '1234567890',
  CANTONES: process.env.GOOGLE_DRIVE_CANTONES_FOLDER_ID || '1234567890',
  TEMP: process.env.GOOGLE_DRIVE_TEMP_FOLDER_ID || '1234567890'
} as const;

// Función para crear carpeta si no existe
export const createFolderIfNotExists = async (folderName: string): Promise<string> => {
  try {
    const response = await driveClient.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id'
    });
    
    return response.data.id || '';
  } catch (error) {
    console.error('Error al crear carpeta en Drive:', error);
    throw error;
  }
}; 
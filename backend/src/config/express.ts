import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { UPLOAD_BASE_PATH } from './storage';

export const configureExpress = (app: express.Application): void => {
  // Seguridad
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));
  
  // CORS
  app.use(cors({
    origin: [
      'http://localhost:5173',
      'https://gestion-abogados-sistema.vercel.app',
      /\.vercel\.app$/
    ],
    credentials: true
  }));
  
  // Logging
  app.use(morgan('dev'));
  
  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Servir archivos estáticos
  app.use('/uploads', express.static(UPLOAD_BASE_PATH, {
    // Opciones de seguridad para archivos estáticos
    setHeaders: (res, filePath) => {
      // Prevenir listado de directorios
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // Cache control
      if (filePath.includes('temp')) {
        res.setHeader('Cache-Control', 'no-store');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=31536000');
      }
    }
  }));
}; 
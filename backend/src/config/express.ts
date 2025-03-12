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
    origin: function(origin, callback) {
      // Permitir solicitudes sin origen (como las aplicaciones móviles o Postman)
      if (!origin) return callback(null, true);
      
      // Lista de dominios permitidos
      const allowedDomains = [
        'http://localhost:3001',
        'http://localhost:5173',
        'https://gestion-abogados-sistema.vercel.app',
        /^https:\/\/gestion-abogados-sistema-.*\.vercel\.app$/
      ];

      // Verificar si el origen coincide con alguno de los permitidos
      const isAllowed = allowedDomains.some(domain => {
        if (domain instanceof RegExp) {
          return domain.test(origin);
        }
        return domain === origin;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
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
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { UPLOAD_BASE_PATH } from './storage';

export const configureExpress = (app: express.Application): void => {
  // Seguridad
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    })
  );

  // Lista de orígenes permitidos
  const allowedOrigins = [
    'http://localhost:3001',
    'http://localhost:5173',
    'https://gestion-abogados-sistema.vercel.app'
  ];

  // Middleware CORS
  app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app'))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
      res.setHeader('Access-Control-Expose-Headers', 'Authorization');
    }

    // Responder inmediatamente a preflight requests
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }

    next();
  });

  // Middleware CORS de respaldo (en caso de que el anterior falle)
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
          callback(null, true);
        } else {
          callback(new Error('No permitido por CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      exposedHeaders: ['Authorization']
    })
  );

  // Logging de peticiones HTTP
  app.use(morgan('dev'));

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Servir archivos estáticos
  app.use(
    '/uploads',
    express.static(UPLOAD_BASE_PATH, {
      setHeaders: (res, filePath) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');

        if (filePath.includes('temp')) {
          res.setHeader('Cache-Control', 'no-store');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=31536000');
        }
      }
    })
  );
};

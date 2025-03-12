import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { UPLOAD_BASE_PATH } from './storage';

// Cargar variables de entorno
dotenv.config();

// Verificar que `CORS_ORIGIN` se está leyendo correctamente
console.log("🚀 CORS_ORIGIN en backend:", process.env.CORS_ORIGIN);

export const configureExpress = (app: express.Application): void => {
  // Seguridad
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    })
  );

  // Obtener orígenes permitidos desde la variable de entorno
  const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : [
      'http://localhost:3001',
      'http://localhost:5173',
      'https://gestion-abogados-sistema.vercel.app',
      'https://gestion-abogados-sistema-brbvmza88-alda04xs-projects.vercel.app'
    ];

console.log("✅ Allowed Origins:", allowedOrigins);

  // Middleware CORS
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    console.log("🔍 Petición desde:", origin);

    if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app'))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
      res.setHeader('Access-Control-Expose-Headers', 'Authorization');
      console.log("✅ CORS permitido para:", origin);
    } else {
      console.warn("⛔ CORS bloqueado para:", origin);
    }

    // Manejar preflight requests (OPTIONS)
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }

    next();
  });

  // Middleware CORS de respaldo
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
          callback(null, true);
        } else {
          callback(new Error('⛔ No permitido por CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      exposedHeaders: ['Authorization']
    })
  );

  // Logging
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

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
  // Seguridad con Helmet
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
        'https://gestion-abogados-sistema.vercel.app',
        'https://gestion-abogados-sistema-git-master-alda04xs-projects.vercel.app',
        'https://gestion-abogados-sistema-brbvmza88-alda04xs-projects.vercel.app',
        'http://localhost:3001',
        'http://localhost:5173'
      ];

  console.log("✅ Allowed Origins:", allowedOrigins);

  // Middleware CORS
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        console.warn("⛔ CORS bloqueado para:", origin);
        callback(new Error('⛔ No permitido por CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization']
  }));

  // Middleware de logging
  app.use(morgan('dev'));

  // Middleware para parseo de JSON
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Servir archivos estáticos
  app.use('/uploads', express.static(UPLOAD_BASE_PATH, {
    setHeaders: (res, filePath) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');

      if (filePath.includes('temp')) {
        res.setHeader('Cache-Control', 'no-store');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=31536000');
      }
    }
  }));
};

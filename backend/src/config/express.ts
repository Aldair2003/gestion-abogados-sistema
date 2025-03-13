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
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
      crossOriginOpenerPolicy: false,
      xFrameOptions: false
    })
  );

  // Obtener orígenes permitidos
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
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'Range'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
  }));

  // Middleware de logging
  app.use(morgan('dev'));

  // Middleware para parseo de JSON
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Servir archivos estáticos
  app.use('/documentos', express.static(UPLOAD_BASE_PATH + '/documentos', {
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
      res.setHeader('X-Frame-Options', 'ALLOWALL');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }));
};

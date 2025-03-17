import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import cantonRoutes from './routes/cantonRoutes';
import personaRoutes from './routes/personaRoutes';
import juezRoutes from './routes/juezRoutes';
import authRoutes from './routes/authRoutes';
import { prisma } from './lib/prisma';
import { setupSwagger } from './swagger';
import permissionRoutes from './routes/permissionRoutes';
import { sendWelcomeEmail } from './services/emailService';
import { errorHandler } from './middlewares/errorHandler';
import { initializeSystem } from './middlewares/initializeSystem';
import { configureExpress } from './config/express';
import { UPLOAD_BASE_PATH } from './config/storage';

dotenv.config();

export const app = express();

// Configurar Express (middlewares, CORS, etc.)
configureExpress(app);

// Configurar directorio de archivos estáticos
app.use('/', (_, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range, Authorization');
  next();
}, express.static(UPLOAD_BASE_PATH));

app.use('/documentos', (_, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range, Authorization');
  next();
}, express.static(UPLOAD_BASE_PATH + '/documentos'));

// Configurar Swagger antes de las rutas API
setupSwagger(app);

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/cantones', cantonRoutes);
app.use('/api/personas', personaRoutes);
app.use('/api/jueces', juezRoutes);

// Ruta de prueba para email
app.post('/test-email', async (_req: Request, res: Response) => {
  try {
    await sendWelcomeEmail('Luis.toala.r@gmail.com', 'Usuario Test');
    res.json({ message: 'Email enviado correctamente' });
  } catch (error) {
    console.error('Error al enviar email:', error);
    res.status(500).json({ 
      message: 'Error al enviar email',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

// Ruta de salud
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Ruta por defecto
app.get('/', (_req: Request, res: Response) => {
  res.json({ 
    message: 'API Sistema de Gestión de Abogados', 
    version: '1.0.0',
    docs: '/api-docs'
  });
});

// Middleware de manejo de errores (debe ir después de las rutas)
app.use(errorHandler);

// Manejo de rutas no encontradas
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 3000;

// Iniciar servidor y conectar base de datos
const startServer = async () => {
  try {
    // Verificar conexión con Prisma
    await prisma.$connect();
    console.log('Conexión a base de datos establecida correctamente.');
    
    // Inicializar sistema (crear primer admin si no existe)
    await initializeSystem();
    
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
      console.log(`Documentación API disponible en http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de cierre limpio
process.on('SIGTERM', async () => {
  console.log('Cerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import { prisma } from './lib/prisma';
import { setupSwagger } from './swagger';
import permissionRoutes from './routes/permissionRoutes';
import { sendWelcomeEmail } from './services/emailService';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import path from 'path';
import { initializeSystem } from './middlewares/initializeSystem';

dotenv.config();

export const app = express();

// Middlewares básicos
app.use(cors()); // CORS ahora se configura en `express.ts`

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar directorio de archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Configurar Swagger antes de las rutas API
setupSwagger(app);

// Rutas API
app.use('/api/users', userRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api', routes);

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

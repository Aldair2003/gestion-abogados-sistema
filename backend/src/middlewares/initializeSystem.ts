import { prisma } from '../lib/prisma';
import { UserRole, ActivityCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logActivity } from '../services/logService';

export const initializeSystem = async (): Promise<void> => {
  try {
    console.log('[System] Verificando inicialización del sistema...');

    // Verificar si ya existe algún admin
    const existingAdmin = await prisma.user.findFirst({
      where: { rol: UserRole.ADMIN }
    });

    if (existingAdmin) {
      console.log('[System] Sistema ya inicializado. Admin existente.');
      return;
    }

    console.log('[System] No se encontró admin. Creando primer administrador...');

    // Crear el primer admin
    const email = 'Luis.toala.r@gmail.com';
    const temporalPassword = 'Temporal12345@';
    const hashedPassword = await bcrypt.hash(temporalPassword, 10);

    const newAdmin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        rol: UserRole.ADMIN,
        isActive: true,
        isFirstLogin: true,
        isProfileCompleted: false,
        isTemporaryPassword: true,
        tokenVersion: 0
      }
    });

    // Registrar la actividad
    await logActivity(newAdmin.id, 'SYSTEM_INITIALIZED', {
      category: ActivityCategory.SYSTEM,
      details: {
        description: 'Sistema inicializado con primer administrador',
        metadata: {
          adminId: newAdmin.id,
          adminEmail: newAdmin.email,
          timestamp: new Date().toISOString()
        }
      }
    });

    console.log('[System] Primer administrador creado exitosamente:', {
      id: newAdmin.id,
      email: newAdmin.email,
      rol: newAdmin.rol
    });

  } catch (error) {
    console.error('[System] Error al inicializar el sistema:', error);
    throw error;
  }
}; 
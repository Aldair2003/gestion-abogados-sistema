import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

async function resetUsers() {
  try {
    // Primero eliminamos todas las relaciones
    await prisma.userPermission.deleteMany();
    await prisma.activityLog.deleteMany();
    await prisma.notification.deleteMany();

    // Luego eliminamos todos los usuarios
    await prisma.user.deleteMany();

    // Creamos un nuevo usuario administrador
    const hashedPassword = await bcrypt.hash('Admin12345@', 10);
    const newAdmin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        rol: UserRole.ADMIN,
        isActive: true,
        isFirstLogin: true,
        isProfileCompleted: false
      }
    });

    console.log('Base de datos reseteada exitosamente');
    console.log('Nuevo administrador creado:', {
      id: newAdmin.id,
      email: newAdmin.email,
      rol: newAdmin.rol
    });

  } catch (error) {
    console.error('Error al resetear usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetUsers(); 
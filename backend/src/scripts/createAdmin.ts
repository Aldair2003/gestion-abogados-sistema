import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    const hashedPassword = await bcrypt.hash('Admin12345@', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'luis.toala.r@gmail.com',
        password: hashedPassword,
        nombre: 'Luis Toala',
        cedula: '0803723766',
        telefono: '0991767957',
        rol: UserRole.ADMIN,
        isActive: true,
        isFirstLogin: true,
        isProfileCompleted: false
      }
    });

    console.log('Usuario administrador creado exitosamente:', user);
  } catch (error) {
    console.error('Error al crear usuario administrador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser(); 
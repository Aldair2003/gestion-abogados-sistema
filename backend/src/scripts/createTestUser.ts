import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    const hashedPassword = await bcrypt.hash('Aldakun2003c', 10);
    
    const user = await prisma.user.upsert({
      where: { email: 'Luis.toala.r@gmail.com' },
      update: {
        password: hashedPassword,
        isActive: true
      },
      create: {
        email: 'Luis.toala.r@gmail.com',
        password: hashedPassword,
        nombre: 'Aldakun',
        cedula: '0803723766',
        telefono: '0991767957',
        rol: 'admin',
        isActive: true
      }
    });

    console.log('Usuario administrador creado:', user);
  } catch (error) {
    console.error('Error creando usuario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser(); 
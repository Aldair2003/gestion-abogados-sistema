import { prisma } from '../lib/prisma';

async function deleteUser() {
  try {
    // Eliminar registros relacionados primero
    await prisma.activityLog.deleteMany({
      where: { userId: 1 }
    });
    
    await prisma.notification.deleteMany({
      where: { userId: 1 }
    });
    
    await prisma.userPermission.deleteMany({
      where: { userId: 1 }
    });

    // Ahora sí eliminar el usuario
    await prisma.user.delete({
      where: { id: 1 }
    });
    
    console.log('Usuario y registros relacionados eliminados exitosamente');
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUser(); 
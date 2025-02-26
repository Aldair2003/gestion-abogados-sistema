import { prisma } from '../lib/prisma';

async function deleteAllUsersExceptAdmin() {
  try {
    // Obtener el email del admin principal
    const adminEmail = 'luis.toala.r@gmail.com';

    // Obtener los IDs de los usuarios a eliminar
    const usersToDelete = await prisma.user.findMany({
      where: {
        email: {
          not: adminEmail
        }
      },
      select: {
        id: true
      }
    });

    const userIds = usersToDelete.map(user => user.id);

    // Eliminar registros relacionados
    await prisma.$transaction([
      // Eliminar notificaciones
      prisma.notification.deleteMany({
        where: {
          userId: {
            in: userIds
          }
        }
      }),
      // Eliminar logs de actividad
      prisma.activityLog.deleteMany({
        where: {
          userId: {
            in: userIds
          }
        }
      }),
      // Eliminar permisos de usuario
      prisma.userPermission.deleteMany({
        where: {
          userId: {
            in: userIds
          }
        }
      }),
      // Finalmente, eliminar los usuarios
      prisma.user.deleteMany({
        where: {
          id: {
            in: userIds
          }
        }
      })
    ]);

    console.log(`Se eliminaron ${userIds.length} usuarios exitosamente`);
  } catch (error) {
    console.error('Error al eliminar usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
deleteAllUsersExceptAdmin(); 
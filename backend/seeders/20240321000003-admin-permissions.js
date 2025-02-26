'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Obtener el admin user
    const adminUser = await queryInterface.sequelize.query(
      `SELECT id FROM "Users" WHERE email = 'admin@example.com'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Obtener todos los permisos
    const permissions = await queryInterface.sequelize.query(
      `SELECT id FROM "Permissions"`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Crear registros en UserPermissions
    const userPermissions = permissions.map(permission => ({
      UserId: adminUser[0].id,
      PermissionId: permission.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await queryInterface.bulkInsert('UserPermissions', userPermissions);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('UserPermissions', {
      UserId: 1 // ID del admin
    });
  }
}; 
'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    await queryInterface.bulkInsert('Users', [{
      nombre: 'Administrador',
      cedula: 'ADMIN001',
      telefono: '0000000000',
      email: 'admin@example.com',
      password: hashedPassword,
      rol: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', { email: 'admin@example.com' }, {});
  }
}; 
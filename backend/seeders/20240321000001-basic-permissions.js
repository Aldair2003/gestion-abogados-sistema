'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Permissions', [
      {
        nombre: 'ver_usuarios',
        descripcion: 'Ver lista de usuarios',
        modulo: 'usuarios',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'crear_usuarios',
        descripcion: 'Crear nuevos usuarios',
        modulo: 'usuarios',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'ver_expedientes',
        descripcion: 'Ver lista de expedientes',
        modulo: 'expedientes',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'ver_documentos',
        descripcion: 'Ver documentos de expedientes',
        modulo: 'documentos',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'ver_calendario',
        descripcion: 'Ver eventos del calendario',
        modulo: 'calendario',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Permissions', null, {});
  }
}; 
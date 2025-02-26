import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

interface PermissionAttributes {
  id?: number;
  nombre: string;
  descripcion: string;
  modulo: string;
}

class Permission extends Model<PermissionAttributes> implements PermissionAttributes {
  public id!: number;
  public nombre!: string;
  public descripcion!: string;
  public modulo!: string;
}

Permission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    descripcion: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    modulo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'Permissions',
  }
);

export default Permission; 
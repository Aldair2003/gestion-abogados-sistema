import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

interface ProvinceAttributes {
  id?: number;
  nombre: string;
  codigo: string;
  isActive: boolean;
}

class Province extends Model<ProvinceAttributes> implements ProvinceAttributes {
  public id!: number;
  public nombre!: string;
  public codigo!: string;
  public isActive!: boolean;
}

Province.init(
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
    codigo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'Provinces',
    timestamps: true,
  }
);

export default Province; 
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

interface ActivityLogAttributes {
  id?: number;
  userId: number;
  action: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
}

class ActivityLog extends Model<ActivityLogAttributes> implements ActivityLogAttributes {
  public id!: number;
  public userId!: number;
  public action!: string;
  public description!: string;
  public ipAddress!: string;
  public userAgent!: string;
  public readonly createdAt!: Date;
}

ActivityLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    ipAddress: {
      type: DataTypes.STRING,
    },
    userAgent: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    tableName: 'ActivityLogs',
    timestamps: true,
    updatedAt: false,
  }
);

export default ActivityLog; 
import { Model, DataTypes, Association } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';
import Permission from './permission';

interface UserAttributes {
  id?: number;  // Hacemos el id opcional ya que Sequelize lo maneja automáticamente
  nombre: string;
  cedula: string;
  telefono: string;
  email: string;
  password: string;
  rol: 'admin' | 'user' | 'colaborador';
  isActive: boolean;
  lastLogin?: Date | null;           // Permitir null explícitamente
  resetToken?: string | null;        // Permitir null explícitamente
  resetTokenExpiry?: Date | null;    // Permitir null explícitamente
  permissions?: Permission[];
  matricula?: string;
  domicilio?: string;
  nivelEstudios?: 'estudiante' | 'graduado' | 'maestria';
  universidad?: string;
  isFirstLogin: boolean;
  isProfileCompleted: boolean;
}

class User extends Model<UserAttributes> implements UserAttributes {
  public id!: number;
  public nombre!: string;
  public cedula!: string;
  public telefono!: string;
  public email!: string;
  public password!: string;
  public rol!: 'admin' | 'user' | 'colaborador';
  public isActive!: boolean;
  public lastLogin!: Date;
  public resetToken?: string | null;
  public resetTokenExpiry?: Date | null;
  public permissions?: Permission[];
  public matricula?: string;
  public domicilio?: string;
  public nivelEstudios?: 'estudiante' | 'graduado' | 'maestria';
  public universidad?: string;
  public isFirstLogin!: boolean;
  public isProfileCompleted!: boolean;

  // Métodos de asociación
  declare setPermissions: (permissions: Permission[]) => Promise<void>;
  declare getPermissions: () => Promise<Permission[]>;
  declare addPermission: (permission: Permission) => Promise<void>;
  declare removePermission: (permission: Permission) => Promise<void>;

  declare static associations: {
    permissions: Association<User, Permission>;
  };

  // Método para validar contraseña
  public async validatePassword(password: string): Promise<boolean> {
    try {
      console.log('Validating password:', {
        provided: password,
        stored: this.password
      });
      const isValid = await bcrypt.compare(password, this.password);
      console.log('Validation result:', isValid);
      return isValid;
    } catch (error) {
      console.error('Error validating password:', error);
      return false;
    }
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cedula: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    telefono: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rol: {
      type: DataTypes.ENUM('admin', 'user', 'colaborador'),
      allowNull: false,
      defaultValue: 'colaborador',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    lastLogin: {
      type: DataTypes.DATE,
    },
    resetToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resetTokenExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    matricula: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    domicilio: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nivelEstudios: {
      type: DataTypes.ENUM('estudiante', 'graduado', 'maestria'),
      allowNull: true,
    },
    universidad: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isFirstLogin: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isProfileCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  },
  {
    sequelize,
    tableName: 'Users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  }
);

User.belongsToMany(Permission, {
  through: 'UserPermissions',
  as: 'permissions'
});

Permission.belongsToMany(User, {
  through: 'UserPermissions',
  as: 'users'
});

export enum UserRole {
  ADMIN = 'admin',
  COLABORADOR = 'colaborador'
}

export default User;
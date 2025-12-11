const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

// Путь к файлу базы
const databaseFile = path.join(__dirname, '..', 'database.db');

// Настройка подключения SQLite через Sequelize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: databaseFile,
  logging: false,
});

// Модель пользователя
const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    avatar_path: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  },
  {
    tableName: 'users',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

// Модель работы
const Work = sequelize.define(
  'Work',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    tags: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const raw = this.getDataValue('tags');
        if (!raw) return [];
        return raw.split(',').map((tag) => tag.trim()).filter(Boolean);
      },
      set(value) {
        const normalized = Array.isArray(value) ? value.join(',') : value;
        this.setDataValue('tags', normalized || '');
      },
    },
    image_path: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gallery: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  },
  {
    tableName: 'works',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

// Связи
User.hasMany(Work, { foreignKey: 'user_id', as: 'works' });
Work.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Инициализация базы
async function initDatabase() {
  await sequelize.authenticate();
  // Создаем таблицы, если их нет, без удаления существующих данных
  await sequelize.sync();
}

module.exports = {
  sequelize,
  User,
  Work,
  initDatabase,
  databaseFile,
};

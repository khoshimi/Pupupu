const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

const databaseFile = path.join(__dirname, '..', 'BD.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: databaseFile,
  logging: false,
});

// Модель пользователя
const User = sequelize.define(
  'User',
  {
    id_users: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
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
  },
  {
    tableName: 'users',
    underscored: true,
    timestamps: false,
  }
);

// Модель категории
const Category = sequelize.define(
  'Category',
  {
    id_category: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
  },
  {
    tableName: 'category',
    underscored: true,
    timestamps: false,
  }
);

// Модель тега
const Tag = sequelize.define(
  'Tag',
  {
    id_tags: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
  },
  {
    tableName: 'tags',
    underscored: true,
    timestamps: false,
  }
);

// Модель арт-работы
const Art = sequelize.define(
  'Art',
  {
    id_art: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_users: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id_users',
      },
    },
    id_category: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Category,
        key: 'id_category',
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    gallery: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  },
  {
    tableName: 'art',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

// Связующая таблица арт-тегов
const ArtTag = sequelize.define(
  'ArtTag',
  {
    id_arttags: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_art: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Art,
        key: 'id_art',
      },
    },
    id_tags: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Tag,
        key: 'id_tags',
      },
    },
  },
  {
    tableName: 'arttags',
    underscored: true,
    timestamps: false,
  }
);

// Связи
User.hasMany(Art, { foreignKey: 'id_users', as: 'arts' });
Art.belongsTo(User, { foreignKey: 'id_users', as: 'user' });

Category.hasMany(Art, { foreignKey: 'id_category', as: 'arts' });
Art.belongsTo(Category, { foreignKey: 'id_category', as: 'category' });

Art.belongsToMany(Tag, { through: ArtTag, foreignKey: 'id_art', otherKey: 'id_tags', as: 'tags' });
Tag.belongsToMany(Art, { through: ArtTag, foreignKey: 'id_tags', otherKey: 'id_art', as: 'arts' });

async function initDatabase() {
  await sequelize.authenticate();
  await sequelize.sync({ force: false, alter: false });

  const defaultCategories = ['ГД', 'ВБ', 'Традишка', 'ЦЖ'];
  for (const name of defaultCategories) {
    await Category.findOrCreate({ where: { name }, defaults: { name } });
  }
}

module.exports = {
  sequelize,
  User,
  Category,
  Tag,
  Art,
  ArtTag,
  initDatabase,
  databaseFile,
};

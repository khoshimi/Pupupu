const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const cors = require('cors');
const { initDatabase, User, Category, Tag, Art, ArtTag, sequelize } = require('./models');

const app = express();
const PORT = 3000;
const API_BASE_URL = `http://localhost:${PORT}`;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Настройка папки для загрузки изображений
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены!'));
    }
  },
});

// Статические файлы для изображений
app.use('/uploads', express.static(uploadsDir));

// Вспомогательные функции
const toTagsArray = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  return String(tags)
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
};

const serializeArt = (art) => {
  const plain = art.toJSON ? art.toJSON() : art;
  const tags = plain.tags ? plain.tags.map((t) => t.name) : [];
  const image_url = plain.image_url ? `${API_BASE_URL}${plain.image_url}` : null;
  return { ...plain, id: plain.id_art, tags, image_url };
};

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = (password, stored) => {
  if (!stored) return false;
  if (!stored.includes(':')) return stored === password;
  const [salt, storedHash] = stored.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch {
    return false;
  }
};

// Регистрация пользователя
app.post('/api/register', async (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Email и пароль обязательны, пароль не короче 6 символов' });
  }

  const safeUsername =
    (username && String(username).trim()) ||
    (email && String(email).split('@')[0]) ||
    'user';

  try {
    const passwordHash = hashPassword(password);
    const user = await User.create({ email, password: passwordHash, username: safeUsername });
    res.json({
      success: true,
      userId: user.id_users,
      email: user.email,
      username: user.username,
      message: 'Пользователь успешно зарегистрирован',
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }
    return res.status(500).json({ error: err.message });
  }
});

// Вход пользователя
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    res.json({
      success: true,
      userId: user.id_users,
      email: user.email,
      username: user.username,
      message: 'Вход выполнен успешно',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Получить все работы пользователя
app.get('/api/works/user/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const arts = await Art.findAll({
      where: { id_users: userId },
      include: [{ model: Tag, as: 'tags', through: { attributes: [] } }],
      order: [['created_at', 'DESC']],
    });
    res.json(arts.map(serializeArt));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Получить работы по галерее
app.get('/api/works/gallery/:gallery', async (req, res) => {
  const gallery = req.params.gallery;

  try {
    const arts = await Art.findAll({
      where: { gallery },
      include: [
        { model: User, as: 'user', attributes: ['email'] },
        { model: Tag, as: 'tags', through: { attributes: [] } },
      ],
      order: [['created_at', 'DESC']],
    });

    const normalized = arts.map((art) => {
      const serialized = serializeArt(art);
      return { ...serialized, user_email: art.user ? art.user.email : null };
    });

    res.json(normalized);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Получить работу по ID
app.get('/api/works/:workId', async (req, res) => {
  const workId = req.params.workId;

  try {
    const art = await Art.findByPk(workId, {
      include: [
        { model: User, as: 'user', attributes: ['email'] },
        { model: Tag, as: 'tags', through: { attributes: [] } },
      ],
    });

    if (!art) {
      return res.status(404).json({ error: 'Работа не найдена' });
    }

    const serialized = serializeArt(art);
    return res.json({ ...serialized, user_email: art.user ? art.user.email : null });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/works', upload.single('image'), async (req, res) => {
  const { userId, title, description, tags, gallery } = req.body;

  if (!userId || !title || !description || !tags || !gallery) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
  const tagsArray = Array.isArray(tags) ? tags : toTagsArray(tags);

  try {
    const tagRecords = await Promise.all(
      tagsArray.map(async (tagName) => {
        const [tag] = await Tag.findOrCreate({ where: { name: tagName } });
        return tag;
      })
    );

    const art = await Art.create({
      id_users: userId,
      title,
      description,
      image_url: imagePath,
      gallery,
    });

    if (tagRecords.length) {
      await art.setTags(tagRecords);
    }

    res.json({
      success: true,
      workId: art.id_art,
      message: 'Работа успешно добавлена',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Удалить работу
app.delete('/api/works/:workId', async (req, res) => {
  const workId = req.params.workId;

  try {
    const art = await Art.findByPk(workId, { include: [{ model: Tag, as: 'tags' }] });

    if (!art) {
      return res.status(404).json({ error: 'Работа не найдена' });
    }

    if (art.image_url) {
      const imagePath = path.join(__dirname, art.image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await art.setTags([]);
    await art.destroy();

    res.json({
      success: true,
      message: 'Работа успешно удалена',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Получить пользователя по email
app.get('/api/user/:email', async (req, res) => {
  const email = req.params.email;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const plain = user.toJSON();
    res.json({
      ...plain,
      avatar_url: plain.avatar_path ? `${API_BASE_URL}${plain.avatar_path}` : null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Обновить аватар пользователя
app.post('/api/user/avatar', upload.single('avatar'), async (req, res) => {
  const userId = req.body.userId;

  if (!userId) {
    return res.status(400).json({ error: 'ID пользователя обязателен' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Файл изображения не загружен' });
  }

  const avatarPath = `/uploads/${req.file.filename}`;

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (user.avatar_path) {
      const oldAvatarPath = path.join(__dirname, user.avatar_path);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    user.avatar_path = avatarPath;
    await user.save();

    res.json({
      success: true,
      avatar_url: `${API_BASE_URL}${avatarPath}`,
      message: 'Аватар успешно обновлен',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Получить данные пользователя по ID
app.get('/api/user/id/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const plain = user.toJSON();
    res.json({
      ...plain,
      avatar_url: plain.avatar_path ? `${API_BASE_URL}${plain.avatar_path}` : null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Обработчик для корневого пути - отдаем главную страницу
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'glavnaya.html'));
});

// Обработчик для неправильных маршрутов типа /users/1 - перенаправляем на главную
app.get('/users/*', (req, res) => {
  res.redirect('/');
});

// Обслуживание статических файлов (HTML, CSS, JS, изображения) - должно быть в конце
app.use(express.static(__dirname));

async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Сервер запущен на http://localhost:${PORT}`);
      console.log(`Откройте в браузере: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Ошибка инициализации БД:', err.message);
    process.exit(1);
  }
}

startServer();

// Закрытие БД при завершении процесса
process.on('SIGINT', async () => {
  try {
    await sequelize.close();
    console.log('Соединение с БД закрыто');
  } catch (err) {
    console.error(err.message);
  }
  process.exit(0);
});

const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');
const { initDatabase, User, Work, sequelize } = require('./models');

const app = express();
const PORT = 3000;
const API_BASE_URL = `http://localhost:${PORT}`;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Настройка папки для загрузки изображений
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Настройка multer для загрузки файлов
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

const serializeWork = (work) => {
  const plain = work.toJSON ? work.toJSON() : work;
  const tags = Array.isArray(plain.tags) ? plain.tags : toTagsArray(plain.tags);
  const image_url = plain.image_path ? `${API_BASE_URL}${plain.image_path}` : null;
  return { ...plain, tags, image_url };
};

// Регистрация пользователя
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }

  try {
    const user = await User.create({ email, password });
    res.json({
      success: true,
      userId: user.id,
      email: user.email,
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
    const user = await User.findOne({ where: { email, password } });
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    res.json({
      success: true,
      userId: user.id,
      email: user.email,
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
    const works = await Work.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
    });
    res.json(works.map(serializeWork));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Получить работы по галерее
app.get('/api/works/gallery/:gallery', async (req, res) => {
  const gallery = req.params.gallery;

  try {
    const works = await Work.findAll({
      where: { gallery },
      include: [{ model: User, as: 'user', attributes: ['email'] }],
      order: [['created_at', 'DESC']],
    });

    const normalized = works.map((work) => {
      const serialized = serializeWork(work);
      return { ...serialized, user_email: work.user ? work.user.email : null };
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
    const work = await Work.findByPk(workId, {
      include: [{ model: User, as: 'user', attributes: ['email'] }],
    });

    if (!work) {
      return res.status(404).json({ error: 'Работа не найдена' });
    }

    const serialized = serializeWork(work);
    return res.json({ ...serialized, user_email: work.user ? work.user.email : null });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Добавить работу
app.post('/api/works', upload.single('image'), async (req, res) => {
  const { userId, title, description, tags, gallery } = req.body;

  if (!userId || !title || !description || !tags || !gallery) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
  const tagsValue = Array.isArray(tags) ? tags : toTagsArray(tags);

  try {
    const work = await Work.create({
      user_id: userId,
      title,
      description,
      tags: tagsValue,
      image_path: imagePath,
      gallery,
    });

    res.json({
      success: true,
      workId: work.id,
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
    const work = await Work.findByPk(workId);

    if (!work) {
      return res.status(404).json({ error: 'Работа не найдена' });
    }

    if (work.image_path) {
      const imagePath = path.join(__dirname, work.image_path);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await work.destroy();

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

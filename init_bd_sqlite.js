const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Путь к новой БД с расширением .sqlite
const dbPath = path.join(__dirname, 'BD.sqlite');

// Если нужно пересоздать файл с нуля, раскомментируйте строку ниже
// if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Ошибка подключения к БД:', err.message);
    process.exit(1);
  } else {
    console.log('Подключено к SQLite базе BD.sqlite');
    initializeDatabase();
  }
});

function initializeDatabase() {
  // Таблица пользователей
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id_users INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )`,
    (err) => {
      if (err) {
        console.error('Ошибка создания таблицы users:', err.message);
      } else {
        console.log('Таблица users создана/проверена');
      }
    }
  );

  // Таблица категорий
  db.run(
    `CREATE TABLE IF NOT EXISTS category (
      id_category INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )`,
    (err) => {
      if (err) {
        console.error('Ошибка создания таблицы category:', err.message);
      } else {
        console.log('Таблица category создана/проверена');
      }
    }
  );

  // Таблица тегов
  db.run(
    `CREATE TABLE IF NOT EXISTS tags (
      id_tags INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )`,
    (err) => {
      if (err) {
        console.error('Ошибка создания таблицы tags:', err.message);
      } else {
        console.log('Таблица tags создана/проверена');
      }
    }
  );

  // Таблица арт-работ
  db.run(
    `CREATE TABLE IF NOT EXISTS art (
      id_art INTEGER PRIMARY KEY AUTOINCREMENT,
      id_users INTEGER NOT NULL,
      id_category INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      gallery TEXT NOT NULL DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_users) REFERENCES users(id_users),
      FOREIGN KEY (id_category) REFERENCES category(id_category)
    )`,
    (err) => {
      if (err) {
        console.error('Ошибка создания таблицы art:', err.message);
      } else {
        console.log('Таблица art создана/проверена');
      }
    }
  );

  // Связующая таблица art-tags
  db.run(
    `CREATE TABLE IF NOT EXISTS arttags (
      id_arttags INTEGER PRIMARY KEY AUTOINCREMENT,
      id_art INTEGER NOT NULL,
      id_tags INTEGER NOT NULL,
      FOREIGN KEY (id_art) REFERENCES art(id_art),
      FOREIGN KEY (id_tags) REFERENCES tags(id_tags),
      UNIQUE(id_art, id_tags)
    )`,
    (err) => {
      if (err) {
        console.error('Ошибка создания таблицы arttags:', err.message);
      } else {
        console.log('Таблица arttags создана/проверена');
      }
    }
  );

  // Индексы для оптимизации связей
  db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)', (err) => {
    if (err) console.error('Ошибка создания индекса idx_users_email:', err.message);
  });
  db.run('CREATE INDEX IF NOT EXISTS idx_art_user ON art(id_users)', (err) => {
    if (err) console.error('Ошибка создания индекса idx_art_user:', err.message);
  });
  db.run('CREATE INDEX IF NOT EXISTS idx_art_category ON art(id_category)', (err) => {
    if (err) console.error('Ошибка создания индекса idx_art_category:', err.message);
  });
  db.run('CREATE INDEX IF NOT EXISTS idx_arttags_art ON arttags(id_art)', (err) => {
    if (err) console.error('Ошибка создания индекса idx_arttags_art:', err.message);
  });
  db.run('CREATE INDEX IF NOT EXISTS idx_arttags_tag ON arttags(id_tags)', (err) => {
    if (err) console.error('Ошибка создания индекса idx_arttags_tag:', err.message);
  });

  console.log('\nБаза BD.sqlite инициализирована успешно!');
  console.log('Файл БД находится в:', dbPath);

  db.close((err) => {
    if (err) {
      console.error('Ошибка закрытия БД:', err.message);
    } else {
      console.log('Соединение с БД закрыто');
    }
    process.exit(0);
  });
}

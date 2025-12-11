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
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) {
        console.error('Ошибка создания таблицы users:', err.message);
      } else {
        console.log('Таблица users создана/проверена');
      }
    }
  );

  // Таблица работ
  db.run(
    `CREATE TABLE IF NOT EXISTS works (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      tags TEXT NOT NULL,
      image_path TEXT,
      gallery TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    (err) => {
      if (err) {
        console.error('Ошибка создания таблицы works:', err.message);
      } else {
        console.log('Таблица works создана/проверена');
      }
    }
  );

  // Индексы для оптимизации
  db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)', (err) => {
    if (err) console.error('Ошибка создания индекса idx_users_email:', err.message);
  });
  db.run('CREATE INDEX IF NOT EXISTS idx_works_user_id ON works(user_id)', (err) => {
    if (err) console.error('Ошибка создания индекса idx_works_user_id:', err.message);
  });
  db.run('CREATE INDEX IF NOT EXISTS idx_works_gallery ON works(gallery)', (err) => {
    if (err) console.error('Ошибка создания индекса idx_works_gallery:', err.message);
  });
  db.run('CREATE INDEX IF NOT EXISTS idx_works_created_at ON works(created_at)', (err) => {
    if (err) console.error('Ошибка создания индекса idx_works_created_at:', err.message);
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

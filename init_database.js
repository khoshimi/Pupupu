const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.db');

// Удаляем существующую БД, если нужно пересоздать
// Раскомментируйте следующую строку, если хотите пересоздать БД:
// if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Ошибка подключения к БД:', err.message);
        process.exit(1);
    } else {
        console.log('Подключено к SQLite базе данных');
        initializeDatabase();
    }
});

function initializeDatabase() {
    // Таблица пользователей
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        avatar_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Ошибка создания таблицы users:', err.message);
        } else {
            console.log('Таблица users создана/проверена');
            // Добавляем колонку avatar_path, если её нет (для существующих БД)
            db.run(`ALTER TABLE users ADD COLUMN avatar_path TEXT`, (alterErr) => {
                // Игнорируем ошибку, если колонка уже существует
                if (!alterErr || alterErr.message.includes('duplicate column')) {
                    console.log('Колонка avatar_path проверена');
                }
            });
        }
    });

    // Таблица работ
    db.run(`CREATE TABLE IF NOT EXISTS works (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        tags TEXT NOT NULL,
        image_path TEXT,
        gallery TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`, (err) => {
        if (err) {
            console.error('Ошибка создания таблицы works:', err.message);
        } else {
            console.log('Таблица works создана/проверена');
        }
    });

    // Индексы для оптимизации
    db.run('CREATE INDEX IF NOT EXISTS idx_works_user_id ON works(user_id)', (err) => {
        if (err) console.error('Ошибка создания индекса:', err.message);
    });
    
    db.run('CREATE INDEX IF NOT EXISTS idx_works_gallery ON works(gallery)', (err) => {
        if (err) console.error('Ошибка создания индекса:', err.message);
    });
    
    db.run('CREATE INDEX IF NOT EXISTS idx_works_created_at ON works(created_at)', (err) => {
        if (err) console.error('Ошибка создания индекса:', err.message);
    });
    
    db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)', (err) => {
        if (err) console.error('Ошибка создания индекса:', err.message);
    });

    console.log('\nБаза данных инициализирована успешно!');
    console.log('Файл БД находится в:', dbPath);
    
    // Закрываем соединение
    db.close((err) => {
        if (err) {
            console.error('Ошибка закрытия БД:', err.message);
        } else {
            console.log('Соединение с БД закрыто');
        }
        process.exit(0);
    });
}

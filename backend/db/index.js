import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '..', 'database.sqlite');

let db;
let persistFn;

/** Одна строка или null */
export function dbGet(database, sql, params = []) {
  const stmt = database.prepare(sql, params);
  try {
    return stmt.step() ? stmt.getAsObject() : null;
  } finally {
    stmt.free();
  }
}

/** Все строки */
export function dbAll(database, sql, params = []) {
  const stmt = database.prepare(sql, params);
  try {
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    return rows;
  } finally {
    stmt.free();
  }
}

/** Выполнить INSERT/UPDATE/DELETE. Возвращает { changes, lastId }. */
export function dbRun(database, sql, params = []) {
  database.run(sql, params);
  const changes = database.getRowsModified();
  const row = dbGet(database, 'SELECT last_insert_rowid() as id');
  return { changes, lastId: row?.id ?? null };
}

export async function initDb() {
  const SQL = await initSqlJs();
  const exists = fs.existsSync(dbPath);
  if (exists) {
    const buf = fs.readFileSync(dbPath);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
    runSchema();
  }
  persistFn = () => {
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  };
  if (!exists) persist();
  return db;
}

function runSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      last_name TEXT NOT NULL,
      first_name TEXT NOT NULL,
      middle_name TEXT,
      phone TEXT,
      email TEXT,
      created_at TEXT NOT NULL DEFAULT (date('now'))
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS product_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price_per_gram REAL NOT NULL
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      product_type_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      weight REAL NOT NULL,
      work_price REAL NOT NULL,
      total_price REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'новый',
      created_at TEXT NOT NULL DEFAULT (date('now')),
      completed_at TEXT,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (product_type_id) REFERENCES product_types(id),
      FOREIGN KEY (material_id) REFERENCES materials(id)
    );
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_orders_client ON orders(client_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);`);
  const ptCount = dbGet(db, `SELECT COUNT(*) as c FROM product_types`).c;
  if (ptCount === 0) {
    ['Серьги', 'Кольца', 'Браслеты', 'Броши'].forEach((name) => db.run(`INSERT INTO product_types (name) VALUES (?)`, [name]));
    [['Золото 585', 4500], ['Серебро 925', 80], ['Платина', 6500]].forEach(([name, price]) =>
      db.run(`INSERT INTO materials (name, price_per_gram) VALUES (?, ?)`, [name, price])
    );
    runSeed();
  }
}

/** Тестовые данные при первом создании БД */
function runSeed() {
  const clients = [
    ['Иванова', 'Мария', 'Петровна', '+7 999 123-45-67', 'ivanova@mail.ru'],
    ['Сидоров', 'Алексей', 'Игоревич', '+7 999 765-43-21', 'sidorov@gmail.com'],
    ['Козлова', 'Елена', 'Сергеевна', '+7 999 111-22-33', 'kozlova@yandex.ru'],
    ['Николаев', 'Дмитрий', 'Андреевич', '+7 999 444-55-66', 'nikolaev@mail.ru'],
    ['Федорова', 'Анна', null, '+7 999 777-88-99', 'fedorova@gmail.com'],
  ];
  clients.forEach(([last_name, first_name, middle_name, phone, email]) => {
    db.run(
      `INSERT INTO clients (last_name, first_name, middle_name, phone, email) VALUES (?, ?, ?, ?, ?)`,
      [last_name, first_name, middle_name, phone, email]
    );
  });

  // Заказы: client_id, product_type_id, material_id, weight, work_price → total = weight*price_per_gram + work_price
  // Материалы: 1 Золото 585 (4500), 2 Серебро 925 (80), 3 Платина (6500)
  const orders = [
    [1, 1, 1, 3.5, 5000],   // серьги золото → 3.5*4500+5000 = 20750
    [2, 2, 2, 8, 3000],     // кольцо серебро → 8*80+3000 = 3640
    [1, 3, 2, 15, 4000],    // браслет серебро → 15*80+4000 = 5200
    [3, 1, 1, 2, 3500],     // серьги золото → 2*4500+3500 = 12500
    [4, 2, 3, 5, 8000],     // кольцо платина → 5*6500+8000 = 40500
    [2, 4, 2, 3, 2000],     // брошь серебро → 3*80+2000 = 2240
    [5, 1, 2, 4, 2500],     // серьги серебро → 4*80+2500 = 2820
  ];
  const statuses = ['выдан', 'готов', 'в работе', 'новый', 'в работе', 'готов', 'новый'];
  orders.forEach(([client_id, product_type_id, material_id, weight, work_price], i) => {
    const mat = dbGet(db, 'SELECT price_per_gram FROM materials WHERE id = ?', [material_id]);
    const total_price = mat ? Math.round(weight * mat.price_per_gram + work_price) : 0;
    db.run(
      `INSERT INTO orders (client_id, product_type_id, material_id, weight, work_price, total_price, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [client_id, product_type_id, material_id, weight, work_price, total_price, statuses[i]]
    );
  });
}

export function getDb() {
  if (!db) throw new Error('DB not initialized');
  return db;
}

export function persist() {
  if (persistFn) persistFn();
}

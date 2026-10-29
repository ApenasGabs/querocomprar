import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const dataDir = process.env.DATA_DIR || path.resolve(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dataDir, "quero_comprar.db");
export const db = new DatabaseSync(dbPath);

// Ativar modo WAL e integridade referencial para SQLite
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    target_price REAL NOT NULL,
    priority INTEGER NOT NULL DEFAULT 2,
    category TEXT DEFAULT 'Geral',
    negative_keywords TEXT DEFAULT '',
    reference_url TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS price_history (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    price REAL NOT NULL,
    regular_price REAL,
    store TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    image_url TEXT DEFAULT '',
    in_stock INTEGER DEFAULT 1,
    captured_at TEXT NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS scrape_logs (
    id TEXT PRIMARY KEY,
    product_id TEXT,
    status TEXT NOT NULL,
    message TEXT NOT NULL,
    items_found INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history(product_id);
  CREATE INDEX IF NOT EXISTS idx_price_history_captured_at ON price_history(captured_at);
`);

console.log(`[Database] SQLite inicializado com sucesso em modo WAL: ${dbPath}`);

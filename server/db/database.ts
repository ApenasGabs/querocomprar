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

// Migração resiliente de schema legado
try {
  const columns = db.prepare("PRAGMA table_info(products)").all() as any[];
  const columnNames = columns.map((c) => c.name);
  if (columnNames.includes("title") && !columnNames.includes("name")) {
    db.exec(`ALTER TABLE products RENAME COLUMN title TO name;`);
  }
  if (columnNames.includes("reference_urls") && !columnNames.includes("reference_url")) {
    db.exec(`ALTER TABLE products RENAME COLUMN reference_urls TO reference_url;`);
  }
  if (!columnNames.includes("notes")) {
    db.exec(`ALTER TABLE products ADD COLUMN notes TEXT DEFAULT '';`);
  }

  // Migração para scrape_logs legado
  const logCols = db.prepare("PRAGMA table_info(scrape_logs)").all() as any[];
  const logColNames = logCols.map((c) => c.name);
  if (!logColNames.includes("message")) {
    db.exec(`ALTER TABLE scrape_logs ADD COLUMN message TEXT DEFAULT '';`);
    if (logColNames.includes("error_message")) {
      db.exec(`UPDATE scrape_logs SET message = error_message WHERE message = '' OR message IS NULL;`);
    }
  }
  if (!logColNames.includes("items_found")) {
    db.exec(`ALTER TABLE scrape_logs ADD COLUMN items_found INTEGER DEFAULT 0;`);
    if (logColNames.includes("offers_found")) {
      db.exec(`UPDATE scrape_logs SET items_found = offers_found;`);
    }
  }
  if (!logColNames.includes("created_at")) {
    db.exec(`ALTER TABLE scrape_logs ADD COLUMN created_at TEXT DEFAULT '';`);
    if (logColNames.includes("executed_at")) {
      db.exec(`UPDATE scrape_logs SET created_at = executed_at;`);
    }
  }
} catch (e) {
  // Ignora caso a tabela esteja sendo inicializada pela primeira vez
}

console.log(`[Database] SQLite inicializado com sucesso em modo WAL: ${dbPath}`);

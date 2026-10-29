import Database, { type Database as DatabaseInstance } from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');

const dbPath = process.env.DATABASE_URL || path.resolve(projectRoot, 'data/quero_comprar.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const sqlite: DatabaseInstance = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// Criação automática de tabelas (Zero-Setup / Out-of-the-box)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Geral',
    target_price REAL NOT NULL,
    priority INTEGER NOT NULL DEFAULT 2,
    negative_keywords TEXT,
    reference_urls TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS price_records (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    store_name TEXT NOT NULL,
    price REAL NOT NULL,
    regular_price REAL,
    shipping_fee REAL DEFAULT 0,
    product_title_found TEXT NOT NULL,
    offer_url TEXT NOT NULL,
    image_url TEXT,
    in_stock INTEGER NOT NULL DEFAULT 1,
    recorded_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS scrape_logs (
    id TEXT PRIMARY KEY,
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    offers_found INTEGER DEFAULT 0,
    duration_ms INTEGER DEFAULT 0,
    error_message TEXT,
    executed_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_price_records_product ON price_records(product_id);
  CREATE INDEX IF NOT EXISTS idx_price_records_recorded_at ON price_records(recorded_at);
`);

export const db = drizzle(sqlite, { schema });

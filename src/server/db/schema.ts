import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').default('Geral').notNull(),
  targetPrice: real('target_price').notNull(),
  priority: integer('priority').notNull().default(2), // 1 = Alta, 2 = Média, 3 = Baixa
  negativeKeywords: text('negative_keywords'), // ex: "capa, case, pelicula, cabo"
  referenceUrls: text('reference_urls'), // URLs customizadas opcionais
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const priceRecords = sqliteTable('price_records', {
  id: text('id').primaryKey(),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  storeName: text('store_name').notNull(),
  price: real('price').notNull(),
  regularPrice: real('regular_price'),
  shippingFee: real('shipping_fee').default(0),
  productTitleFound: text('product_title_found').notNull(),
  offerUrl: text('offer_url').notNull(),
  imageUrl: text('image_url'),
  inStock: integer('in_stock', { mode: 'boolean' }).notNull().default(true),
  recordedAt: text('recorded_at').notNull(),
});

export const scrapeLogs = sqliteTable('scrape_logs', {
  id: text('id').primaryKey(),
  productId: text('product_id').references(() => products.id, { onDelete: 'cascade' }),
  status: text('status').notNull(), // 'success' | 'partial' | 'failed'
  offersFound: integer('offers_found').default(0),
  durationMs: integer('duration_ms').default(0),
  errorMessage: text('error_message'),
  executedAt: text('executed_at').notNull(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type PriceRecord = typeof priceRecords.$inferSelect;
export type NewPriceRecord = typeof priceRecords.$inferInsert;
export type ScrapeLog = typeof scrapeLogs.$inferSelect;

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import path from 'node:path';
import fs from 'node:fs';

import { productsApp } from './routes/products.js';
import { scrapeApp } from './routes/scrape.js';
import { statsApp } from './routes/stats.js';
import { db } from './db/index.js';
import { products } from './db/schema.js';
import { scrapeProduct } from './scrapers/engine.js';
import { eq } from 'drizzle-orm';

const app = new Hono();

// Middlewares
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// Healthcheck
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    system: 'querocomprar',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Rotas da API
const routes = app
  .route('/api/products', productsApp)
  .route('/api/scrape', scrapeApp)
  .route('/api/stats', statsApp);

import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../client');

if (fs.existsSync(clientDistPath)) {
  const relativeRoot = path.relative(process.cwd(), clientDistPath) || '.';
  app.use('/assets/*', serveStatic({ root: relativeRoot }));
  app.get('*', (c, next) => {
    if (c.req.path.startsWith('/api')) {
      return next();
    }
    const indexPath = path.resolve(clientDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return c.html(fs.readFileSync(indexPath, 'utf-8'));
    }
    return c.text('Frontend não encontrado', 404);
  });
}

// Exporta o tipo do roteador para o Hono RPC Client no Frontend
export type AppType = typeof routes;

// Agendador de varredura em segundo plano (executa a cada 8 horas)
const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
setInterval(async () => {
  console.log('[Cron] Iniciando varredura periódica automática de preços...');
  try {
    const activeProducts = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true));

    for (const prod of activeProducts) {
      await scrapeProduct(prod);
      await new Promise((r) => setTimeout(r, 2000));
    }
    console.log(`[Cron] Varredura concluída com sucesso para ${activeProducts.length} itens.`);
  } catch (err) {
    console.error('[Cron] Falha na varredura periódica:', err);
  }
}, EIGHT_HOURS_MS);

// Inicialização do servidor Node.js
const port = Number(process.env.PORT) || 3333;
console.log(`🚀 Servidor Quero Comprar rodando em http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;

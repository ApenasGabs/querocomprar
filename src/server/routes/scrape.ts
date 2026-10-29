import { Hono } from 'hono';
import { streamText } from 'hono/streaming';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { products, scrapeLogs } from '../db/schema.js';
import { scrapeProduct } from '../scrapers/engine.js';

export const scrapeApp = new Hono()
  // Disparar checagem imediata de um produto específico
  .post('/:productId', async (c) => {
    const id = c.req.param('productId');
    const [product] = await db.select().from(products).where(eq(products.id, id));

    if (!product) {
      return c.json({ error: 'Produto não encontrado' }, 404);
    }

    const result = await scrapeProduct(product);
    return c.json(result);
  })

  // Disparar varredura para todos os produtos ativos
  .post('/all', async (c) => {
    const activeProducts = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true));

    // Executa em segundo plano para não dar timeout na requisição
    (async () => {
      for (const prod of activeProducts) {
        try {
          await scrapeProduct(prod);
          // Pausa respeitosa de 2 segundos entre produtos para evitar rate limit
          await new Promise((r) => setTimeout(r, 2000));
        } catch (e) {
          console.error(`Erro ao varrer produto ${prod.title}:`, e);
        }
      }
    })();

    return c.json({
      message: `Varredura disparada em segundo plano para ${activeProducts.length} produtos.`,
      count: activeProducts.length,
    });
  })

  // Streaming SSE (Server-Sent Events) para acompanhar a busca em tempo real
  .get('/stream/:productId', async (c) => {
    const id = c.req.param('productId');
    const [product] = await db.select().from(products).where(eq(products.id, id));

    if (!product) {
      return c.json({ error: 'Produto não encontrado' }, 404);
    }

    return streamText(c, async (stream) => {
      await stream.writeln(
        `data: ${JSON.stringify({ type: 'start', message: `Iniciando busca para ${product.title}...` })}\n\n`
      );

      const result = await scrapeProduct(product, async (msg) => {
        await stream.writeln(`data: ${JSON.stringify({ type: 'progress', message: msg })}\n\n`);
      });

      await stream.writeln(
        `data: ${JSON.stringify({
          type: 'done',
          success: result.success,
          found: result.found,
          message: result.message,
        })}\n\n`
      );
    });
  });

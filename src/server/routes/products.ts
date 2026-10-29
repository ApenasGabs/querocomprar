import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import crypto from 'node:crypto';
import { eq, desc, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { products, priceRecords, type Product } from '../db/schema.js';

export const productSchema = z.object({
  title: z.string().min(2, 'O título deve ter no mínimo 2 caracteres'),
  category: z.string().default('Geral'),
  targetPrice: z.number().positive('O preço alvo deve ser maior que zero'),
  priority: z.number().int().min(1).max(3).default(2), // 1 = Alta, 2 = Média, 3 = Baixa
  negativeKeywords: z.string().optional().nullable(),
  referenceUrls: z.string().optional().nullable(),
});

export const productsApp = new Hono()
  // Listar produtos com métricas agregadas (Menor preço, status, tendência)
  .get('/', async (c) => {
    const allProducts = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(products.priority, desc(products.createdAt));

    const enriched = await Promise.all(
      allProducts.map(async (prod) => {
        const history = await db
          .select()
          .from(priceRecords)
          .where(eq(priceRecords.productId, prod.id))
          .orderBy(desc(priceRecords.recordedAt));

        if (history.length === 0) {
          return {
            ...prod,
            currentPrice: null,
            allTimeLow: null,
            allTimeHigh: null,
            status: 'unknown' as const,
            latestRecord: null,
            sparkline: [],
          };
        }

        const latest = history[0];
        const prices = history.map((h) => h.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        // Classificação do status
        // Tá Barato: Preço atual <= Preço Alvo
        // Estável: Até 10% acima da meta
        // Tá Caro: > 10% acima da meta
        let status: 'cheap' | 'stable' | 'expensive' = 'stable';
        if (latest.price <= prod.targetPrice) {
          status = 'cheap';
        } else if (latest.price > prod.targetPrice * 1.1) {
          status = 'expensive';
        }

        // Últimos 10 registros para a mini sparkline
        const sparkline = history
          .slice(0, 10)
          .reverse()
          .map((h) => ({ date: h.recordedAt.slice(5, 10), price: h.price }));

        return {
          ...prod,
          currentPrice: latest.price,
          allTimeLow: minPrice,
          allTimeHigh: maxPrice,
          status,
          latestRecord: latest,
          sparkline,
        };
      })
    );

    return c.json({ products: enriched });
  })

  // Criar novo produto
  .post('/', zValidator('json', productSchema), async (c) => {
    const data = c.req.valid('json');
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const [newProduct] = await db
      .insert(products)
      .values({
        id,
        title: data.title,
        category: data.category || 'Geral',
        targetPrice: data.targetPrice,
        priority: data.priority ?? 2,
        negativeKeywords: data.negativeKeywords || null,
        referenceUrls: data.referenceUrls || null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return c.json({ product: newProduct }, 201);
  })

  // Detalhes completos do produto com todo o histórico
  .get('/:id', async (c) => {
    const id = c.req.param('id');
    const [prod] = await db.select().from(products).where(eq(products.id, id));

    if (!prod) {
      return c.json({ error: 'Produto não encontrado' }, 404);
    }

    const history = await db
      .select()
      .from(priceRecords)
      .where(eq(priceRecords.productId, id))
      .orderBy(desc(priceRecords.recordedAt));

    const prices = history.map((h) => h.price);
    const minPrice = prices.length ? Math.min(...prices) : null;
    const maxPrice = prices.length ? Math.max(...prices) : null;
    const avgPrice = prices.length
      ? prices.reduce((acc, p) => acc + p, 0) / prices.length
      : null;

    return c.json({
      product: prod,
      metrics: {
        allTimeLow: minPrice,
        allTimeHigh: maxPrice,
        averagePrice: avgPrice,
        totalRecords: history.length,
      },
      history,
    });
  })

  // Atualizar produto
  .put('/:id', zValidator('json', productSchema.partial()), async (c) => {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    const now = new Date().toISOString();

    const [updated] = await db
      .update(products)
      .set({
        ...data,
        updatedAt: now,
      })
      .where(eq(products.id, id))
      .returning();

    if (!updated) {
      return c.json({ error: 'Produto não encontrado' }, 404);
    }

    return c.json({ product: updated });
  })

  // Excluir produto (soft delete ou remoção direta com cascade)
  .delete('/:id', async (c) => {
    const id = c.req.param('id');
    await db.delete(products).where(eq(products.id, id));
    return c.json({ success: true, message: 'Produto removido com sucesso' });
  });

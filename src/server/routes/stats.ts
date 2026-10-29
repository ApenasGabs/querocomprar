import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { products, priceRecords } from '../db/schema.js';

export const statsApp = new Hono().get('/', async (c) => {
  const activeProducts = await db
    .select()
    .from(products)
    .where(eq(products.isActive, true));

  let totalWishlistValue = 0;
  let itemsCheap = 0;
  let potentialSavings = 0;
  let p1Count = 0;
  let p2Count = 0;
  let p3Count = 0;

  for (const prod of activeProducts) {
    if (prod.priority === 1) p1Count++;
    else if (prod.priority === 2) p2Count++;
    else if (prod.priority === 3) p3Count++;

    const history = await db
      .select()
      .from(priceRecords)
      .where(eq(priceRecords.productId, prod.id))
      .orderBy(desc(priceRecords.recordedAt))
      .limit(1);

    if (history.length > 0) {
      const current = history[0].price;
      totalWishlistValue += current;

      if (current <= prod.targetPrice) {
        itemsCheap++;
        potentialSavings += prod.targetPrice - current;
      }
    } else {
      totalWishlistValue += prod.targetPrice;
    }
  }

  return c.json({
    totalWishlistValue,
    itemsCheap,
    potentialSavings: Math.max(0, potentialSavings),
    totalProducts: activeProducts.length,
    priorityBreakdown: {
      p1: p1Count,
      p2: p2Count,
      p3: p3Count,
    },
  });
});

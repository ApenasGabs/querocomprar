import { db } from "../db/database.ts";

export interface ProductMetrics {
  current_price: number | null;
  current_store: string | null;
  current_url: string | null;
  all_time_low: { price: number; store: string; date: string } | null;
  all_time_high: { price: number; store: string; date: string } | null;
  average_price: number | null;
  status: "cheap" | "fair" | "expensive" | "untracked";
  trend: "down" | "up" | "stable";
  diff_from_target: number | null; // valor negativo significa que está abaixo da meta (bom!)
  diff_from_target_pct: number | null;
  sparkline: { price: number; date: string }[];
  total_records: number;
  last_checked: string | null;
}

export interface ProductWithMetrics {
  id: string;
  name: string;
  target_price: number;
  priority: number;
  category: string;
  negative_keywords: string;
  reference_url: string;
  notes: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  metrics: ProductMetrics;
}

export function calculateProductMetrics(productId: string, targetPrice: number): ProductMetrics {
  const records = db
    .prepare(
      `SELECT price, store, url, captured_at 
       FROM price_history 
       WHERE product_id = ? 
       ORDER BY captured_at ASC`
    )
    .all(productId) as { price: number; store: string; url: string; captured_at: string }[];

  if (!records || records.length === 0) {
    return {
      current_price: null,
      current_store: null,
      current_url: null,
      all_time_low: null,
      all_time_high: null,
      average_price: null,
      status: "untracked",
      trend: "stable",
      diff_from_target: null,
      diff_from_target_pct: null,
      sparkline: [],
      total_records: 0,
      last_checked: null,
    };
  }

  // Preço atual é o menor preço da captura mais recente (ou o último preço registrado)
  const latestRecord = records[records.length - 1];
  const currentPrice = latestRecord.price;
  const currentStore = latestRecord.store;
  const currentUrl = latestRecord.url;
  const lastChecked = latestRecord.captured_at;

  // All-time low & high
  let minRecord = records[0];
  let maxRecord = records[0];
  let sum = 0;

  for (const r of records) {
    sum += r.price;
    if (r.price < minRecord.price) minRecord = r;
    if (r.price > maxRecord.price) maxRecord = r;
  }

  const averagePrice = Math.round((sum / records.length) * 100) / 100;

  // Status de compra ("Tá Barato", "Estável", "Tá Caro")
  let status: "cheap" | "fair" | "expensive" | "untracked" = "expensive";
  if (currentPrice <= targetPrice) {
    status = "cheap";
  } else if (currentPrice <= targetPrice * 1.10) {
    status = "fair";
  }

  // Tendência recente (últimos 3 registros vs anteriores)
  let trend: "down" | "up" | "stable" = "stable";
  if (records.length >= 3) {
    const recent = records.slice(-2);
    const older = records.slice(-4, -2);
    if (older.length > 0) {
      const avgRecent = recent.reduce((acc, curr) => acc + curr.price, 0) / recent.length;
      const avgOlder = older.reduce((acc, curr) => acc + curr.price, 0) / older.length;
      if (avgRecent < avgOlder - 2) trend = "down";
      else if (avgRecent > avgOlder + 2) trend = "up";
    }
  }

  const diffFromTarget = currentPrice - targetPrice;
  const diffFromTargetPct = Math.round(((currentPrice - targetPrice) / targetPrice) * 100);

  // Sparkline com até os últimos 15 pontos
  const sparkline = records.slice(-15).map((r) => ({
    price: r.price,
    date: r.captured_at,
  }));

  return {
    current_price: currentPrice,
    current_store: currentStore,
    current_url: currentUrl,
    all_time_low: {
      price: minRecord.price,
      store: minRecord.store,
      date: minRecord.captured_at,
    },
    all_time_high: {
      price: maxRecord.price,
      store: maxRecord.store,
      date: maxRecord.captured_at,
    },
    average_price: averagePrice,
    status,
    trend,
    diff_from_target: diffFromTarget,
    diff_from_target_pct: diffFromTargetPct,
    sparkline,
    total_records: records.length,
    last_checked: lastChecked,
  };
}

export function getSummaryMetrics() {
  const products = db
    .prepare(`SELECT id, name, target_price, priority, category FROM products WHERE is_active = 1`)
    .all() as { id: string; name: string; target_price: number; priority: number; category: string }[];

  let totalWishlistValue = 0;
  let totalTargetValue = 0;
  let cheapCount = 0;
  let fairCount = 0;
  let expensiveCount = 0;
  let untrackedCount = 0;
  let totalSavingsPotential = 0;

  for (const p of products) {
    totalTargetValue += p.target_price;
    const m = calculateProductMetrics(p.id, p.target_price);

    if (m.current_price !== null) {
      totalWishlistValue += m.current_price;
      if (m.average_price && m.current_price < m.average_price) {
        totalSavingsPotential += (m.average_price - m.current_price);
      }
      if (m.status === "cheap") cheapCount++;
      else if (m.status === "fair") fairCount++;
      else if (m.status === "expensive") expensiveCount++;
    } else {
      untrackedCount++;
    }
  }

  return {
    total_products: products.length,
    total_wishlist_value: Math.round(totalWishlistValue * 100) / 100,
    total_target_value: Math.round(totalTargetValue * 100) / 100,
    cheap_count: cheapCount,
    fair_count: fairCount,
    expensive_count: expensiveCount,
    untracked_count: untrackedCount,
    total_savings_potential: Math.round(totalSavingsPotential * 100) / 100,
  };
}

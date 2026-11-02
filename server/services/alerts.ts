import { db } from "../db/database.ts";
import { calculateProductMetrics } from "./analytics.ts";

export interface DashboardAlert {
  id: string;
  type: "target_reached" | "price_drop" | "near_target" | "scrape_issue";
  level: "success" | "info" | "warning" | "error";
  title: string;
  message: string;
  productId?: string;
  productName?: string;
  currentPrice?: number | null;
  targetPrice?: number;
  diffPct?: number | null;
  store?: string | null;
  url?: string | null;
  createdAt: string;
}

export function getDashboardAlerts(): DashboardAlert[] {
  const products = db
    .prepare(`SELECT * FROM products WHERE is_active = 1 ORDER BY priority ASC, created_at DESC`)
    .all() as any[];

  const alerts: DashboardAlert[] = [];

  for (const product of products) {
    const metrics = calculateProductMetrics(product.id, product.target_price);

    // 1. Alerta de Preço Alvo Atingido (Tá Barato!)
    if (metrics.status === "cheap" && metrics.current_price !== null) {
      alerts.push({
        id: `alert-cheap-${product.id}`,
        type: "target_reached",
        level: "success",
        title: `🎯 Preço Alvo Atingido!`,
        message: `${product.name} está custando R$ ${metrics.current_price.toFixed(2)} (meta: R$ ${product.target_price.toFixed(2)}) na loja ${metrics.current_store || "Online"}.`,
        productId: product.id,
        productName: product.name,
        currentPrice: metrics.current_price,
        targetPrice: product.target_price,
        diffPct: metrics.diff_from_target_pct,
        store: metrics.current_store,
        url: metrics.current_url || product.reference_url,
        createdAt: metrics.last_checked || new Date().toISOString(),
      });
    }

    // 2. Alerta de Tendência de Queda
    else if (metrics.trend === "down" && metrics.current_price !== null) {
      alerts.push({
        id: `alert-trend-down-${product.id}`,
        type: "price_drop",
        level: "info",
        title: `📉 Preço em Queda`,
        message: `${product.name} apresentou queda recente para R$ ${metrics.current_price.toFixed(2)} na loja ${metrics.current_store || "Online"}.`,
        productId: product.id,
        productName: product.name,
        currentPrice: metrics.current_price,
        targetPrice: product.target_price,
        diffPct: metrics.diff_from_target_pct,
        store: metrics.current_store,
        url: metrics.current_url || product.reference_url,
        createdAt: metrics.last_checked || new Date().toISOString(),
      });
    }

    // 3. Alerta de Quase Lá (Preço Razoável / até 10% do alvo)
    else if (metrics.status === "fair" && metrics.current_price !== null) {
      alerts.push({
        id: `alert-fair-${product.id}`,
        type: "near_target",
        level: "warning",
        title: `⚡ Próximo do Preço Alvo`,
        message: `${product.name} está a ${metrics.diff_from_target_pct}% do alvo (R$ ${metrics.current_price.toFixed(2)} vs R$ ${product.target_price.toFixed(2)}).`,
        productId: product.id,
        productName: product.name,
        currentPrice: metrics.current_price,
        targetPrice: product.target_price,
        diffPct: metrics.diff_from_target_pct,
        store: metrics.current_store,
        url: metrics.current_url || product.reference_url,
        createdAt: metrics.last_checked || new Date().toISOString(),
      });
    }
  }

  // 4. Checar logs recentes com falhas de scraping
  const errorLogs = db
    .prepare(
      `SELECT sl.*, p.name as product_name 
       FROM scrape_logs sl 
       LEFT JOIN products p ON sl.product_id = p.id 
       WHERE sl.status = 'error' 
       ORDER BY sl.created_at DESC 
       LIMIT 3`
    )
    .all() as any[];

  for (const log of errorLogs) {
    alerts.push({
      id: `alert-log-${log.id}`,
      type: "scrape_issue",
      level: "error",
      title: `⚠️ Atenção no Monitoramento`,
      message: log.product_name
        ? `Falha ao monitorar "${log.product_name}": ${log.message}`
        : `Erro no crawler: ${log.message}`,
      productId: log.product_id || undefined,
      productName: log.product_name || undefined,
      createdAt: log.created_at,
    });
  }

  return alerts;
}

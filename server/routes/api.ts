import express from "express";
import type { Request, Response } from "express";
import crypto from "node:crypto";
import { db } from "../db/database.ts";
import { calculateProductMetrics, getSummaryMetrics } from "../services/analytics.ts";
import { ScraperService } from "../services/scraper.ts";

export const apiRouter = express.Router();

// GET /api/summary - Métricas consolidadas da dashboard
apiRouter.get("/summary", (_req: Request, res: Response) => {
  try {
    const summary = getSummaryMetrics();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: "Erro ao calcular métricas de resumo", details: String(err) });
  }
});

// GET /api/products - Lista produtos com métricas e ordenação por prioridade
apiRouter.get("/products", (req: Request, res: Response) => {
  try {
    const { priority, status, category, search } = req.query;

    let query = `SELECT * FROM products WHERE is_active = 1`;
    const params: any[] = [];

    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }

    if (priority) {
      query += ` AND priority = ?`;
      params.push(Number(priority));
    }

    if (search) {
      query += ` AND name LIKE ?`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY priority ASC, created_at DESC`;

    const products = db.prepare(query).all(...params) as any[];

    // Enriquece com métricas computadas
    let enriched = products.map((p) => {
      const metrics = calculateProductMetrics(p.id, p.target_price);
      return {
        ...p,
        metrics,
      };
    });

    // Filtro adicional por status calculado ("cheap", "fair", "expensive")
    if (status) {
      enriched = enriched.filter((p) => p.metrics.status === status);
    }

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: "Erro ao listar produtos", details: String(err) });
  }
});

// GET /api/products/:id - Detalhes completos do produto com histórico de preços
apiRouter.get("/products/:id", (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id) as any;

    if (!product) {
      res.status(404).json({ error: "Produto não encontrado" });
      return;
    }

    const metrics = calculateProductMetrics(product.id, product.target_price);

    const priceHistory = db
      .prepare(`SELECT * FROM price_history WHERE product_id = ? ORDER BY captured_at DESC`)
      .all(id);

    const logs = db
      .prepare(`SELECT * FROM scrape_logs WHERE product_id = ? ORDER BY created_at DESC LIMIT 10`)
      .all(id);

    res.json({
      ...product,
      metrics,
      price_history: priceHistory,
      logs,
    });
  } catch (err) {
    res.status(500).json({ error: "Erro ao carregar detalhes do produto", details: String(err) });
  }
});

// POST /api/products - Cadastra novo produto
apiRouter.post("/products", async (req: Request, res: Response) => {
  try {
    const { name, target_price, priority, category, negative_keywords, reference_url, notes } = req.body;

    if (!name || !target_price || Number(target_price) <= 0) {
      res.status(400).json({ error: "Nome e preço alvo válido são obrigatórios" });
      return;
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO products (id, name, target_price, priority, category, negative_keywords, reference_url, notes, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(
      id,
      name.trim(),
      Number(target_price),
      Number(priority) || 2,
      category?.trim() || "Geral",
      negative_keywords?.trim() || "",
      reference_url?.trim() || "",
      notes?.trim() || "",
      now,
      now
    );

    // Dispara a primeira checagem em background de forma assíncrona
    ScraperService.scrapeProduct(id).catch((err) =>
      console.warn(`[Scraper] Erro na checagem inicial do produto ${id}:`, err)
    );

    const created = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id) as any;
    const metrics = calculateProductMetrics(id, Number(target_price));

    res.status(201).json({ ...created, metrics });
  } catch (err) {
    res.status(500).json({ error: "Erro ao cadastrar produto", details: String(err) });
  }
});

// PUT /api/products/:id - Atualiza produto
apiRouter.put("/products/:id", (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, target_price, priority, category, negative_keywords, reference_url, notes } = req.body;

    const existing = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id);
    if (!existing) {
      res.status(404).json({ error: "Produto não encontrado" });
      return;
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE products 
      SET name = ?, target_price = ?, priority = ?, category = ?, negative_keywords = ?, reference_url = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `).run(
      name,
      Number(target_price),
      Number(priority),
      category,
      negative_keywords,
      reference_url,
      notes,
      now,
      id
    );

    const updated = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id) as any;
    const metrics = calculateProductMetrics(id, Number(target_price));

    res.json({ ...updated, metrics });
  } catch (err) {
    res.status(500).json({ error: "Erro ao atualizar produto", details: String(err) });
  }
});

// DELETE /api/products/:id - Remove produto
apiRouter.delete("/products/:id", (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    db.prepare(`DELETE FROM products WHERE id = ?`).run(id);
    res.json({ success: true, message: "Produto removido com sucesso" });
  } catch (err) {
    res.status(500).json({ error: "Erro ao remover produto", details: String(err) });
  }
});

// POST /api/products/:id/scrape - Dispara checagem manual imediata de um produto
apiRouter.post("/products/:id/scrape", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const result = await ScraperService.scrapeProduct(id);
    const updated = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id) as any;
    const metrics = calculateProductMetrics(id, updated.target_price);

    res.json({ ...result, product: { ...updated, metrics } });
  } catch (err) {
    res.status(500).json({ error: "Erro ao executar checagem manual", details: String(err) });
  }
});

// POST /api/scrape/all - Dispara checagem em todos os produtos
apiRouter.post("/scrape/all", async (_req: Request, res: Response) => {
  try {
    const result = await ScraperService.scrapeAllActiveProducts();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: "Erro ao executar varredura global", details: String(err) });
  }
});

// GET /api/logs - Retorna histórico recente de scraping
apiRouter.get("/logs", (_req: Request, res: Response) => {
  try {
    const logs = db
      .prepare(`SELECT * FROM scrape_logs ORDER BY created_at DESC LIMIT 30`)
      .all();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar logs", details: String(err) });
  }
});

// POST /api/seed - Popula produtos de demonstração com histórico temporal para testes
apiRouter.post("/seed", (_req: Request, res: Response) => {
  try {
    const existing = db.prepare("SELECT count(*) as count FROM products").get() as { count: number };
    if (existing.count > 0) {
      res.json({ message: "O banco já possui produtos cadastrados.", count: existing.count });
      return;
    }

    const sampleProducts = [
      {
        name: "PlayStation 5 Slim Edição Digital 1TB",
        target_price: 3300.0,
        priority: 1, // Alta
        category: "Games",
        negative_keywords: "capa, case, suporte, adesivo, cabo, controle, jogo",
        history: [
          { daysAgo: 14, price: 3899.0, store: "Amazon" },
          { daysAgo: 10, price: 3749.0, store: "KaBuM!" },
          { daysAgo: 7, price: 3650.0, store: "Magazine Luiza" },
          { daysAgo: 4, price: 3499.0, store: "Mercado Livre" },
          { daysAgo: 1, price: 3199.9, store: "Amazon" }, // Tá Barato! (< 3300)
        ],
      },
      {
        name: "Teclado Mecânico Sem Fio Keychron K3 V2",
        target_price: 550.0,
        priority: 1, // Alta
        category: "Periféricos",
        negative_keywords: "switch, keycap, cabo, lubrificante, case, capa",
        history: [
          { daysAgo: 20, price: 680.0, store: "AliExpress" },
          { daysAgo: 12, price: 620.0, store: "Mercado Livre" },
          { daysAgo: 6, price: 590.0, store: "Amazon" },
          { daysAgo: 2, price: 540.0, store: "Mercado Livre" }, // Tá Barato! (< 550)
        ],
      },
      {
        name: "Monitor Gamer LG UltraGear 27' IPS 144Hz 1ms",
        target_price: 950.0,
        priority: 2, // Média
        category: "Monitores",
        negative_keywords: "suporte articulado, cabo displayport, pelicula, tela de reposicao",
        history: [
          { daysAgo: 25, price: 1199.0, store: "KaBuM!" },
          { daysAgo: 18, price: 1089.0, store: "Pichau" },
          { daysAgo: 9, price: 1049.0, store: "Amazon" },
          { daysAgo: 2, price: 999.0, store: "KaBuM!" }, // Estável / Próximo
        ],
      },
      {
        name: "Fone Sony WH-1000XM5 Noise Cancelling",
        target_price: 1800.0,
        priority: 3, // Longo Prazo
        category: "Áudio",
        negative_keywords: "almofada, earpads, case, cabo, suporte",
        history: [
          { daysAgo: 30, price: 2199.0, store: "Amazon" },
          { daysAgo: 15, price: 2299.0, store: "Mercado Livre" },
          { daysAgo: 5, price: 2350.0, store: "Sony Store" },
          { daysAgo: 1, price: 2289.0, store: "Amazon" }, // Tá Caro! (> 1800)
        ],
      },
    ];

    const insertProd = db.prepare(`
      INSERT INTO products (id, name, target_price, priority, category, negative_keywords, reference_url, notes, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, '', 'Seed inicial de demonstração', 1, ?, ?)
    `);

    const insertPrice = db.prepare(`
      INSERT INTO price_history (id, product_id, price, regular_price, store, title, url, image_url, in_stock, captured_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, '', 1, ?)
    `);

    const now = Date.now();

    for (const p of sampleProducts) {
      const pId = crypto.randomUUID();
      const createdAt = new Date(now - 30 * 86400000).toISOString();
      insertProd.run(pId, p.name, p.target_price, p.priority, p.category, p.negative_keywords, createdAt, createdAt);

      for (const h of p.history) {
        const date = new Date(now - h.daysAgo * 86400000).toISOString();
        insertPrice.run(
          crypto.randomUUID(),
          pId,
          h.price,
          h.price * 1.15,
          h.store,
          `${p.name} - Loja Oficial`,
          `https://www.google.com/search?q=${encodeURIComponent(p.name)}`,
          date
        );
      }
    }

    res.json({ success: true, message: "Seed de demonstração inserido com sucesso!", count: sampleProducts.length });
  } catch (err) {
    res.status(500).json({ error: "Erro ao gerar seed", details: String(err) });
  }
});

import * as cheerio from 'cheerio';
import crypto from 'node:crypto';
import { db } from '../db/index.js';
import { priceRecords, scrapeLogs, type Product } from '../db/schema.js';
import { validateOffer, type OfferCandidate } from './antiOutliers.js';

export interface ScrapeProgressCallback {
  (step: string, details?: Record<string, unknown>): void;
}

export function parsePrice(text: string): number | null {
  if (!text) return null;
  // Limpar prefixos e manter números, vírgula e pontos
  const clean = text.replace(/[^\d.,]/g, '').trim();
  if (!clean) return null;

  // Se tiver formato brasileiro (ex: 1.234,56 ou 199,90)
  if (clean.includes(',')) {
    const normalized = clean.replace(/\./g, '').replace(',', '.');
    const val = parseFloat(normalized);
    return isNaN(val) ? null : val;
  }

  const val = parseFloat(clean);
  return isNaN(val) ? null : val;
}

export async function scrapeProduct(
  product: Product,
  onProgress?: ScrapeProgressCallback
): Promise<{ success: boolean; found: number; message: string }> {
  const startTime = Date.now();
  onProgress?.(`Iniciando busca para "${product.title}"...`);

  const query = encodeURIComponent(product.title);
  const searchUrl = `https://www.google.com/search?tbm=shop&hl=pt-BR&gl=br&q=${query}`;

  try {
    onProgress?.(`Consultando catálogo online...`);
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!response.ok) {
      throw new Error(`Falha HTTP ao consultar lojas: status ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const rawOffers: OfferCandidate[] = [];

    // Seletores de itens do Google Shopping
    $('.sh-dgr__content, .sh-pr__product-results-grid div, .KZmu8e').each((_, el) => {
      const item = $(el);
      const title =
        item.find('h3, .tAxDx, .translate-content').first().text().trim() ||
        item.find('a').first().text().trim();
      const priceText = item.find('.a8Pemb, .OFFNJ, span[aria-label*="R$"]').first().text().trim();
      const store =
        item.find('.aULzUe, .IuHnof, .eaLbxf').first().text().trim() || 'Loja Online';
      const link = item.find('a[href*="/url?"], a[href^="http"]').first().attr('href') || '';
      const img = item.find('img').first().attr('src') || '';

      const price = parsePrice(priceText);

      if (title && price && price > 0) {
        rawOffers.push({
          storeName: store.replace(/^De\s+/i, '').trim(),
          price,
          productTitleFound: title,
          offerUrl: link.startsWith('/url?q=')
            ? decodeURIComponent(link.split('/url?q=')[1].split('&')[0])
            : link,
          imageUrl: img || undefined,
        });
      }
    });

    onProgress?.(`Encontradas ${rawOffers.length} ofertas brutas. Filtrando falsos-positivos...`);

    const validOffers: OfferCandidate[] = [];
    for (const offer of rawOffers) {
      const validation = validateOffer(offer, {
        productTitle: product.title,
        targetPrice: product.targetPrice,
        negativeKeywords: product.negativeKeywords,
      });

      if (validation.isValid) {
        validOffers.push(offer);
      }
    }

    // Salvar no banco SQLite
    const now = new Date().toISOString();
    for (const offer of validOffers) {
      await db.insert(priceRecords).values({
        id: crypto.randomUUID(),
        productId: product.id,
        storeName: offer.storeName,
        price: offer.price,
        regularPrice: offer.regularPrice || null,
        shippingFee: 0,
        productTitleFound: offer.productTitleFound,
        offerUrl: offer.offerUrl,
        imageUrl: offer.imageUrl || null,
        inStock: true,
        recordedAt: now,
      });
    }

    const duration = Date.now() - startTime;
    await db.insert(scrapeLogs).values({
      id: crypto.randomUUID(),
      productId: product.id,
      status: validOffers.length > 0 ? 'success' : 'partial',
      offersFound: validOffers.length,
      durationMs: duration,
      errorMessage: validOffers.length === 0 ? 'Nenhuma oferta válida após filtro anti-outlier.' : null,
      executedAt: now,
    });

    const msg = `Sucesso: ${validOffers.length} ofertas salvas (${rawOffers.length - validOffers.length} descartadas por filtros).`;
    onProgress?.(msg);
    return { success: true, found: validOffers.length, message: msg };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const duration = Date.now() - startTime;

    await db.insert(scrapeLogs).values({
      id: crypto.randomUUID(),
      productId: product.id,
      status: 'failed',
      offersFound: 0,
      durationMs: duration,
      errorMessage: errorMsg,
      executedAt: new Date().toISOString(),
    });

    onProgress?.(`Erro durante a varredura: ${errorMsg}`);
    return { success: false, found: 0, message: errorMsg };
  }
}

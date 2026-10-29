export interface AntiOutlierOptions {
  productTitle: string;
  targetPrice: number;
  negativeKeywords?: string | null;
}

export interface OfferCandidate {
  storeName: string;
  price: number;
  regularPrice?: number;
  productTitleFound: string;
  offerUrl: string;
  imageUrl?: string;
}

const DEFAULT_NEGATIVE_KEYWORDS = [
  'capa',
  'case',
  'pelicula',
  'cabo',
  'suporte',
  'adaptador',
  'adesivo',
  'protetor',
  'manual',
  'caixa vazia',
  'defeito',
  'sucata',
  'para pecas',
  'apenas a caixa'
];

/**
 * Valida se uma oferta encontrada é legítima ou se é um acessório/falso-positivo.
 */
export function validateOffer(
  offer: OfferCandidate,
  options: AntiOutlierOptions
): { isValid: boolean; reason?: string } {
  const foundTitleLower = offer.productTitleFound.toLowerCase();
  
  // 1. Checagem de palavras negativas customizadas do produto + padrões globais
  const customNegatives = (options.negativeKeywords || '')
    .split(',')
    .map(k => k.trim().toLowerCase())
    .filter(Boolean);
  
  const allNegatives = [...DEFAULT_NEGATIVE_KEYWORDS, ...customNegatives];
  
  for (const keyword of allNegatives) {
    // Regex de palavra inteira ou limite
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(foundTitleLower)) {
      return {
        isValid: false,
        reason: `Contém palavra negativa descartada: "${keyword}"`,
      };
    }
  }

  // 2. Checagem de threshold de preço (Preço suspeito < 35% da meta)
  // Ex: Buscar iPhone de R$ 4.000 e achar algo por R$ 60 é quase certeza de acessório
  if (options.targetPrice > 100 && offer.price < options.targetPrice * 0.35) {
    return {
      isValid: false,
      reason: `Preço (R$ ${offer.price}) muito abaixo do alvo (R$ ${options.targetPrice}) - possível acessório/outlier.`,
    };
  }

  // 3. Checagem de palavras-chave principais do título do produto
  const keywords = options.productTitle
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .split(/\s+/)
    .filter(k => k.length > 2);

  // Pelo menos 50% das palavras chave do produto devem estar no anúncio encontrado
  if (keywords.length > 0) {
    const matchedCount = keywords.filter(k => foundTitleLower.includes(k)).length;
    const matchRatio = matchedCount / keywords.length;
    if (matchRatio < 0.4) {
      return {
        isValid: false,
        reason: `Baixa correspondência de palavras-chave (${Math.round(matchRatio * 100)}% de match).`,
      };
    }
  }

  return { isValid: true };
}

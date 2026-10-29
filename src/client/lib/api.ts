import { hc } from 'hono/client';
import type { AppType } from '../../server/index.js';

export const api = hc<AppType>('/');

export interface ProductItem {
  id: string;
  title: string;
  category: string;
  targetPrice: number;
  priority: number;
  negativeKeywords?: string | null;
  referenceUrls?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  currentPrice: number | null;
  allTimeLow: number | null;
  allTimeHigh: number | null;
  status: 'cheap' | 'stable' | 'expensive' | 'unknown';
  latestRecord?: {
    id: string;
    storeName: string;
    price: number;
    offerUrl: string;
    productTitleFound: string;
    imageUrl?: string | null;
    recordedAt: string;
  } | null;
  sparkline: { date: string; price: number }[];
}

export interface StatsData {
  totalWishlistValue: number;
  itemsCheap: number;
  potentialSavings: number;
  totalProducts: number;
  priorityBreakdown: {
    p1: number;
    p2: number;
    p3: number;
  };
}

export interface ProductDetailData {
  product: ProductItem;
  metrics: {
    allTimeLow: number | null;
    allTimeHigh: number | null;
    averagePrice: number | null;
    totalRecords: number;
  };
  history: Array<{
    id: string;
    storeName: string;
    price: number;
    regularPrice?: number | null;
    shippingFee: number;
    productTitleFound: string;
    offerUrl: string;
    imageUrl?: string | null;
    inStock: boolean;
    recordedAt: string;
  }>;
}

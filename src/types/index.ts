export interface SparklinePoint {
  price: number;
  date: string;
}

export interface ExtremePrice {
  price: number;
  store: string;
  date: string;
}

export interface ProductMetrics {
  current_price: number | null;
  current_store: string | null;
  current_url: string | null;
  all_time_low: ExtremePrice | null;
  all_time_high: ExtremePrice | null;
  average_price: number | null;
  status: "cheap" | "fair" | "expensive" | "untracked";
  trend: "down" | "up" | "stable";
  diff_from_target: number | null;
  diff_from_target_pct: number | null;
  sparkline: SparklinePoint[];
  total_records: number;
  last_checked: string | null;
}

export interface Product {
  id: string;
  name: string;
  target_price: number;
  priority: 1 | 2 | 3;
  category: string;
  negative_keywords: string;
  reference_url: string;
  notes: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  metrics: ProductMetrics;
}

export interface PriceRecord {
  id: string;
  product_id: string;
  price: number;
  regular_price: number | null;
  store: string;
  title: string;
  url: string;
  image_url: string;
  in_stock: number;
  captured_at: string;
}

export interface ScrapeLog {
  id: string;
  product_id: string | null;
  status: "success" | "warning" | "error";
  message: string;
  items_found: number;
  created_at: string;
}

export interface ProductDetail extends Product {
  price_history: PriceRecord[];
  logs: ScrapeLog[];
}

export interface SummaryMetrics {
  total_products: number;
  total_wishlist_value: number;
  total_target_value: number;
  cheap_count: number;
  fair_count: number;
  expensive_count: number;
  untracked_count: number;
  total_savings_potential: number;
}

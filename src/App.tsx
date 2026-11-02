import React, { useState, useEffect } from "react";
import { Header } from "./components/Header.tsx";
import { StatsCards } from "./components/StatsCards.tsx";
import { DashboardAlerts } from "./components/DashboardAlerts.tsx";
import { ProductCard } from "./components/ProductCard.tsx";
import { ProductModal } from "./components/ProductModal.tsx";
import { ProductDetailModal } from "./components/ProductDetailModal.tsx";
import { Button, Badge } from "./components/ui/index.ts";
import {
  Filter,
  Plus,
  RefreshCw,
  Sparkles,
  Database,
  Flame,
  Layers,
} from "lucide-react";
import type { Product, SummaryMetrics, DashboardAlert } from "./types/index.ts";

export const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<SummaryMetrics | null>(null);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | 1 | 2 | 3>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "cheap" | "fair" | "expensive">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Estados de Scraping
  const [isScrapingAll, setIsScrapingAll] = useState(false);
  const [scrapingId, setScrapingId] = useState<string | null>(null);

  // Carrega produtos, sumário e alertas da Dashboard
  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, sumRes, alertsRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/summary"),
        fetch("/api/alerts"),
      ]);

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
      }
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData);
      }
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.alerts || []);
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Salvar Produto (Novo ou Edição)
  const handleSaveProduct = async (data: any) => {
    const url = productToEdit ? `/api/products/${productToEdit.id}` : "/api/products";
    const method = productToEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao salvar produto");
    }

    await loadData();
    setIsModalOpen(false);
    setProductToEdit(null);
  };

  // Excluir Produto
  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este produto da sua wishlist?")) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadData();
        if (selectedProduct?.id === id) {
          setIsDetailOpen(false);
        }
      }
    } catch (err) {
      console.error("Erro ao excluir produto:", err);
    }
  };

  // Checagem manual de 1 produto
  const handleScrapeSingle = async (id: string) => {
    try {
      setScrapingId(id);
      const res = await fetch(`/api/products/${id}/scrape`, { method: "POST" });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error("Erro ao raspar produto:", err);
    } finally {
      setScrapingId(null);
    }
  };

  // Checagem manual de todos os produtos
  const handleScrapeAll = async () => {
    try {
      setIsScrapingAll(true);
      const res = await fetch("/api/scrape/all", { method: "POST" });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error("Erro na varredura global:", err);
    } finally {
      setIsScrapingAll(false);
    }
  };

  // Gerar dados de demonstração
  const handleSeed = async () => {
    try {
      setLoading(true);
      await fetch("/api/seed", { method: "POST" });
      await loadData();
    } catch (err) {
      console.error("Erro ao gerar seed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Categorias únicas existentes
  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  );

  // Filtragem dos produtos
  const filteredProducts = products.filter((p) => {
    // Busca por texto
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchCat = p.category?.toLowerCase().includes(q);
      if (!matchName && !matchCat) return false;
    }

    // Filtro por Prioridade
    if (priorityFilter !== "all" && p.priority !== priorityFilter) {
      return false;
    }

    // Filtro por Status ("cheap", "fair", "expensive")
    if (statusFilter !== "all" && p.metrics.status !== statusFilter) {
      return false;
    }

    // Filtro por Categoria
    if (categoryFilter !== "all" && p.category !== categoryFilter) {
      return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Header */}
      <Header
        search={search}
        onSearchChange={setSearch}
        onOpenNewModal={() => {
          setProductToEdit(null);
          setIsModalOpen(true);
        }}
        onScrapeAll={handleScrapeAll}
        isScrapingAll={isScrapingAll}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner de Estatísticas Resumidas */}
        <div className="mb-8">
          <StatsCards summary={summary} />
        </div>

        {/* Alertas Exclusivos na Dashboard */}
        <DashboardAlerts
          alerts={alerts}
          onSelectProductById={(id) => {
            const found = products.find((p) => p.id === id);
            if (found) {
              setSelectedProduct(found);
              setIsDetailOpen(true);
            }
          }}
        />

        {/* Barra de Filtros e Controles */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/80">
          {/* Tabs de Prioridade */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Prioridade:
            </span>

            <button
              onClick={() => setPriorityFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                priorityFilter === "all"
                  ? "bg-slate-800 text-slate-100 border border-slate-700 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Todos ({products.length})
            </button>

            <button
              onClick={() => setPriorityFilter(1)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                priorityFilter === 1
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold"
                  : "text-slate-400 hover:text-rose-400"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              P1 Alta
            </button>

            <button
              onClick={() => setPriorityFilter(2)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                priorityFilter === 2
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold"
                  : "text-slate-400 hover:text-amber-400"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              P2 Média
            </button>

            <button
              onClick={() => setPriorityFilter(3)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                priorityFilter === 3
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold"
                  : "text-slate-400 hover:text-blue-400"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              P3 Longo Prazo
            </button>
          </div>

          {/* Status & Categorias */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            {/* Status Pills */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-2.5 py-1 rounded-md text-xs transition ${
                  statusFilter === "all"
                    ? "bg-slate-800 text-slate-200 font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Todos
              </button>

              <button
                onClick={() => setStatusFilter("cheap")}
                className={`px-2.5 py-1 rounded-md text-xs transition flex items-center gap-1 ${
                  statusFilter === "cheap"
                    ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30"
                    : "text-slate-400 hover:text-emerald-400"
                }`}
              >
                <Sparkles className="w-3 h-3" />
                Tá Barato
              </button>

              <button
                onClick={() => setStatusFilter("fair")}
                className={`px-2.5 py-1 rounded-md text-xs transition ${
                  statusFilter === "fair"
                    ? "bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30"
                    : "text-slate-400 hover:text-blue-400"
                }`}
              >
                Estável
              </button>

              <button
                onClick={() => setStatusFilter("expensive")}
                className={`px-2.5 py-1 rounded-md text-xs transition ${
                  statusFilter === "expensive"
                    ? "bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30"
                    : "text-slate-400 hover:text-rose-400"
                }`}
              >
                Tá Caro
              </button>
            </div>

            {/* Categoria Select */}
            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Todas Categorias</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Lista de Produtos (Grid) */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
            <p className="text-sm text-slate-400">Carregando seus desejos e cotações...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onViewDetails={(prod) => {
                  setSelectedProduct(prod);
                  setIsDetailOpen(true);
                }}
                onEdit={(prod) => {
                  setProductToEdit(prod);
                  setIsModalOpen(true);
                }}
                onDelete={handleDeleteProduct}
                onScrape={handleScrapeSingle}
                isScraping={scrapingId === p.id}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-200">
                Nenhum produto encontrado
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                {products.length === 0
                  ? "Sua lista está vazia. Cadastre o primeiro item que você quer comprar ou gere dados de demonstração para testar o sistema."
                  : "Nenhum produto corresponde aos filtros selecionados. Tente ajustar a busca ou as opções de prioridade."}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setProductToEdit(null);
                  setIsModalOpen(true);
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-none font-bold gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Desejo
              </Button>

              {products.length === 0 && (
                <Button
                  variant="ghost"
                  size="md"
                  onClick={handleSeed}
                  className="border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold gap-1.5"
                >
                  <Database className="w-4 h-4 text-teal-400" />
                  Carregar Dados de Exemplo
                </Button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>Quero Comprar • Sistema Autônomo para Homelab • Gabriel Rodrigues</p>
      </footer>

      {/* Modais */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setProductToEdit(null);
        }}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
      />

      <ProductDetailModal
        product={selectedProduct}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedProduct(null);
        }}
        onScrape={handleScrapeSingle}
        isScraping={scrapingId === selectedProduct?.id}
      />
    </div>
  );
};

export default App;

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.js';
import { KpiCards } from './components/KpiCards.js';
import { ProductCard } from './components/ProductCard.js';
import { ProductDetailModal } from './components/ProductDetailModal.js';
import { AddProductModal } from './components/AddProductModal.js';
import { Search, Flame, AlertCircle, ShoppingBag, Filter } from 'lucide-react';
import type { ProductItem, StatsData } from './lib/api.js';

export const App: React.FC = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'cheap' | 'p1'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<ProductItem | null>(null);
  const [isScrapingAll, setIsScrapingAll] = useState(false);

  const fetchData = async () => {
    try {
      const [prodRes, statsRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/stats'),
      ]);

      if (prodRes.ok) {
        const pData = await prodRes.json();
        setProducts(pData.products || []);
      }
      if (statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData);
      }
    } catch (e) {
      console.error('Falha ao carregar dados:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleScrapeProduct = async (id: string) => {
    try {
      await fetch(`/api/scrape/${id}`, { method: 'POST' });
      await fetchData();
    } catch (e) {
      console.error('Erro ao verificar produto:', e);
    }
  };

  const handleScrapeAll = async () => {
    setIsScrapingAll(true);
    try {
      await fetch('/api/scrape/all', { method: 'POST' });
      // Aguardar alguns segundos para refletir primeiras capturas e atualizar
      setTimeout(fetchData, 4000);
    } catch (e) {
      console.error('Erro na varredura geral:', e);
    } finally {
      setIsScrapingAll(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (e) {
      console.error('Erro ao excluir produto:', e);
    }
  };

  const handleProductCreated = async (newProduct: ProductItem) => {
    await fetchData();
    // Dispara a primeira busca automática do item recém-cadastrado
    handleScrapeProduct(newProduct.id);
  };

  // Categorias disponíveis
  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

  // Filtros aplicados
  const filteredProducts = products.filter((p) => {
    // Busca por texto
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    // Filtro por abas
    if (activeTab === 'cheap' && p.status !== 'cheap') return false;
    if (activeTab === 'p1' && p.priority !== 1) return false;

    // Filtro por categoria
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        onOpenAddModal={() => setIsAddOpen(true)}
        onScrapeAll={handleScrapeAll}
        isScrapingAll={isScrapingAll}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards de Resumo */}
        <KpiCards stats={stats} loading={loading} />

        {/* Barra de Filtros e Busca */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Abas Rápidas */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({products.length})
            </button>

            <button
              onClick={() => setActiveTab('cheap')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'cheap'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>Tá Barato! ({products.filter((p) => p.status === 'cheap').length})</span>
            </button>

            <button
              onClick={() => setActiveTab('p1')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'p1'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Alta Prioridade ({products.filter((p) => p.priority === 1).length})</span>
            </button>
          </div>

          {/* Busca e Categoria */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Todas Categorias</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar por nome..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Grid de Produtos */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 mt-3 font-medium">Carregando lista de desejos...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenDetails={(p) => setDetailProduct(p)}
                onScrapeNow={handleScrapeProduct}
                onDelete={handleDeleteProduct}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Nenhum produto encontrado</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              {search || activeTab !== 'all' || selectedCategory !== 'all'
                ? 'Nenhum item corresponde aos filtros selecionados. Tente limpar os filtros.'
                : 'Você ainda não cadastrou nenhum produto para monitoramento de preços.'}
            </p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
            >
              Adicionar Primeiro Item
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-400">
        <p>Quero Comprar · Sistema Local Autônomo de Monitoramento de Preços para Homelab</p>
      </footer>

      {/* Modais */}
      <AddProductModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onProductCreated={handleProductCreated}
      />

      <ProductDetailModal
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        onScrapeNow={handleScrapeProduct}
      />
    </div>
  );
};

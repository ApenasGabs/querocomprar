import React from 'react';
import { ShoppingBag, Plus, RefreshCw, Server } from 'lucide-react';

interface NavbarProps {
  onOpenAddModal: () => void;
  onScrapeAll: () => void;
  isScrapingAll: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAddModal,
  onScrapeAll,
  isScrapingAll,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Quero Comprar</h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Server className="w-3 h-3" />
                Homelab
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Wishlist autônoma & monitoramento de oscilação
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onScrapeAll}
            disabled={isScrapingAll}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
            title="Atualizar preços de todos os produtos ativos"
          >
            <RefreshCw className={`w-4 h-4 ${isScrapingAll ? 'animate-spin text-emerald-600' : ''}`} />
            <span className="hidden md:inline">
              {isScrapingAll ? 'Verificando Lojas...' : 'Varredura Geral'}
            </span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors shadow-sm shadow-emerald-200"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Item</span>
          </button>
        </div>
      </div>
    </header>
  );
};

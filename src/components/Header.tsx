import React from "react";
import { ShoppingCart, Search, RefreshCw, Plus, Sparkles } from "lucide-react";

interface HeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  onOpenNewModal: () => void;
  onScrapeAll: () => void;
  isScrapingAll: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  search,
  onSearchChange,
  onOpenNewModal,
  onScrapeAll,
  isScrapingAll,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-bold">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                Quero Comprar
              </h1>
              <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-2 py-0.5">
                Homelab
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Wishlist com prioridade e monitoramento inteligente de preços
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md relative hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome do produto ou categoria..."
            className="w-full bg-slate-950/60 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onScrapeAll}
            disabled={isScrapingAll}
            title="Buscar preços em todas as lojas agora"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScrapingAll ? "animate-spin text-emerald-400" : ""}`} />
            <span className="hidden sm:inline">
              {isScrapingAll ? "Verificando Lojas..." : "Verificar Todos"}
            </span>
          </button>

          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Novo Desejo</span>
          </button>
        </div>
      </div>
    </header>
  );
};

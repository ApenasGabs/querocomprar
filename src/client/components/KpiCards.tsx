import React from 'react';
import { DollarSign, Flame, TrendingDown, AlertCircle } from 'lucide-react';
import { formatBRL } from '../lib/utils.js';
import type { StatsData } from '../lib/api.js';

interface KpiCardsProps {
  stats: StatsData | null;
  loading: boolean;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ stats, loading }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Wishlist */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total da Wishlist
          </p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">
            {loading ? 'Carregando...' : formatBRL(stats?.totalWishlistValue)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {stats?.totalProducts ?? 0} produtos monitorados
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
          <DollarSign className="w-6 h-6" />
        </div>
      </div>

      {/* Oportunidades / Tá Barato */}
      <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm flex items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500" />
        <div>
          <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 fill-emerald-500" />
            Oportunidades (Tá Barato!)
          </p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">
            {loading ? '--' : stats?.itemsCheap ?? 0}
          </h3>
          <p className="text-xs text-emerald-700 font-medium mt-1">
            Itens no preço alvo ou abaixo
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <Flame className="w-6 h-6 fill-emerald-500" />
        </div>
      </div>

      {/* Economia Potencial */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Economia Estimada
          </p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">
            {loading ? 'Carregando...' : formatBRL(stats?.potentialSavings)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Desconto vs. sua meta máxima
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <TrendingDown className="w-6 h-6" />
        </div>
      </div>

      {/* Prioridade Alta (P1) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Alta Prioridade (P1)
          </p>
          <h3 className="text-2xl font-bold text-rose-600 mt-1">
            {loading ? '--' : stats?.priorityBreakdown.p1 ?? 0}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {stats?.priorityBreakdown.p2 ?? 0} em P2 · {stats?.priorityBreakdown.p3 ?? 0} em P3
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

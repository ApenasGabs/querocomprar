import React from "react";
import { DollarSign, Flame, TrendingDown, Target, Package } from "lucide-react";
import type { SummaryMetrics } from "../types/index.ts";

interface StatsCardsProps {
  summary: SummaryMetrics | null;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ summary }) => {
  if (!summary) return null;

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Wishlist */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-medium text-slate-400">Total da Wishlist</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">
            {formatBRL(summary.total_wishlist_value)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Meta: {formatBRL(summary.total_target_value)}
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
          <DollarSign className="w-6 h-6" />
        </div>
      </div>

      {/* Tá Barato! */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-medium text-slate-400">Em Oportunidade</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-400">
              {summary.cheap_count}
            </span>
            <span className="text-xs text-slate-400">
              {summary.cheap_count === 1 ? "item barato" : "itens baratos"}
            </span>
          </div>
          <p className="text-[11px] text-emerald-500/80 font-medium mt-0.5">
            Abaixo ou igual à sua meta 🎯
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
          <Flame className="w-6 h-6" />
        </div>
      </div>

      {/* Economia Potencial */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-medium text-slate-400">Economia Potencial</p>
          <p className="text-2xl font-bold text-teal-400 mt-1">
            {formatBRL(summary.total_savings_potential)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Diferença do preço médio
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
          <TrendingDown className="w-6 h-6" />
        </div>
      </div>

      {/* Desejos Monitorados */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-medium text-slate-400">Total Monitorado</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">
            {summary.total_products}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {summary.fair_count} estáveis • {summary.expensive_count} caros
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
          <Package className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

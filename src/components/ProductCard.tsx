import React from "react";
import {
  ExternalLink,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Minus,
  Sparkles,
  BarChart2,
  Trash2,
  Edit,
  Store,
} from "lucide-react";
import { Sparkline } from "./Sparkline.tsx";
import type { Product } from "../types/index.ts";

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onScrape: (productId: string) => void;
  isScraping: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewDetails,
  onEdit,
  onDelete,
  onScrape,
  isScraping,
}) => {
  const { metrics } = product;

  const formatBRL = (val: number | null) => {
    if (val === null || val === undefined) return "---";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  // Badges de Prioridade
  const priorityConfig = {
    1: { label: "P1 • Alta Prioridade", bg: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
    2: { label: "P2 • Média Prioridade", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    3: { label: "P3 • Desejo Longo Prazo", bg: "bg-slate-700/30 text-slate-400 border-slate-700" },
  }[product.priority] || { label: `P${product.priority}`, bg: "bg-slate-800 text-slate-300 border-slate-700" };

  // Badges de Status de Compra
  const statusConfig = {
    cheap: {
      label: "Tá Barato!",
      badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      desc: "Abaixo da meta",
    },
    fair: {
      label: "Preço Estável",
      badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      desc: "Próximo à meta",
    },
    expensive: {
      label: "Tá Caro",
      badge: "bg-rose-500/15 text-rose-400 border-rose-500/30",
      desc: "Acima da meta",
    },
    untracked: {
      label: "Não Monitorado",
      badge: "bg-slate-800 text-slate-400 border-slate-700",
      desc: "Sem dados",
    },
  }[metrics.status];

  return (
    <div className="bg-slate-900/60 border border-slate-800/90 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-md group">
      {/* Top Header do Card: Prioridade + Status */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`text-[11px] font-semibold border rounded-md px-2 py-0.5 ${priorityConfig.bg}`}
          >
            {priorityConfig.label}
          </span>
          <span
            className={`text-[11px] font-bold border rounded-md px-2.5 py-0.5 flex items-center gap-1 ${statusConfig.badge}`}
          >
            {metrics.status === "cheap" && <Sparkles className="w-3 h-3" />}
            {statusConfig.label}
          </span>
        </div>

        {/* Título & Categoria */}
        <div className="mb-4">
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
            {product.category || "Geral"}
          </span>
          <h3
            onClick={() => onViewDetails(product)}
            className="text-base font-semibold text-slate-100 hover:text-emerald-400 cursor-pointer transition line-clamp-2 mt-0.5"
            title={product.name}
          >
            {product.name}
          </h3>
        </div>

        {/* Bloco de Preços: Atual vs Alvo */}
        <div className="bg-slate-950/60 border border-slate-800/70 rounded-lg p-3 mb-4">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                Menor Preço Hoje
              </p>
              <p className="text-xl font-extrabold text-slate-100">
                {metrics.current_price ? formatBRL(metrics.current_price) : "R$ ---"}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                Sua Meta
              </p>
              <p className="text-sm font-semibold text-slate-300">
                {formatBRL(product.target_price)}
              </p>
            </div>
          </div>

          {/* Diferença da meta */}
          {metrics.current_price && (
            <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
              <span className="text-slate-400">Variação da Meta:</span>
              <span
                className={`font-semibold flex items-center gap-0.5 ${
                  metrics.diff_from_target! <= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {metrics.diff_from_target! <= 0 ? (
                  <>
                    <TrendingDown className="w-3.5 h-3.5" />
                    {formatBRL(Math.abs(metrics.diff_from_target!))} abaixo!
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-3.5 h-3.5" />
                    +{formatBRL(metrics.diff_from_target!)}
                  </>
                )}
              </span>
            </div>
          )}

          {/* Loja do menor preço */}
          {metrics.current_store && (
            <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 text-slate-500">
                <Store className="w-3 h-3" />
                Loja:
              </span>
              <span className="font-medium text-slate-300">
                {metrics.current_store}
              </span>
            </div>
          )}
        </div>

        {/* Sparkline de Tendência */}
        <div className="mb-4 flex items-center justify-between px-1">
          <div className="text-xs text-slate-400">
            <span className="text-[11px] block text-slate-500">Tendência recente</span>
            <span className="font-medium flex items-center gap-1">
              {metrics.trend === "down" && (
                <span className="text-emerald-400 flex items-center gap-0.5">
                  <TrendingDown className="w-3 h-3" /> Caindo
                </span>
              )}
              {metrics.trend === "up" && (
                <span className="text-rose-400 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> Subindo
                </span>
              )}
              {metrics.trend === "stable" && (
                <span className="text-slate-400 flex items-center gap-0.5">
                  <Minus className="w-3 h-3" /> Estável
                </span>
              )}
            </span>
          </div>

          <Sparkline
            data={metrics.sparkline}
            trend={metrics.trend}
            width={110}
            height={32}
          />
        </div>
      </div>

      {/* Footer com Ações */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onViewDetails(product)}
            className="flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-emerald-400 bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700/60 transition"
            title="Ver gráfico temporal e histórico completo"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Histórico</span>
          </button>

          <button
            onClick={() => onScrape(product.id)}
            disabled={isScraping}
            className="text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800 p-1.5 rounded-lg border border-slate-700/40 transition disabled:opacity-50"
            title="Verificar preços deste produto agora"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {metrics.current_url && (
            <a
              href={metrics.current_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-medium text-slate-950 bg-emerald-500 hover:bg-emerald-400 px-2.5 py-1.5 rounded-lg shadow-sm transition"
            >
              <span>Ir à Loja</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          <button
            onClick={() => onEdit(product)}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
            title="Editar configurações"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDelete(product.id)}
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
            title="Excluir produto"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

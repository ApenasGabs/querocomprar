import React, { useState } from 'react';
import {
  ExternalLink,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Flame,
  Clock,
  Trash2,
} from 'lucide-react';
import { formatBRL, formatDate } from '../lib/utils.js';
import { Sparkline } from './Sparkline.js';
import type { ProductItem } from '../lib/api.js';

interface ProductCardProps {
  product: ProductItem;
  onOpenDetails: (product: ProductItem) => void;
  onScrapeNow: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenDetails,
  onScrapeNow,
  onDelete,
}) => {
  const [isScraping, setIsScraping] = useState(false);

  const handleScrapeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsScraping(true);
    try {
      await onScrapeNow(product.id);
    } finally {
      setIsScraping(false);
    }
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Deseja realmente remover "${product.title}" do monitoramento?`)) {
      await onDelete(product.id);
    }
  };

  // Badge de Prioridade
  const priorityConfig = {
    1: { label: 'P1 · Urgente', class: 'bg-rose-50 text-rose-700 border-rose-200' },
    2: { label: 'P2 · Média', class: 'bg-amber-50 text-amber-700 border-amber-200' },
    3: { label: 'P3 · Desejo', class: 'bg-slate-50 text-slate-700 border-slate-200' },
  }[product.priority] || { label: 'P2', class: 'bg-slate-50 text-slate-700 border-slate-200' };

  // Status de Preço
  const statusBadge = {
    cheap: {
      label: 'Tá Barato! 🔥',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold',
      icon: Flame,
    },
    stable: {
      label: 'Preço Estável',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Clock,
    },
    expensive: {
      label: 'Tá Caro',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: AlertTriangle,
    },
    unknown: {
      label: 'Sem cotação',
      bg: 'bg-slate-100 text-slate-600 border-slate-200',
      icon: Clock,
    },
  }[product.status];

  const StatusIcon = statusBadge.icon;

  return (
    <div
      onClick={() => onOpenDetails(product)}
      className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between group"
    >
      <div>
        {/* Top Header: Categoria, Prioridade e Delete */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              {product.category}
            </span>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${priorityConfig.class}`}
            >
              {priorityConfig.label}
            </span>
          </div>

          <button
            onClick={handleDeleteClick}
            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-1 rounded"
            title="Excluir produto"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Título do Produto */}
        <h3 className="text-base font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
          {product.title}
        </h3>

        {/* Preços e Badge de Status */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-xs text-slate-400">Preço Alvo</p>
              <p className="text-sm font-semibold text-slate-700">
                {formatBRL(product.targetPrice)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-slate-400">Menor Hoje</p>
              <p
                className={`text-xl font-bold ${
                  product.status === 'cheap' ? 'text-emerald-600' : 'text-slate-900'
                }`}
              >
                {product.currentPrice ? formatBRL(product.currentPrice) : 'R$ --,--'}
              </p>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border ${statusBadge.bg}`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {statusBadge.label}
            </span>

            {/* Sparkline */}
            <Sparkline data={product.sparkline} status={product.status} />
          </div>
        </div>

        {/* Informações da Loja Encontrada */}
        {product.latestRecord && (
          <div className="mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
            <div className="truncate mr-2">
              <span className="text-slate-500 font-medium">Loja: </span>
              <span className="text-slate-800 font-semibold">{product.latestRecord.storeName}</span>
              <p className="text-[10px] text-slate-400 truncate">
                {product.latestRecord.productTitleFound}
              </p>
            </div>
            <a
              href={product.latestRecord.offerUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium whitespace-nowrap bg-white px-2 py-1 rounded border border-slate-200 hover:border-emerald-300"
            >
              <span>Ver</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      {/* Footer com Ações */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span>Atualizado: {formatDate(product.latestRecord?.recordedAt || product.updatedAt)}</span>

        <button
          onClick={handleScrapeClick}
          disabled={isScraping}
          className="inline-flex items-center gap-1 text-slate-600 hover:text-emerald-700 font-medium p-1 hover:bg-slate-100 rounded transition-colors disabled:opacity-50"
          title="Verificar preços agora neste item"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? 'animate-spin text-emerald-600' : ''}`} />
          <span>{isScraping ? 'Buscando...' : 'Checar'}</span>
        </button>
      </div>
    </div>
  );
};

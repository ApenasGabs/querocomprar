import React, { useEffect, useState } from 'react';
import {
  X,
  TrendingDown,
  TrendingUp,
  Scale,
  ExternalLink,
  RefreshCw,
  Calendar,
  Store,
  Flame,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { formatBRL, formatDate } from '../lib/utils.js';
import type { ProductItem, ProductDetailData } from '../lib/api.js';

interface ProductDetailModalProps {
  product: ProductItem | null;
  onClose: () => void;
  onScrapeNow: (id: string) => Promise<void>;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onScrapeNow,
}) => {
  const [data, setData] = useState<ProductDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);

  const fetchDetails = async () => {
    if (!product) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Erro ao carregar detalhes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [product]);

  if (!product) return null;

  const handleScrape = async () => {
    setIsScraping(true);
    try {
      await onScrapeNow(product.id);
      await fetchDetails();
    } finally {
      setIsScraping(false);
    }
  };

  // Prepara dados para o gráfico do Recharts (ordenado cronologicamente)
  const chartData = (data?.history || [])
    .slice()
    .reverse()
    .map((h) => ({
      date: new Date(h.recordedAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
      dateTime: formatDate(h.recordedAt),
      price: h.price,
      store: h.storeName,
    }));

  const currentPrice = data?.history[0]?.price ?? product.currentPrice;
  const isCheap = currentPrice && currentPrice <= product.targetPrice;
  const diff = currentPrice ? Math.abs(currentPrice - product.targetPrice) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header do Modal */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between sticky top-0 bg-white z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {product.category}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Prioridade {product.priority}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{product.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Banner de Status de Oportunidade */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
              isCheap
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              {isCheap && <Flame className="w-6 h-6 text-emerald-600 fill-emerald-500 shrink-0" />}
              <div>
                <p className="font-semibold text-sm">
                  {isCheap
                    ? `Oportunidade! O preço atual está ${formatBRL(diff)} abaixo da sua meta.`
                    : currentPrice
                    ? `Faltam ${formatBRL(diff)} para atingir a meta estipulada de ${formatBRL(
                        product.targetPrice
                      )}.`
                    : 'Ainda não encontramos cotações válidas para este produto.'}
                </p>
                <p className="text-xs opacity-75 mt-0.5">
                  Preço Alvo Desejado: <span className="font-bold">{formatBRL(product.targetPrice)}</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleScrape}
              disabled={isScraping}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-colors whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? 'animate-spin text-emerald-600' : ''}`} />
              <span>{isScraping ? 'Verificando...' : 'Verificar Agora'}</span>
            </button>
          </div>

          {/* Cards de Métricas Históricas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* All-Time Low */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <TrendingDown className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Menor Preço Histórico
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {formatBRL(data?.metrics.allTimeLow)}
              </p>
              <p className="text-xs text-slate-500 mt-1">All-Time Low (Menor já visto)</p>
            </div>

            {/* All-Time High */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-rose-600 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Maior Preço Histórico
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {formatBRL(data?.metrics.allTimeHigh)}
              </p>
              <p className="text-xs text-slate-500 mt-1">All-Time High (Pico registrado)</p>
            </div>

            {/* Preço Médio */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Scale className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Preço Médio
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {formatBRL(data?.metrics.averagePrice)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Com base em {data?.metrics.totalRecords ?? 0} cotações
              </p>
            </div>
          </div>

          {/* Gráfico Histórico de Preços (Recharts) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
              <span>Evolução Histórica do Preço</span>
              <span className="text-xs font-normal text-slate-500">
                Linha tracejada verde indica sua meta (Preço Alvo)
              </span>
            </h3>

            {chartData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={12}
                      tickFormatter={(val) => `R$ ${val}`}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      formatter={(val: number) => [formatBRL(val), 'Preço']}
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.dateTime || 'Data da Cotação'
                      }
                    />
                    {/* Linha de Referência da Meta */}
                    <ReferenceLine
                      y={product.targetPrice}
                      label={{
                        value: `Meta: ${formatBRL(product.targetPrice)}`,
                        fill: '#10b981',
                        fontSize: 11,
                        position: 'insideTopRight',
                      }}
                      stroke="#10b981"
                      strokeDasharray="4 4"
                      strokeWidth={2}
                    />
                    {/* Linha de Preço Real */}
                    <Line
                      type="monotone"
                      dataKey="price"
                      name="Preço"
                      stroke="#0284c7"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#0284c7' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
                Nenhum registro histórico suficiente para gerar o gráfico temporal.
              </div>
            )}
          </div>

          {/* Tabela de Histórico Completo de Cotações */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                Todas as Cotações Registradas
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/75 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Data/Hora</th>
                    <th className="py-2.5 px-4">Loja</th>
                    <th className="py-2.5 px-4">Título Encontrado</th>
                    <th className="py-2.5 px-4 text-right">Preço</th>
                    <th className="py-2.5 px-4 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data?.history || []).map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(h.recordedAt)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {h.storeName}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={h.productTitleFound}>
                        {h.productTitleFound}
                      </td>
                      <td className="py-3 px-4 font-bold text-right text-slate-900 whitespace-nowrap">
                        {formatBRL(h.price)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <a
                          href={h.offerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium px-2 py-1 rounded bg-slate-100 hover:bg-emerald-50 transition-colors"
                        >
                          <span>Abrir</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                  {(!data?.history || data.history.length === 0) && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Nenhuma cotação registrada ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

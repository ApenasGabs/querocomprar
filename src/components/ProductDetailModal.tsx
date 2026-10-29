import React, { useState, useEffect } from "react";
import {
  X,
  ExternalLink,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Store,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { Product, ProductDetail } from "../types/index.ts";

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onScrape: (productId: string) => Promise<void>;
  isScraping: boolean;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onScrape,
  isScraping,
}) => {
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDetail = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDetail(data);
      }
    } catch (err) {
      console.error("Erro ao carregar detalhes do produto:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && product) {
      fetchDetail(product.id);
    } else {
      setDetail(null);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const formatBRL = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "R$ ---";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Prepara dados para o Recharts
  const chartData = (detail?.price_history || [])
    .slice()
    .reverse()
    .map((record) => {
      const d = new Date(record.captured_at);
      return {
        date: `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}h`,
        fullDate: formatDate(record.captured_at),
        price: record.price,
        store: record.store,
      };
    });

  const metrics = detail?.metrics || product.metrics;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-900/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                {product.category}
              </span>
              <span className="text-[10px] font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                Prioridade P{product.priority}
              </span>
              {metrics.status === "cheap" && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Tá Barato!
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-100">{product.name}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onScrape(product.id).then(() => fetchDetail(product.id))}
              disabled={isScraping}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
              title="Buscar preços agora"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? "animate-spin text-emerald-400" : ""}`} />
              <span className="hidden sm:inline">Verificar Agora</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* 4 Cards de Estatísticas e Extremos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Menor Preço Já Visto (All-Time Low) */}
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400">
                  Menor Preço Já Visto
                </span>
                <TrendingDown className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xl font-black text-emerald-300 mt-1">
                {metrics.all_time_low ? formatBRL(metrics.all_time_low.price) : "---"}
              </p>
              {metrics.all_time_low && (
                <div className="text-[11px] text-slate-400 mt-1 flex flex-col gap-0.5">
                  <span className="truncate">Loja: <b>{metrics.all_time_low.store}</b></span>
                  <span>{formatDate(metrics.all_time_low.date).split(" ")[0]}</span>
                </div>
              )}
            </div>

            {/* Maior Preço Já Visto (All-Time High) */}
            <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-400">
                  Maior Preço Já Visto
                </span>
                <TrendingUp className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-xl font-black text-rose-300 mt-1">
                {metrics.all_time_high ? formatBRL(metrics.all_time_high.price) : "---"}
              </p>
              {metrics.all_time_high && (
                <div className="text-[11px] text-slate-400 mt-1 flex flex-col gap-0.5">
                  <span className="truncate">Loja: <b>{metrics.all_time_high.store}</b></span>
                  <span>{formatDate(metrics.all_time_high.date).split(" ")[0]}</span>
                </div>
              )}
            </div>

            {/* Meta Desejada */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Sua Meta Desejada
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  Alvo
                </span>
              </div>
              <p className="text-xl font-black text-slate-100 mt-1">
                {formatBRL(product.target_price)}
              </p>
              <div className="text-[11px] text-slate-400 mt-1">
                {metrics.diff_from_target !== null && (
                  <span
                    className={`font-semibold ${
                      metrics.diff_from_target <= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {metrics.diff_from_target <= 0
                      ? `${formatBRL(Math.abs(metrics.diff_from_target))} abaixo da meta!`
                      : `${formatBRL(metrics.diff_from_target)} acima da meta`}
                  </span>
                )}
              </div>
            </div>

            {/* Preço Médio */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Preço Médio
                </span>
                <Clock className="w-4 h-4 text-slate-500" />
              </div>
              <p className="text-xl font-black text-slate-100 mt-1">
                {metrics.average_price ? formatBRL(metrics.average_price) : "---"}
              </p>
              <div className="text-[11px] text-slate-400 mt-1">
                Baseado em {metrics.total_records} registros
              </div>
            </div>
          </div>

          {/* Gráfico Histórico Temporal (Recharts) */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200">
                  Histórico de Oscilação de Preços
                </h3>
                <p className="text-xs text-slate-400">
                  Evolução ao longo do tempo comparada com a sua Meta Desejada
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-emerald-500 inline-block"></span>
                  <span>Meta (R$ {product.target_price})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-blue-400 inline-block"></span>
                  <span>Preço Coletado</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickFormatter={(val) => `R$ ${val}`}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1">
                              <p className="text-slate-400 font-medium">{data.fullDate}</p>
                              <p className="text-base font-bold text-emerald-400">
                                {formatBRL(data.price)}
                              </p>
                              <p className="text-slate-300">
                                Loja: <span className="font-semibold text-white">{data.store}</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {/* Linha tracejada da meta do usuário */}
                    <ReferenceLine
                      y={product.target_price}
                      stroke="#10b981"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                    />
                    {/* Linha de preços registrados */}
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#38bdf8"
                      strokeWidth={2.5}
                      dot={{ fill: "#38bdf8", r: 4 }}
                      activeDot={{ r: 6, fill: "#10b981" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  Nenhum dado histórico registrado ainda. Clique em "Verificar Agora" para coletar.
                </div>
              )}
            </div>
          </div>

          {/* Tabela de Ofertas / Lojas Encontradas */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200">
                Histórico de Ofertas por Loja
              </h3>
              <span className="text-xs text-slate-400">
                {detail?.price_history.length || 0} registros
              </span>
            </div>

            <div className="overflow-x-auto max-h-60">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[10px] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4">Loja</th>
                    <th className="py-2.5 px-4">Preço</th>
                    <th className="py-2.5 px-4">Título do Anúncio</th>
                    <th className="py-2.5 px-4">Data da Captura</th>
                    <th className="py-2.5 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {detail?.price_history && detail.price_history.length > 0 ? (
                    detail.price_history.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-2.5 px-4 font-semibold text-slate-100 flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-slate-500" />
                          {record.store}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-emerald-400">
                          {formatBRL(record.price)}
                        </td>
                        <td className="py-2.5 px-4 max-w-xs truncate text-slate-400" title={record.title}>
                          {record.title}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500">
                          {formatDate(record.captured_at)}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {record.url && (
                            <a
                              href={record.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition"
                            >
                              <span>Acessar</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">
                        Nenhuma oferta registrada ainda.
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

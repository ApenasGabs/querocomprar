import React from 'react';

interface SparklineProps {
  data: { date: string; price: number }[];
  status?: 'cheap' | 'stable' | 'expensive' | 'unknown';
}

export const Sparkline: React.FC<SparklineProps> = ({ data, status }) => {
  if (!data || data.length < 2) {
    return (
      <div className="h-7 flex items-center justify-center text-[10px] text-slate-400">
        Dados insuficientes
      </div>
    );
  }

  const prices = data.map((d) => d.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const width = 120;
  const height = 28;
  const padding = 3;

  const points = data
    .map((d, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
      // Inverte o Y porque no SVG o topo é zero
      const y = height - padding - ((d.price - min) / range) * (height - 2 * padding);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  // Determinar cor da linha
  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const isDown = lastPrice <= firstPrice;

  const strokeColor =
    status === 'cheap' || isDown ? '#10b981' : status === 'expensive' ? '#ef4444' : '#64748b';

  return (
    <div className="flex items-center gap-1.5" title="Tendência recente de preço">
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {/* Ponto final (preço mais recente) */}
        {data.length > 0 && (
          <circle
            cx={points.split(' ').pop()?.split(',')[0]}
            cy={points.split(' ').pop()?.split(',')[1]}
            r="3"
            fill={strokeColor}
          />
        )}
      </svg>
    </div>
  );
};

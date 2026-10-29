import React from "react";
import type { SparklinePoint } from "../types/index.ts";

interface SparklineProps {
  data: SparklinePoint[];
  width?: number;
  height?: number;
  trend?: "down" | "up" | "stable";
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 120,
  height = 36,
  trend = "stable",
}) => {
  if (!data || data.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-[10px] text-slate-500 bg-slate-900/50 rounded px-2"
        style={{ width, height }}
      >
        Aguardando dados
      </div>
    );
  }

  const prices = data.map((d) => d.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const padding = 4;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * innerWidth;
    const y = height - padding - ((d.price - min) / range) * innerHeight;
    return `${x},${y}`;
  });

  const polylinePoints = points.join(" ");

  // Cor baseada na tendência: queda de preço é verde (bom!), alta é vermelha (caro!)
  let strokeColor = "#3b82f6"; // azul estável
  if (trend === "down") strokeColor = "#10b981"; // verde (barateando)
  if (trend === "up") strokeColor = "#ef4444"; // vermelho (encarecendo)

  return (
    <div className="relative group" title={`Min: R$ ${min.toFixed(2)} | Max: R$ ${max.toFixed(2)}`}>
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polylinePoints}
        />
        {/* Ponto atual */}
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].split(",")[0]}
            cy={points[points.length - 1].split(",")[1]}
            r="3"
            fill={strokeColor}
            className="animate-pulse"
          />
        )}
      </svg>
    </div>
  );
};

import React, { useState } from "react";
import { Bell, CheckCircle2, AlertTriangle, TrendingDown, ExternalLink, X, ChevronDown, ChevronUp } from "lucide-react";
import { Alert, Badge, Button } from "./ui/index.ts";
import type { DashboardAlert, Product } from "../types/index.ts";

interface DashboardAlertsProps {
  alerts: DashboardAlert[];
  onSelectProductById?: (productId: string) => void;
}

export const DashboardAlerts: React.FC<DashboardAlertsProps> = ({
  alerts,
  onSelectProductById,
}) => {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  const activeAlerts = alerts.filter((a) => !dismissedIds.includes(a.id));

  if (activeAlerts.length === 0) {
    return null;
  }

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds((prev) => [...prev, id]);
  };

  const getAlertIcon = (type: DashboardAlert["type"], level: DashboardAlert["level"]) => {
    switch (level) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      case "info":
        return <TrendingDown className="w-5 h-5 text-sky-400 shrink-0" />;
      case "error":
      default:
        return <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />;
    }
  };

  return (
    <section className="mb-8" aria-label="Alertas da Dashboard">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Bell className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold tracking-tight text-slate-200">
            Alertas da Dashboard
          </h2>
          <Badge variant="primary" size="sm" className="bg-emerald-500 text-slate-950 font-bold">
            {activeAlerts.length}
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="xs"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-slate-400 hover:text-slate-200 gap-1"
        >
          {isExpanded ? (
            <>
              <span>Recolher</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <span>Expandir ({activeAlerts.length})</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-2.5">
          {activeAlerts.map((alert) => (
            <Alert
              key={alert.id}
              type={alert.level}
              icon={getAlertIcon(alert.type, alert.level)}
              className="bg-slate-900/90 border border-slate-800 shadow-md transition hover:border-slate-700"
              action={
                <div className="flex items-center gap-1.5 ml-2">
                  {alert.productId && onSelectProductById && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => onSelectProductById(alert.productId!)}
                      className="text-xs font-semibold text-slate-300 hover:text-white"
                    >
                      Ver Detalhes
                    </Button>
                  )}
                  {alert.url && (
                    <a
                      href={alert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-xs text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
                    >
                      <span>Ir à Loja</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    onClick={(e) => handleDismiss(alert.id, e)}
                    title="Dispensar alerta da dashboard"
                    className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              }
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-100">{alert.title}</span>
                <span className="text-slate-300 text-xs sm:text-sm">{alert.message}</span>
              </div>
            </Alert>
          ))}
        </div>
      )}
    </section>
  );
};

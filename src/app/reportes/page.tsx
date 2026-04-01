"use client";

import { BarChart3, TrendingUp, DollarSign, Package, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type ReportsSummary = {
  ingresosTotalesCop: number;
  volumenImportadoLb: number;
  margenPromedioPercent: number;
  ingresosTrendPercent: number;
  volumenTrendPercent: number;
};

export default function Page() {
  const [data, setData] = useState<ReportsSummary>({
    ingresosTotalesCop: 0,
    volumenImportadoLb: 0,
    margenPromedioPercent: 0,
    ingresosTrendPercent: 0,
    volumenTrendPercent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<ReportsSummary>("/reports")
      .then((res) => {
        if (cancelled) return;
        setError(null);
        setData(res);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const message = typeof e === "object" && e !== null && "message" in e ? String((e as { message: unknown }).message) : "Error cargando reportes";
        setError(message);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const formatCop = (value: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl brand-icon-bg">
            <BarChart3 className="h-6 w-6 brand-icon-fg" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Reportes</h2>
            <p className="text-slate-500 dark:text-slate-400">Análisis y métricas de rendimiento</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm cursor-pointer">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span>Últimos 30 días</span>
        </div>
      </div>

      {error ? <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Card 1 */}
        <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Ingresos Totales</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{loading ? "-" : formatCop(data.ingresosTotalesCop)}</p>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-2 rounded-full bg-emerald-500" style={{ width: "0%" }}></div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">{loading ? "" : `${data.ingresosTrendPercent}% vs mes anterior`}</p>
        </div>

        {/* Card 2 */}
        <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <Package className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Volumen Importado</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{loading ? "-" : `${data.volumenImportadoLb.toFixed(1)} lb`}</p>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-2 rounded-full bg-blue-500" style={{ width: "0%" }}></div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">{loading ? "" : `${data.volumenTrendPercent}% vs mes anterior`}</p>
        </div>

        {/* Card 3 */}
        <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl brand-icon-bg">
              <TrendingUp className="h-5 w-5 brand-icon-fg" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Margen Promedio</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{loading ? "-" : `${data.margenPromedioPercent}%`}</p>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-2 rounded-full bg-yellow-500" style={{ width: "0%" }}></div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">0</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
          <BarChart3 className="h-12 w-12 text-slate-200 dark:text-slate-700 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Gráfico de Ventas Mensuales</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">El módulo de gráficos se implementará en la siguiente fase.</p>
        </div>
        <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
          <Package className="h-12 w-12 text-slate-200 dark:text-slate-700 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Categorías más vendidas</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">El módulo de gráficos se implementará en la siguiente fase.</p>
        </div>
      </div>
    </div>
  );
}

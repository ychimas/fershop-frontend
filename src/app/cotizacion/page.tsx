'use client';

import { FileText, Copy } from "lucide-react";
import { useMemo, useState } from "react";

type Quote = {
  createdAt: string;
  precioVentaCop: number;
  gananciaCop: number;
  anticipoPercent: number;
  anticipoCop: number;
  saldoCop: number;
  capitalPropioCop: number;
  trmCopPorUsd: number | null;
};

const formatearCop = (valor: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
};

export default function Page() {
  const [quote] = useState<Quote | null>(() => {
    try {
      const raw = window.sessionStorage.getItem("fershop_quote");
      if (!raw) return null;
      return JSON.parse(raw) as Quote;
    } catch {
      return null;
    }
  });

  const copyText = useMemo(() => {
    if (!quote) return "";
    return [
      `Cotización - FerShop`,
      `Precio venta: ${formatearCop(quote.precioVentaCop)}`,
      `Anticipo (${quote.anticipoPercent.toFixed(2)}%): ${formatearCop(quote.anticipoCop)}`,
      `Saldo: ${formatearCop(quote.saldoCop)}`,
    ].join("\n");
  }, [quote]);

  const onCopy = async () => {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
    } catch { }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto pt-14 md:pt-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl brand-icon-bg shrink-0">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 brand-icon-fg" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Cotización</h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Resumen para compartir con el cliente</p>
          </div>
        </div>

        <button
          onClick={onCopy}
          disabled={!quote}
          className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors ${quote ? "brand-solid" : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed"
            }`}
        >
          <Copy className="h-4 w-4" />
          Copiar
        </button>
      </div>

      {!quote ? (
        <div className="rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400">
            No hay una cotización guardada. Ve a Calculadora y usa “Copiar cotización”.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="rounded-2xl bg-[#1A1F2C] p-5 sm:p-6 text-white">
            <p className="text-[10px] sm:text-xs font-bold tracking-wider text-slate-400 mb-2 uppercase">Precio de venta</p>
            <p className="text-2xl sm:text-3xl font-bold brand-accent-text break-all">{formatearCop(quote.precioVentaCop)}</p>
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-5">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Anticipo</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{formatearCop(quote.anticipoCop)}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{quote.anticipoPercent.toFixed(2)}% sobre la venta</p>
            </div>
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-5">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Saldo</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{formatearCop(quote.saldoCop)}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Pendiente por pagar</p>
            </div>
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
            <div className="flex justify-between items-center rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <span className="text-sm text-slate-500 dark:text-slate-400">Ganancia</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatearCop(quote.gananciaCop)}</span>
            </div>
            <div className="flex justify-between items-center rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <span className="text-sm text-slate-500 dark:text-slate-400">Capital propio</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatearCop(quote.capitalPropioCop)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-400 dark:text-slate-500">
            <span>{new Date(quote.createdAt).toLocaleString("es-CO")}</span>
            <span>{quote.trmCopPorUsd ? `TRM: ${quote.trmCopPorUsd}` : ""}</span>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { Calculator, RotateCcw, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const roundTo = (value: number, decimals: number) => {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const computeAnticipoCopFromPercent = (precioVentaCop: number, percent: number) => {
  return roundTo(precioVentaCop * (percent / 100), 2);
};

const computeAnticipoPercentFromCop = (precioVentaCop: number, cop: number) => {
  if (!precioVentaCop) return 0;
  return roundTo((cop / precioVentaCop) * 100, 2);
};

type ExtraItem = {
  id: string;
  name: string;
  op: "add" | "subtract";
  amountUsd: number | null;
};

const createEmptyItem = (): ExtraItem => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  name: "",
  op: "add",
  amountUsd: null,
});

export default function Page() {
  const router = useRouter();

  const [precioUsdNeto, setPrecioUsdNeto] = useState<number | null>(null);
  const [taxUsaPercent, setTaxUsaPercent] = useState<number | null>(null);
  const [envioCasilleroUsd, setEnvioCasilleroUsd] = useState<number | null>(null);
  const [items, setItems] = useState<ExtraItem[]>([createEmptyItem()]);

  const [trmCopPorUsd, setTrmCopPorUsd] = useState<number | null>(null);
  const [costosLocalesCop, setCostosLocalesCop] = useState<number | null>(null);
  const [margenDeseadoPercent, setMargenDeseadoPercent] = useState<number | null>(null);
  const [precioVentaMode, setPrecioVentaMode] = useState<"auto" | "manual">("auto");
  const [precioVentaCopManual, setPrecioVentaCopManual] = useState<number | null>(null);

  const [anticipoMode, setAnticipoMode] = useState<"percent" | "amount">("percent");
  const [anticipoPercentInput, setAnticipoPercentInput] = useState<number | null>(null);
  const [anticipoCopInput, setAnticipoCopInput] = useState<number | null>(null);

  const precioUsdNetoN = precioUsdNeto ?? 0;
  const taxUsaPercentN = taxUsaPercent ?? 0;
  const envioCasilleroUsdN = envioCasilleroUsd ?? 0;
  const trmCopPorUsdN = trmCopPorUsd ?? 0;
  const costosLocalesCopN = costosLocalesCop ?? 0;
  const margenDeseadoPercentN = margenDeseadoPercent ?? 0;

  const hasCoreInput =
    precioUsdNeto !== null ||
    envioCasilleroUsd !== null ||
    items.some((i) => i.amountUsd !== null && i.amountUsd !== 0) ||
    (precioVentaMode === "manual" && (precioVentaCopManual ?? 0) > 0);

  const precioConTaxUsd = roundTo(precioUsdNetoN * (1 + taxUsaPercentN / 100), 2);
  const extrasUsd = roundTo(
    items.reduce((acc, item) => {
      const amount = item.amountUsd ?? 0;
      if (!amount) return acc;
      return acc + (item.op === "add" ? amount : -amount);
    }, 0),
    2,
  );
  const costoTotalUsd = roundTo(precioConTaxUsd + envioCasilleroUsdN + extrasUsd, 2);
  const costoEnCop = roundTo(costoTotalUsd * trmCopPorUsdN, 2);
  const costoRealTotalCop = roundTo(costoEnCop + costosLocalesCopN, 2);

  const margen = Math.min(Math.max(margenDeseadoPercentN / 100, 0), 0.9999);
  const precioVentaCopAuto = roundTo(costoRealTotalCop / (1 - margen), 2);
  const precioVentaCop =
    precioVentaMode === "manual" && (precioVentaCopManual ?? 0) > 0 ? (precioVentaCopManual ?? 0) : precioVentaCopAuto;
  const gananciaCop = roundTo(precioVentaCop - costoRealTotalCop, 2);
  const margenRealSobreVenta = precioVentaCop ? roundTo((gananciaCop / precioVentaCop) * 100, 2) : 0;

  const anticipoPercentDefault = 50;
  const anticipoPercentInputN = anticipoPercentInput ?? anticipoPercentDefault;
  const anticipoCopInputN = anticipoCopInput ?? 0;

  const anticipoPercent =
    anticipoMode === "percent"
      ? anticipoPercentInputN
      : computeAnticipoPercentFromCop(precioVentaCop, anticipoCopInputN);
  const anticipoCop =
    anticipoMode === "amount"
      ? anticipoCopInputN
      : computeAnticipoCopFromPercent(precioVentaCop, anticipoPercentInputN);

  const capitalPropioCop = roundTo(Math.max(costoRealTotalCop - anticipoCop, 0), 2);
  const percentCapitalPropioSobreCosto = costoRealTotalCop
    ? roundTo((capitalPropioCop / costoRealTotalCop) * 100, 2)
    : 0;
  const markupSobreCosto = costoRealTotalCop ? roundTo((gananciaCop / costoRealTotalCop) * 100, 2) : 0;
  const roiSobreMiCapital = capitalPropioCop ? roundTo((gananciaCop / capitalPropioCop) * 100, 2) : 0;

  const canQuote = precioVentaCop > 0 && hasCoreInput;

  const handleLimpiar = () => {
    setPrecioUsdNeto(null);
    setTaxUsaPercent(null);
    setEnvioCasilleroUsd(null);
    setItems([createEmptyItem()]);
    setTrmCopPorUsd(null);
    setCostosLocalesCop(null);
    setMargenDeseadoPercent(null);
    setPrecioVentaMode("auto");
    setPrecioVentaCopManual(null);
    setAnticipoMode("percent");
    setAnticipoPercentInput(null);
    setAnticipoCopInput(null);
  };

  const formatearCop = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor);
  };

  const formatearUsd = (valor: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor);
  };

  const goToCotizacion = async () => {
    if (!canQuote) return;

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("fershop_quote_price", JSON.stringify({ precioVentaCop }));
    }

    router.push("/cotizacion");
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12 pt-14 md:pt-0">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl brand-icon-bg shrink-0">
          <Calculator className="h-5 w-5 sm:h-6 sm:w-6 brand-icon-fg" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Calculadora de Precios</h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Cotiza productos de EE.UU para venta en Colombia</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 sm:mb-6">Datos del producto</h3>
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Precio_USD (neto)</label>
                <input
                  type="number"
                  value={precioUsdNeto ?? ""}
                  onChange={(e) => setPrecioUsdNeto(e.target.value === "" ? null : Number(e.target.value))}
                  onBlur={() => {
                    if (precioUsdNeto === null) return;
                    setPrecioUsdNeto(roundTo(precioUsdNeto, 2));
                  }}
                  placeholder="75.00"
                  className="w-full rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white"
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Anticipo cliente % sobre venta</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={
                        anticipoMode === "percent"
                          ? (anticipoPercentInput ?? "")
                          : (hasCoreInput && precioVentaCop ? anticipoPercent.toFixed(2) : "")
                      }
                      onChange={(e) => {
                        setAnticipoMode("percent");
                        setAnticipoPercentInput(e.target.value === "" ? null : Number(e.target.value));
                      }}
                      onBlur={() => {
                        if (anticipoMode !== "percent") return;
                        if (anticipoPercentInput === null) setAnticipoPercentInput(50);
                      }}
                      className="w-full rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 pr-10 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Anticipo cliente (COP)</label>
                  <input
                    type="number"
                    value={anticipoMode === "amount" ? (anticipoCopInput ?? "") : (hasCoreInput && precioVentaCop ? anticipoCop.toFixed(0) : "")}
                    onChange={(e) => {
                      setAnticipoMode("amount");
                      setAnticipoCopInput(e.target.value === "" ? null : Number(e.target.value));
                    }}
                    onBlur={() => {
                      if (anticipoMode !== "amount") return;
                      if (anticipoCopInput === null) setAnticipoCopInput(0);
                    }}
                    className="w-full rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tax_USA_%</label>
                <input
                  type="number"
                  value={taxUsaPercent ?? ""}
                  onChange={(e) => setTaxUsaPercent(e.target.value === "" ? null : Number(e.target.value))}
                  onBlur={() => {
                    if (taxUsaPercent === null) setTaxUsaPercent(7);
                  }}
                  placeholder="7"
                  className="w-full rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Envio_casillero_USD</label>
                <input
                  type="number"
                  value={envioCasilleroUsd ?? ""}
                  onChange={(e) => setEnvioCasilleroUsd(e.target.value === "" ? null : Number(e.target.value))}
                  onBlur={() => {
                    if (envioCasilleroUsd === null) setEnvioCasilleroUsd(9.5);
                  }}
                  placeholder="9.50"
                  className="w-full rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">TRM_COP_por_USD</label>
                <input
                  type="number"
                  value={trmCopPorUsd ?? ""}
                  onChange={(e) => setTrmCopPorUsd(e.target.value === "" ? null : Number(e.target.value))}
                  onBlur={() => {
                    if (trmCopPorUsd === null) setTrmCopPorUsd(3790);
                  }}
                  className="w-full rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Costos_locales_COP</label>
                <input
                  type="number"
                  value={costosLocalesCop ?? ""}
                  onChange={(e) => setCostosLocalesCop(e.target.value === "" ? null : Number(e.target.value))}
                  onBlur={() => {
                    if (costosLocalesCop === null) setCostosLocalesCop(0);
                  }}
                  className="w-full rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Margen_deseado_%</label>
                <input
                  type="number"
                  value={margenDeseadoPercent ?? ""}
                  onChange={(e) => {
                    setPrecioVentaMode("auto");
                    setPrecioVentaCopManual(null);
                    setMargenDeseadoPercent(e.target.value === "" ? null : Number(e.target.value));
                  }}
                  onBlur={() => {
                    if (margenDeseadoPercent === null) setMargenDeseadoPercent(30);
                  }}
                  className="w-full rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Precio_venta_COP (Manual)</label>
                <input
                  type="number"
                  value={
                    precioVentaMode === "manual"
                      ? (precioVentaCopManual ?? "")
                      : ""
                  }
                  placeholder={hasCoreInput && precioVentaCopAuto ? precioVentaCopAuto.toString() : "Auto calculado"}
                  onChange={(e) => {
                    const next = e.target.value === "" ? null : Number(e.target.value);
                    setPrecioVentaMode(next === null ? "auto" : "manual");
                    setPrecioVentaCopManual(next);
                  }}
                  onBlur={() => {
                    if (!precioVentaCopManual || precioVentaCopManual <= 0) {
                      setPrecioVentaMode("auto");
                      setPrecioVentaCopManual(null);
                    }
                  }}
                  className="w-full rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Agregar item</h4>
                <button
                  type="button"
                  onClick={() => setItems((prev) => [...prev, createEmptyItem()])}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  + Item
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="grid gap-3 grid-cols-1 sm:grid-cols-12">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => {
                        const next = e.target.value;
                        setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, name: next } : p)));
                      }}
                      placeholder="Nombre del item (opcional)"
                      className="sm:col-span-6 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white"
                    />
                    <select
                      value={item.op}
                      onChange={(e) => {
                        const next = e.target.value as ExtraItem["op"];
                        setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, op: next } : p)));
                      }}
                      className="sm:col-span-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white"
                    >
                      <option value="add">Suma</option>
                      <option value="subtract">Resta</option>
                    </select>
                    <input
                      type="number"
                      value={item.amountUsd ?? ""}
                      onChange={(e) => {
                        const next = e.target.value === "" ? null : Number(e.target.value);
                        setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, amountUsd: next } : p)));
                      }}
                      placeholder="USD"
                      className="sm:col-span-3 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setItems((prev) => (prev.length <= 1 ? [createEmptyItem()] : prev.filter((p) => p.id !== item.id)))}
                      className="sm:col-span-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={handleLimpiar}
              className="flex justify-center items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Limpiar
            </button>
            <button
              onClick={goToCotizacion}
              disabled={!canQuote}
              className={`flex justify-center items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors flex-1 ${canQuote ? "brand-solid" : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed"
                }`}
            >
              <ArrowRight className="h-4 w-4" />
              Usar en cotización
            </button>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm lg:sticky lg:top-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 sm:mb-8">Desglose de costos</h3>

            <div className="space-y-4 sm:space-y-6">
              <div className="flex justify-between items-center text-sm pb-4 sm:pb-6 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Precio_con_tax_USD</span>
                <span className="font-medium text-slate-900 dark:text-white">{hasCoreInput ? formatearUsd(precioConTaxUsd) : "-"}</span>
              </div>
              <div className="flex justify-between items-center text-sm pb-4 sm:pb-6 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Costo_total_USD</span>
                <span className="font-medium text-slate-900 dark:text-white">{hasCoreInput ? formatearUsd(costoTotalUsd) : "-"}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Costo_en_COP</span>
                <span className="font-bold text-slate-900 dark:text-white">{hasCoreInput ? formatearCop(costoEnCop) : "-"}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Costo_real_total_COP</span>
                <span className="font-medium text-slate-900 dark:text-white">{hasCoreInput ? formatearCop(costoRealTotalCop) : "-"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Precio_venta_COP</span>
                <span className="font-medium text-slate-900 dark:text-white">{hasCoreInput && precioVentaCop ? formatearCop(precioVentaCop) : "-"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Margen_real_%_sobre_venta</span>
                <span className="font-medium text-slate-900 dark:text-white">{hasCoreInput && precioVentaCop ? `${margenRealSobreVenta.toFixed(2)}%` : "-"}</span>
              </div>

              <div className="mt-6 sm:mt-8 rounded-2xl bg-[#1A1F2C] p-5 sm:p-6 text-white">
                <p className="text-[10px] sm:text-xs font-bold tracking-wider text-slate-400 mb-2 uppercase">Ganancia_COP</p>
                <p className="text-2xl sm:text-3xl font-bold brand-accent-text break-all">
                  {hasCoreInput ? formatearCop(gananciaCop) : "-"}
                </p>
              </div>

              <div className="flex justify-between items-center text-sm pb-4 sm:pb-6 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Anticipo cliente</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {hasCoreInput && precioVentaCop ? `${formatearCop(anticipoCop)} (${anticipoPercent.toFixed(2)}%)` : "-"}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Capital propio</span>
                <span className="font-medium text-slate-900 dark:text-white">{hasCoreInput ? formatearCop(capitalPropioCop) : "-"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">% capital propio sobre costo</span>
                <span className="font-medium text-slate-900 dark:text-white">{hasCoreInput ? `${percentCapitalPropioSobreCosto.toFixed(2)}%` : "-"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Markup % sobre costo</span>
                <span className="font-medium text-slate-900 dark:text-white">{hasCoreInput ? `${markupSobreCosto.toFixed(2)}%` : "-"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">ROI sobre mi capital</span>
                <span className="font-medium text-slate-900 dark:text-white">{hasCoreInput ? `${roiSobreMiCapital.toFixed(2)}%` : "-"}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

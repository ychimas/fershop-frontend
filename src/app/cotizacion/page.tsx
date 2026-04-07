"use client";

import { FileText, Plus, Trash2, FileDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

type ClientRow = { id: string; name: string };
type ProductRow = { id: string; name: string; priceCop: number | null };

type QuoteItemDraft = {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitCop: string;
};

const formatCop = (value: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

const newItem = (prefillUnitCop?: number): QuoteItemDraft => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  productId: "",
  name: "",
  quantity: 1,
  unitCop: prefillUnitCop ? String(Math.round(prefillUnitCop)) : "",
});

export default function Page() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientId, setClientId] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<QuoteItemDraft[]>([newItem()]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [clientsData, productsData] = await Promise.all([
          apiFetch<Array<{ id: string; name: string }>>("/clients"),
          apiFetch<Array<{ id: string; name: string; priceCop: number | null }>>("/products"),
        ]);
        if (cancelled) return;
        setClients(clientsData);
        setProducts(productsData);

        try {
          const raw = window.sessionStorage.getItem("fershop_quote_price");
          if (raw) {
            const parsed = JSON.parse(raw) as { precioVentaCop?: number };
            if (typeof parsed.precioVentaCop === "number" && parsed.precioVentaCop > 0) {
              setItems([newItem(parsed.precioVentaCop)]);
            }
          }
        } catch { }
      } catch (e: unknown) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Error cargando datos");
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = useMemo(() => {
    const parsed = items.map((i) => {
      const unitCop = i.unitCop.trim() === "" ? 0 : Number(i.unitCop);
      const quantity = Number.isFinite(i.quantity) && i.quantity > 0 ? i.quantity : 1;
      const totalCop = (Number.isFinite(unitCop) ? unitCop : 0) * quantity;
      return { unitCop, quantity, totalCop };
    });
    const totalCop = parsed.reduce((acc, i) => acc + i.totalCop, 0);
    return { totalCop };
  }, [items]);

  const onAddItem = () => setItems((prev) => [...prev, newItem()]);

  const onRemoveItem = (id: string) =>
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((i) => i.id !== id)));

  const onSelectProduct = (rowId: string, productIdValue: string) => {
    const p = products.find((x) => x.id === productIdValue) ?? null;
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== rowId) return i;
        if (!p) return { ...i, productId: "", name: "" };
        const nextUnitCop =
          p.priceCop !== null && (i.unitCop.trim() === "" || i.unitCop === "0") ? String(Math.round(p.priceCop)) : i.unitCop;
        return { ...i, productId: p.id, name: p.name, unitCop: nextUnitCop };
      }),
    );
  };

  const canSave = !loading && !saving && !!clientId && items.some((i) => i.name.trim() && Number(i.unitCop) > 0);

  const onCreateQuote = async () => {
    if (!canSave) return;
    try {
      setSaving(true);
      setError(null);
      const payload = {
        clientId,
        note: note.trim() || null,
        items: items
          .filter((i) => i.name.trim())
          .map((i) => ({
            productId: i.productId || null,
            name: i.name.trim(),
            quantity: i.quantity,
            unitCop: Number(i.unitCop),
          })),
      };
      const created = await apiFetch<{ id: string }>("/quotes", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      router.push(`/cotizacion/${created.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error creando cotización");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto pt-14 md:pt-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl brand-icon-bg shrink-0">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 brand-icon-fg" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Cotización</h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Cliente, productos y precio final</p>
          </div>
        </div>
      </div>

      {error ? <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <div className="rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cliente</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white"
              disabled={loading}
            >
              <option value="">Seleccione un cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nota</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              type="text"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white"
              placeholder="Opcional"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Productos</h3>
          <button
            type="button"
            onClick={onAddItem}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Agregar
          </button>
        </div>

        <div className="space-y-3">
          {items.map((i) => (
            <div key={i.id} className="grid gap-3 grid-cols-1 md:grid-cols-12">
              <select
                value={i.productId}
                onChange={(e) => onSelectProduct(i.id, e.target.value)}
                className="md:col-span-4 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white"
              >
                <option value="">Producto (opcional)</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                value={i.name}
                onChange={(e) => setItems((prev) => prev.map((x) => (x.id === i.id ? { ...x, name: e.target.value } : x)))}
                type="text"
                className="md:col-span-4 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white"
                placeholder="Nombre del producto"
              />
              <input
                value={i.quantity}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((x) => (x.id === i.id ? { ...x, quantity: e.target.value === "" ? 1 : Number(e.target.value) } : x)),
                  )
                }
                type="number"
                className="md:col-span-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white"
                placeholder="Cant."
                min={1}
              />
              <input
                value={i.unitCop}
                onChange={(e) => setItems((prev) => prev.map((x) => (x.id === i.id ? { ...x, unitCop: e.target.value } : x)))}
                type="number"
                className="md:col-span-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white"
                placeholder="COP"
              />
              <button
                type="button"
                onClick={() => onRemoveItem(i.id)}
                className="md:col-span-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Trash2 className="h-4 w-4 mx-auto" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Total: <span className="font-bold text-slate-900 dark:text-white">{formatCop(totals.totalCop)}</span>
          </div>
          <button
            onClick={onCreateQuote}
            disabled={!canSave}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors ${canSave ? "brand-solid" : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed"
              }`}
          >
            <FileDown className="h-4 w-4" />
            Generar PDF
          </button>
        </div>
      </div>
    </div>
  );
}

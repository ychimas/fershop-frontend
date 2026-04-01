"use client";

import { Search, Plus, ShoppingCart, DollarSign, Package, Plane, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import { apiFetch } from "@/lib/api";

type OrderOption = { id: string; code: string; producto: string | null; clientName: string };
type PurchaseRow = {
  id: string;
  orderId: string;
  orderCode: string;
  orderStatus: string;
  clientName: string;
  productName: string | null;
  storeName: string;
  trackingUS: string | null;
  amountUsd: number | null;
  purchasedAt: string;
};

export default function Page() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [compras, setCompras] = useState<PurchaseRow[]>([]);
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOrderId, setFormOrderId] = useState("");
  const [formStore, setFormStore] = useState("");
  const [formAmountUsd, setFormAmountUsd] = useState<string>("");
  const [formTracking, setFormTracking] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);
      const [purchasesData, ordersData] = await Promise.all([apiFetch<PurchaseRow[]>("/purchases"), apiFetch<{ id: string; code: string; producto: string | null; client?: { name: string } }[]>("/orders")]);
      setCompras(purchasesData);
      setOrders(
        ordersData.map((o) => ({
          id: o.id,
          code: o.code,
          producto: o.producto,
          clientName: o.client?.name ?? "",
        })),
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error cargando compras");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return compras;
    return compras.filter((c) => (c.productName ?? "").toLowerCase().includes(q) || c.storeName.toLowerCase().includes(q));
  }, [compras, query]);

  const totalUsd = useMemo(() => compras.reduce((acc, c) => acc + (c.amountUsd ?? 0), 0), [compras]);

  const formatUsd = (value: number | null) =>
    value === null ? "-" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

  const estadoCompra = (orderStatus: string) => {
    if (orderStatus === "IN_TRANSIT" || orderStatus === "IN_CUSTOMS" || orderStatus === "IN_COLOMBIA") return "Enviado a Colombia";
    if (orderStatus === "DELIVERED") return "Entregado";
    if (orderStatus === "PURCHASED") return "Comprado";
    return "Pendiente";
  };

  const colorCompra = (orderStatus: string) => {
    if (orderStatus === "IN_TRANSIT" || orderStatus === "IN_CUSTOMS" || orderStatus === "IN_COLOMBIA") return "emerald";
    if (orderStatus === "PURCHASED") return "blue";
    if (orderStatus === "DELIVERED") return "emerald";
    return "slate";
  };

  const badgeClassCompra = (orderStatus: string) => {
    const color = colorCompra(orderStatus);
    if (color === "emerald") return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20";
    if (color === "blue") return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20";
    return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700";
  };

  const onOpenModal = () => {
    setFormOrderId("");
    setFormStore("");
    setFormAmountUsd("");
    setFormTracking("");
    setIsModalOpen(true);
  };

  const onCreateCompra = async () => {
    const amountUsd = formAmountUsd.trim() === "" ? null : Number(formAmountUsd);
    if (!formOrderId || !formStore.trim()) return;
    try {
      setSaving(true);
      await apiFetch("/purchases", {
        method: "POST",
        body: JSON.stringify({
          orderId: formOrderId,
          storeName: formStore.trim(),
          amountUsd: amountUsd !== null && Number.isFinite(amountUsd) ? amountUsd : null,
          trackingUS: formTracking.trim() || null,
        }),
      });
      setIsModalOpen(false);
      await fetchData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error creando compra");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pt-14 md:pt-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl brand-icon-bg shrink-0">
            <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 brand-icon-fg" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Compras en EE.UU</h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Registro y control de compras en Estados Unidos</p>
          </div>
        </div>
        <button
          onClick={onOpenModal}
          className="w-full sm:w-auto flex justify-center items-center gap-2 rounded-xl brand-solid px-4 py-2.5 text-sm font-medium transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nueva Compra
        </button>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
        <div className="rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total compras USD</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl brand-icon-bg">
              <DollarSign className="h-5 w-5 brand-icon-fg" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{loading ? "-" : formatUsd(totalUsd)}</div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{loading ? "" : `${compras.length} compras registradas`}</p>
          </div>
        </div>

        <div className="rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">En bodega Miami</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-900/20">
              <Package className="h-5 w-5 text-orange-500" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{loading ? "-" : compras.length}</div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Compras</p>
          </div>
        </div>

        <div className="rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Enviados a Colombia</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
              <Plane className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{loading ? "-" : compras.filter((c) => estadoCompra(c.orderStatus) === "Enviado a Colombia").length}</div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">En tránsito</p>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por producto o tienda..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-3 pl-12 pr-4 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 shadow-sm dark:text-white"
        />
      </div>

      {/* Tabla de Compras */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                <th className="px-4 sm:px-6 py-4">ID</th>
                <th className="px-4 sm:px-6 py-4">PRODUCTO</th>
                <th className="px-4 sm:px-6 py-4">TIENDA</th>
                <th className="px-4 sm:px-6 py-4">PRECIO</th>
                <th className="px-4 sm:px-6 py-4">FECHA</th>
                <th className="px-4 sm:px-6 py-4">TRACKING</th>
                <th className="px-4 sm:px-6 py-4">ESTADO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-sm text-red-600">
                    {error}
                  </td>
                </tr>
              ) : null}
              {!loading && !filtered.length && !error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-sm text-slate-500">
                    No hay compras para mostrar.
                  </td>
                </tr>
              ) : null}
              {filtered.map((compra) => (
                <tr key={compra.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 sm:px-6 py-4 sm:py-5 font-medium text-slate-900 dark:text-white">{compra.orderCode}</td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5 text-slate-900 dark:text-white font-medium">{compra.productName ?? "-"}</td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors">
                      {compra.storeName}
                      <ExternalLink className="h-3 w-3" />
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5 font-bold text-slate-900 dark:text-white">{formatUsd(compra.amountUsd)}</td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5 text-slate-500 dark:text-slate-400">{new Date(compra.purchasedAt).toISOString().slice(0, 10)}</td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5 text-slate-400 dark:text-slate-500 font-mono text-xs">{compra.trackingUS ?? "-"}</td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClassCompra(compra.orderStatus)}`}>
                      {estadoCompra(compra.orderStatus)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Nueva Compra"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Producto / Pedido Asociado</label>
            <select value={formOrderId} onChange={(e) => setFormOrderId(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white">
              <option value="">Seleccione un pedido</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>{o.code}{o.producto ? ` - ${o.producto}` : ""}{o.clientName ? ` (${o.clientName})` : ""}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tienda de Compra</label>
            <input value={formStore} onChange={(e) => setFormStore(e.target.value)} type="text" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white" placeholder="Ej. Amazon, Nike, Apple" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Precio Pagado (USD)</label>
              <input value={formAmountUsd} onChange={(e) => setFormAmountUsd(e.target.value)} type="number" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">N° de Tracking</label>
              <input value={formTracking} onChange={(e) => setFormTracking(e.target.value)} type="text" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white" placeholder="1Z999..." />
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              disabled={saving || !formOrderId || !formStore.trim()}
              onClick={onCreateCompra}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium text-white transition-colors ${saving || !formOrderId || !formStore.trim() ? "bg-slate-300 cursor-not-allowed" : "brand-solid"}`}
            >
              Guardar Compra
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

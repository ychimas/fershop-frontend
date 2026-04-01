"use client";

import { Search, Plus, DollarSign, TrendingUp, CheckCircle2, Banknote, CreditCard, MoreHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import { apiFetch } from "@/lib/api";

type ClientRow = { id: string; name: string };
type ProductRow = { id: string; name: string };
type SaleRow = {
  id: string;
  client: { id: string; name: string };
  producto: string | null;
  totalCop: number;
  paidCop: number;
  status: "PENDING" | "PARTIAL" | "PAID" | "CANCELLED";
  method: "TRANSFER" | "CASH" | "NEQUI" | "DAVIPLATA" | "CARD" | "OTHER" | null;
  createdAt: string;
};

export default function Page() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [ventas, setVentas] = useState<SaleRow[]>([]);
  const [clientes, setClientes] = useState<ClientRow[]>([]);
  const [productos, setProductos] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formClientId, setFormClientId] = useState("");
  const [formProductId, setFormProductId] = useState("");
  const [formAmountCop, setFormAmountCop] = useState<string>("");
  const [formMethod, setFormMethod] = useState<NonNullable<SaleRow["method"]> | "">("");
  const [formStatus, setFormStatus] = useState<SaleRow["status"] | "">("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);
      const [salesData, clientsData, productsData] = await Promise.all([
        apiFetch<SaleRow[]>("/sales"),
        apiFetch<{ id: string; name: string }[]>("/clients"),
        apiFetch<{ id: string; name: string }[]>("/products"),
      ]);
      setVentas(salesData);
      setClientes(clientsData.map((c) => ({ id: c.id, name: c.name })));
      setProductos(productsData.map((p) => ({ id: p.id, name: p.name })));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error cargando ventas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ventas;
    return ventas.filter((v) => {
      const client = v.client.name.toLowerCase();
      const prod = (v.producto ?? "").toLowerCase();
      return client.includes(q) || prod.includes(q);
    });
  }, [ventas, query]);

  const formatCop = (value: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

  const statusLabel = (status: SaleRow["status"]) => {
    if (status === "PAID") return "Pagado";
    if (status === "PARTIAL") return "Parcial";
    if (status === "CANCELLED") return "Cancelado";
    return "Pendiente";
  };

  const statusColor = (status: SaleRow["status"]) => {
    if (status === "PAID") return "emerald";
    if (status === "PARTIAL") return "yellow";
    return "blue";
  };

  const methodLabel = (method: SaleRow["method"]) => {
    if (!method) return "-";
    if (method === "TRANSFER") return "Transferencia";
    if (method === "CASH") return "Efectivo";
    if (method === "NEQUI") return "Nequi";
    if (method === "DAVIPLATA") return "Daviplata";
    if (method === "CARD") return "Tarjeta";
    return "Otro";
  };

  const summary = useMemo(() => {
    const total = ventas.reduce((acc, v) => acc + v.totalCop, 0);
    const paidCount = ventas.filter((v) => v.status === "PAID").length;
    const pendingCop = ventas
      .filter((v) => v.status === "PENDING" || v.status === "PARTIAL")
      .reduce((acc, v) => acc + Math.max(v.totalCop - v.paidCop, 0), 0);
    const methods = new Set(ventas.map((v) => v.method).filter(Boolean));
    return { total, paidCount, pendingCop, methodsCount: methods.size };
  }, [ventas]);

  const onOpenModal = () => {
    setFormClientId("");
    setFormProductId("");
    setFormAmountCop("");
    setFormMethod("");
    setFormStatus("");
    setIsModalOpen(true);
  };

  const onCreateVenta = async () => {
    const amount = Number(formAmountCop);
    if (!formClientId || !Number.isFinite(amount) || amount <= 0) return;
    try {
      setSaving(true);
      const status = (formStatus || "PENDING") as SaleRow["status"];
      const method = (formMethod || "OTHER") as NonNullable<SaleRow["method"]>;
      const paidCop = status === "PAID" ? amount : status === "PARTIAL" ? Math.min(amount, amount) : 0;
      await apiFetch("/sales", {
        method: "POST",
        body: JSON.stringify({
          clientId: formClientId,
          totalCop: amount,
          paidCop,
          status,
          items: formProductId
            ? [
              {
                productId: formProductId,
                name: productos.find((p) => p.id === formProductId)?.name ?? "Producto",
                quantity: 1,
                unitCop: amount,
              },
            ]
            : [{ name: "Venta", quantity: 1, unitCop: amount }],
          payment: formMethod
            ? {
              method,
              amountCop: paidCop > 0 ? paidCop : amount,
            }
            : undefined,
        }),
      });
      setIsModalOpen(false);
      await fetchData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error creando venta");
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
            <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 brand-icon-fg" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Ventas Colombia</h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Control de ventas, pagos y facturación</p>
          </div>
        </div>
        <button
          onClick={onOpenModal}
          className="w-full sm:w-auto flex justify-center items-center gap-2 rounded-xl brand-solid px-4 py-2.5 text-sm font-medium transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nueva Venta
        </button>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Ventas del mes</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400">
              <TrendingUp className="h-5 w-5 text-yellow-900" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{loading ? "-" : formatCop(summary.total)}</div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{loading ? "" : `${ventas.length} ventas registradas`}</p>
          </div>
        </div>

        <div className="rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Pagadas</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{loading ? "-" : summary.paidCount}</div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{loading ? "" : `de ${ventas.length} ventas`}</p>
          </div>
        </div>

        <div className="rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Por cobrar</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-900/20">
              <Banknote className="h-5 w-5 text-orange-500" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{loading ? "-" : formatCop(summary.pendingCop)}</div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{loading ? "" : "pendiente por cobrar"}</p>
          </div>
        </div>

        <div className="rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Métodos de pago</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <CreditCard className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{loading ? "-" : summary.methodsCount}</div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{loading ? "" : "métodos registrados"}</p>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por cliente o producto..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-3 pl-12 pr-4 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 shadow-sm dark:text-white"
        />
      </div>

      {/* Tabla de Ventas */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                <th className="px-4 sm:px-6 py-4">ID</th>
                <th className="px-4 sm:px-6 py-4">CLIENTE</th>
                <th className="px-4 sm:px-6 py-4">PRODUCTO</th>
                <th className="px-4 sm:px-6 py-4">MONTO</th>
                <th className="px-4 sm:px-6 py-4">MÉTODO</th>
                <th className="px-4 sm:px-6 py-4">FECHA</th>
                <th className="px-4 sm:px-6 py-4">ESTADO</th>
                <th className="px-4 sm:px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {error ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-sm text-red-600">
                    {error}
                  </td>
                </tr>
              ) : null}
              {!loading && !filtered.length && !error ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-sm text-slate-500">
                    No hay ventas para mostrar.
                  </td>
                </tr>
              ) : null}
              {filtered.map((venta) => (
                <tr key={venta.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 sm:px-6 py-4 sm:py-5 font-medium text-slate-900 dark:text-white">{venta.id}</td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5 text-slate-900 dark:text-white">{venta.client.name}</td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5 text-slate-500 dark:text-slate-400">{venta.producto ?? "-"}</td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5 font-bold text-slate-900 dark:text-white">{formatCop(venta.totalCop)}</td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5 text-slate-500 dark:text-slate-400">{methodLabel(venta.method)}</td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5 text-slate-500 dark:text-slate-400">{new Date(venta.createdAt).toISOString().slice(0, 10)}</td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(venta.status) === 'emerald' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20' :
                      statusColor(venta.status) === 'yellow' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-500/20' :
                        'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20'
                      }`}>
                      {statusLabel(venta.status)}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5 text-right">
                    <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
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
        title="Registrar Nueva Venta"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cliente</label>
            <select value={formClientId} onChange={(e) => setFormClientId(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white">
              <option value="">Seleccione un cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Producto</label>
            <select value={formProductId} onChange={(e) => setFormProductId(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white">
              <option value="">Seleccione un producto</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Monto (COP)</label>
              <input value={formAmountCop} onChange={(e) => setFormAmountCop(e.target.value)} type="number" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white" placeholder="0" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Método de Pago</label>
              <select value={formMethod} onChange={(e) => setFormMethod(e.target.value as NonNullable<SaleRow["method"]>)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white">
                <option value="">Seleccionar</option>
                <option value="TRANSFER">Transferencia</option>
                <option value="CASH">Efectivo</option>
                <option value="NEQUI">Nequi</option>
                <option value="DAVIPLATA">Daviplata</option>
                <option value="CARD">Tarjeta</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Estado</label>
            <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as SaleRow["status"])} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white">
              <option value="">Seleccionar</option>
              <option value="PAID">Pagado</option>
              <option value="PARTIAL">Parcial</option>
              <option value="PENDING">Pendiente</option>
            </select>
          </div>
          <div className="pt-4 flex gap-3">
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              disabled={saving || !formClientId || !formAmountCop}
              onClick={onCreateVenta}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium text-white transition-colors ${saving || !formClientId || !formAmountCop ? "bg-slate-300 cursor-not-allowed" : "brand-solid"}`}
            >
              Guardar Venta
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

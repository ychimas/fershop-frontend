"use client";

import { Search, Plus, ClipboardList, Filter, Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import { apiFetch } from "@/lib/api";

type ClientRow = { id: string; name: string };
type ProductRow = {
  id: string;
  name: string;
  priceUsd: number | null;
  priceCop: number | null;
};
type OrderRow = {
  id: string;
  code: string;
  status: "QUOTED" | "PURCHASED" | "IN_TRANSIT" | "IN_CUSTOMS" | "IN_COLOMBIA" | "DELIVERED" | "CANCELLED";
  step: number;
  client: { id: string; name: string };
  producto: string | null;
  totalUsd: number | null;
  totalCop: number | null;
  createdAt: string;
};

export default function Page() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [pedidos, setPedidos] = useState<OrderRow[]>([]);
  const [clientes, setClientes] = useState<ClientRow[]>([]);
  const [productos, setProductos] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formClientId, setFormClientId] = useState("");
  const [formProductId, setFormProductId] = useState("");
  const [formProductName, setFormProductName] = useState("");
  const [formUsd, setFormUsd] = useState<string>("");
  const [formCop, setFormCop] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);
      const [ordersData, clientsData, productsData] = await Promise.all([
        apiFetch<OrderRow[]>("/orders"),
        apiFetch<{ id: string; name: string }[]>("/clients"),
        apiFetch<ProductRow[]>("/products"),
      ]);
      setPedidos(ordersData);
      setClientes(clientsData.map((c) => ({ id: c.id, name: c.name })));
      setProductos(productsData);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error cargando pedidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pedidos;
    return pedidos.filter((p) => p.code.toLowerCase().includes(q) || p.client.name.toLowerCase().includes(q) || (p.producto ?? "").toLowerCase().includes(q));
  }, [pedidos, query]);

  const formatUsd = (value: number | null) =>
    value === null ? "-" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  const formatCop = (value: number | null) =>
    value === null ? "-" : new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

  const statusLabel = (status: OrderRow["status"]) => {
    if (status === "DELIVERED") return "Entregado";
    if (status === "PURCHASED") return "Comprado";
    if (status === "IN_TRANSIT" || status === "IN_CUSTOMS" || status === "IN_COLOMBIA") return "En camino";
    if (status === "CANCELLED") return "Cancelado";
    return "Cotizado";
  };

  const statusColor = (status: OrderRow["status"]) => {
    if (status === "DELIVERED") return "emerald";
    if (status === "PURCHASED") return "yellow";
    if (status === "IN_TRANSIT" || status === "IN_CUSTOMS" || status === "IN_COLOMBIA") return "orange";
    return "blue";
  };

  const onOpenModal = () => {
    setFormClientId("");
    setFormProductId("");
    setFormProductName("");
    setFormUsd("");
    setFormCop("");
    setIsModalOpen(true);
  };

  const onSelectProduct = (productId: string) => {
    setFormProductId(productId);
    const product = productos.find((p) => p.id === productId);
    if (!product) {
      setFormProductName("");
      setFormUsd("");
      setFormCop("");
      return;
    }
    setFormProductName(product.name);
    setFormUsd(product.priceUsd === null ? "" : String(product.priceUsd));
    setFormCop(product.priceCop === null ? "" : String(product.priceCop));
  };

  const onCreatePedido = async () => {
    const usd = formUsd.trim() === "" ? null : Number(formUsd);
    const cop = formCop.trim() === "" ? null : Number(formCop);
    if (!formClientId || !formProductName.trim()) return;
    try {
      setSaving(true);
      await apiFetch("/orders", {
        method: "POST",
        body: JSON.stringify({
          clientId: formClientId,
          status: "QUOTED",
          items: [
            {
              productId: formProductId || null,
              name: formProductName.trim(),
              quantity: 1,
              unitUsd: usd !== null && Number.isFinite(usd) ? usd : null,
              unitCop: cop !== null && Number.isFinite(cop) ? cop : null,
            },
          ],
        }),
      });
      setIsModalOpen(false);
      await fetchData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error creando pedido");
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
            <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 brand-icon-fg" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Pedidos</h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Trazabilidad completa de cada pedido</p>
          </div>
        </div>
        <button
          onClick={onOpenModal}
          className="w-full sm:w-auto flex justify-center items-center gap-2 rounded-xl brand-solid px-4 py-2.5 text-sm font-medium transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nuevo Pedido
        </button>
      </div>

      {/* Controles (Buscador y Filtro) */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por ID, cliente o producto..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-3 pl-12 pr-4 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 shadow-sm dark:text-white"
          />
        </div>
        <button className="flex justify-center items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800">
          <Filter className="h-4 w-4" />
          Todos
        </button>
      </div>

      {/* Tabla de Pedidos */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                <th className="px-4 sm:px-6 py-4">ID</th>
                <th className="px-4 sm:px-6 py-4">CLIENTE</th>
                <th className="px-4 sm:px-6 py-4">PRODUCTO</th>
                <th className="px-4 sm:px-6 py-4">USD</th>
                <th className="px-4 sm:px-6 py-4">COP</th>
                <th className="px-4 sm:px-6 py-4">TRAZABILIDAD</th>
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
                    No hay pedidos para mostrar.
                  </td>
                </tr>
              ) : null}
              {filtered.map((pedido) => (
                <tr key={pedido.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 sm:px-6 py-4 sm:py-5 font-medium text-slate-900 dark:text-white">{pedido.code}</td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5 text-slate-500 dark:text-slate-400">{pedido.client.name}</td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5 text-slate-900 dark:text-white">{pedido.producto ?? "-"}</td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5 text-slate-600 dark:text-slate-400">{formatUsd(pedido.totalUsd)}</td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5 font-bold text-slate-900 dark:text-white">{formatCop(pedido.totalCop)}</td>

                  {/* Barra de Trazabilidad */}
                  <td className="px-4 sm:px-6 py-4 sm:py-5">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div key={step} className="flex items-center">
                          <div className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full ${step <= pedido.step ? 'bg-yellow-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
                          {step < 4 && (
                            <div className={`h-0.5 w-3 sm:w-4 ${step < pedido.step ? 'bg-yellow-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
                          )}
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="px-4 sm:px-6 py-4 sm:py-5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(pedido.status) === 'orange' ? 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20' :
                      statusColor(pedido.status) === 'yellow' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-500/20' :
                        statusColor(pedido.status) === 'emerald' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20' :
                          'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20'
                      }`}>
                      {statusLabel(pedido.status)}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5 text-right">
                    <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
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
        title="Nuevo Pedido"
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
            <select value={formProductId} onChange={(e) => onSelectProduct(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white">
              <option value="">Seleccione un producto</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre del producto</label>
            <input value={formProductName} onChange={(e) => setFormProductName(e.target.value)} type="text" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white" placeholder="Ej. Nike Air Max 90" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Valor USD</label>
              <input value={formUsd} onChange={(e) => setFormUsd(e.target.value)} type="number" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Valor COP</label>
              <input value={formCop} onChange={(e) => setFormCop(e.target.value)} type="number" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white" placeholder="0" />
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
              disabled={saving || !formClientId || !formProductName.trim()}
              onClick={onCreatePedido}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium text-white transition-colors ${saving || !formClientId || !formProductName.trim() ? "bg-slate-300 cursor-not-allowed" : "brand-solid"}`}
            >
              Crear Pedido
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

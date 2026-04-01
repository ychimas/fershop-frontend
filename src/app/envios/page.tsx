"use client";

import { Search, Plus, Truck, Plane, Clock, Package, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import { apiFetch } from "@/lib/api";

type ShipmentRow = {
  id: string;
  orderId: string;
  orderCode: string;
  orderStatus: string;
  clientName: string;
  productName: string | null;
  origin: string;
  destination: string;
  packagesCount: number;
  weightLb: number | null;
  courier: string | null;
  trackingIntl: string | null;
  shippedAt: string;
  estimatedArrival: string | null;
  progressPercent: number;
};

type OrderOption = { id: string; code: string; clientName: string; destination: string; producto: string | null };

export default function Page() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [envios, setEnvios] = useState<ShipmentRow[]>([]);
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOrderId, setFormOrderId] = useState("");
  const [formWeightLb, setFormWeightLb] = useState<string>("");
  const [formPackages, setFormPackages] = useState<string>("1");
  const [formCourier, setFormCourier] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);
      const [shipmentsData, ordersData] = await Promise.all([apiFetch<ShipmentRow[]>("/shipments"), apiFetch<{ id: string; code: string; producto: string | null; client?: { name: string } }[]>("/orders")]);
      setEnvios(shipmentsData);
      setOrders(
        ordersData.map((o) => ({
          id: o.id,
          code: o.code,
          clientName: o.client?.name ?? "",
          destination: o.client?.name ? "" : "",
          producto: o.producto,
        })),
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error cargando envíos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return envios;
    return envios.filter((e) => e.orderCode.toLowerCase().includes(q) || e.destination.toLowerCase().includes(q) || e.clientName.toLowerCase().includes(q));
  }, [envios, query]);

  const estadoEnvio = (s: ShipmentRow) => {
    if (s.orderStatus === "DELIVERED" || s.progressPercent >= 100) return { label: "Entregado", color: "emerald" as const };
    if (s.orderStatus === "IN_CUSTOMS") return { label: "En aduana", color: "orange" as const };
    if (s.orderStatus === "IN_TRANSIT" || s.orderStatus === "IN_COLOMBIA") return { label: "En tránsito", color: "blue" as const };
    return { label: "Preparando", color: "slate" as const };
  };

  const summary = useMemo(() => {
    const inTransit = envios.filter((e) => estadoEnvio(e).label === "En tránsito").length;
    const customs = envios.filter((e) => estadoEnvio(e).label === "En aduana").length;
    const delivered = envios.filter((e) => estadoEnvio(e).label === "Entregado").length;
    const preparing = envios.filter((e) => estadoEnvio(e).label === "Preparando").length;
    return { inTransit, customs, delivered, preparing };
  }, [envios]);

  const onOpenModal = () => {
    setFormOrderId("");
    setFormWeightLb("");
    setFormPackages("1");
    setFormCourier("");
    setIsModalOpen(true);
  };

  const onCreateEnvio = async () => {
    const weightLb = formWeightLb.trim() === "" ? null : Number(formWeightLb);
    const packagesCount = formPackages.trim() === "" ? 1 : Number(formPackages);
    if (!formOrderId) return;
    try {
      setSaving(true);
      const destination = "Colombia";
      await apiFetch("/shipments", {
        method: "POST",
        body: JSON.stringify({
          orderId: formOrderId,
          destination,
          packagesCount: Number.isFinite(packagesCount) && packagesCount > 0 ? packagesCount : 1,
          weightLb: weightLb !== null && Number.isFinite(weightLb) ? weightLb : null,
          courier: formCourier.trim() || null,
        }),
      });
      setIsModalOpen(false);
      await fetchData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error creando envío");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl brand-icon-bg">
            <Truck className="h-6 w-6 brand-icon-fg" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Envíos</h2>
            <p className="text-slate-500">Seguimiento de envíos Miami &rarr; Colombia</p>
          </div>
        </div>
        <button
          onClick={onOpenModal}
          className="flex items-center gap-2 rounded-xl brand-solid px-4 py-2.5 text-sm font-medium transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nuevo Envío
        </button>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500">En tránsito</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <Plane className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900">{loading ? "-" : summary.inTransit}</div>
            <p className="text-xs font-medium text-slate-500 mt-1">Miami &rarr; Colombia</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500">En aduana</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              <Clock className="h-5 w-5 text-orange-500" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900">{loading ? "-" : summary.customs}</div>
            <p className="text-xs font-medium text-slate-500 mt-1">Pendiente liberación</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500">Entregados</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <Package className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900">{loading ? "-" : summary.delivered}</div>
            <p className="text-xs font-medium text-emerald-600 mt-1">Este mes</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500">Preparando</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
              <MapPin className="h-5 w-5 text-slate-500" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900">{loading ? "-" : summary.preparing}</div>
            <p className="text-xs font-medium text-slate-500 mt-1">En bodega Miami</p>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por ID o destino..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 shadow-sm"
        />
      </div>

      {/* Lista de Envíos */}
      <div className="space-y-4">
        {error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}
        {!loading && !filtered.length && !error ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 text-sm text-slate-500">No hay envíos para mostrar.</div>
        ) : null}
        {filtered.map((envio) => {
          const estado = estadoEnvio(envio);
          return (
            <div key={envio.id} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50">
                    <Truck className="h-6 w-6 text-slate-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-slate-900">{envio.orderCode}</h3>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${estado.color === 'blue' ? 'bg-blue-50 text-blue-700' :
                        estado.color === 'orange' ? 'bg-orange-50 text-orange-700' :
                          estado.color === 'emerald' ? 'bg-emerald-50 text-emerald-700' :
                            'bg-slate-100 text-slate-700'
                        }`}>
                        {estado.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      {envio.origin} &rarr; {envio.destination} &bull; {envio.packagesCount} paquetes &bull; {(envio.weightLb ?? 0).toFixed(1)} lb
                    </p>
                  </div>
                </div>

                <div className="text-right text-sm">
                  <p className="text-slate-500 mb-1">Enviado: <span className="text-slate-900">{new Date(envio.shippedAt).toISOString().slice(0, 10)}</span></p>
                  <p className="text-slate-500">Estimado: <span className="text-slate-900 font-medium">{envio.estimatedArrival ? new Date(envio.estimatedArrival).toISOString().slice(0, 10) : "-"}</span></p>
                </div>
              </div>

              {/* Barra de Progreso */}
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-2">
                  <span>Progreso</span>
                  <span className="font-medium text-slate-900">{envio.progressPercent}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${estado.color === 'emerald' ? 'bg-emerald-500' : 'bg-yellow-400'}`}
                    style={{ width: `${envio.progressPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Nuevo Envío"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cliente / Destino</label>
            <select value={formOrderId} onChange={(e) => setFormOrderId(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white">
              <option value="">Seleccione un pedido</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>{o.code}{o.producto ? ` - ${o.producto}` : ""}{o.clientName ? ` (${o.clientName})` : ""}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Peso (lb)</label>
              <input value={formWeightLb} onChange={(e) => setFormWeightLb(e.target.value)} type="number" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white" placeholder="0.0" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">N° de Paquetes</label>
              <input value={formPackages} onChange={(e) => setFormPackages(e.target.value)} type="number" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white" placeholder="1" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Empresa Transportadora</label>
            <input value={formCourier} onChange={(e) => setFormCourier(e.target.value)} type="text" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white" placeholder="Ej. FedEx, DHL, Coordinadora" />
          </div>
          <div className="pt-4 flex gap-3">
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              disabled={saving || !formOrderId}
              onClick={onCreateEnvio}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium text-white transition-colors ${saving || !formOrderId ? "bg-slate-300 cursor-not-allowed" : "brand-solid"}`}
            >
              Crear Envío
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

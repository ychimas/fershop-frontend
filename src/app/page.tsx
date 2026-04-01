"use client";

import { DollarSign, ShoppingCart, Truck, Users, TrendingUp, CheckCircle2, Clock, Package } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

type DashboardResponse = {
  cards: {
    monthlySalesCop: number;
    ordersActiveCount: number;
    shipmentsInTransitCount: number;
    activeClientsCount: number;
  };
  quick: {
    monthlyGoalPercent: number;
    deliveriesCompletedPercent: number;
    deliveredCount: number;
    ordersCount: number;
    avgDeliveryDays: number;
    packagesInWarehouseCount: number;
  };
  recentOrders: Array<{
    id: string;
    code: string;
    clientName: string;
    productName: string | null;
    status: "QUOTED" | "PURCHASED" | "IN_TRANSIT" | "IN_CUSTOMS" | "IN_COLOMBIA" | "DELIVERED" | "CANCELLED";
    totalCop: number | null;
  }>;
};

export default function Home() {
  const [data, setData] = useState<DashboardResponse>({
    cards: {
      monthlySalesCop: 0,
      ordersActiveCount: 0,
      shipmentsInTransitCount: 0,
      activeClientsCount: 0,
    },
    quick: {
      monthlyGoalPercent: 0,
      deliveriesCompletedPercent: 0,
      deliveredCount: 0,
      ordersCount: 0,
      avgDeliveryDays: 0,
      packagesInWarehouseCount: 0,
    },
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<DashboardResponse>("/dashboard")
      .then((res) => {
        if (cancelled) return;
        setError(null);
        setData(res);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const message = typeof e === "object" && e !== null && "message" in e ? String((e as { message: unknown }).message) : "Error cargando dashboard";
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

  const recentRows = useMemo(() => data.recentOrders.slice(0, 4), [data.recentOrders]);

  const statusLabel = (status: DashboardResponse["recentOrders"][number]["status"]) => {
    if (status === "DELIVERED") return "Entregado";
    if (status === "PURCHASED") return "Comprado";
    if (status === "IN_TRANSIT" || status === "IN_CUSTOMS" || status === "IN_COLOMBIA") return "En camino";
    if (status === "CANCELLED") return "Cancelado";
    return "Cotizado";
  };

  const statusBadgeClass = (status: DashboardResponse["recentOrders"][number]["status"]) => {
    if (status === "DELIVERED") return "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20";
    if (status === "PURCHASED") return "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-500/20";
    if (status === "IN_TRANSIT" || status === "IN_CUSTOMS" || status === "IN_COLOMBIA")
      return "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20";
    if (status === "CANCELLED") return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700";
    return "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20";
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pt-14 md:pt-0">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          Buenos días <span className="text-3xl sm:text-4xl">👋</span>
        </h2>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
          Resumen de tu operación como Personal Shopper
        </p>
      </div>

      {/* Tarjetas Superiores */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Ventas del mes</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl brand-icon-bg">
              <DollarSign className="h-5 w-5 brand-icon-fg" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{loading ? "-" : formatCop(data.cards.monthlySalesCop)}</div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">0% vs mes anterior</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Pedidos activos</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <ShoppingCart className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{loading ? "-" : data.cards.ordersActiveCount}</div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">0 pendientes de compra</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Envíos en tránsito</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl brand-icon-bg">
              <Truck className="h-5 w-5 brand-icon-fg" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{loading ? "-" : data.cards.shipmentsInTransitCount}</div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">0 llegan esta semana</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Clientes activos</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl brand-icon-bg">
              <Users className="h-5 w-5 brand-icon-fg" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{loading ? "-" : data.cards.activeClientsCount}</div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">0 nuevos este mes</p>
          </div>
        </div>
      </div>

      {error ? <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-12">
        {/* Estado rápido */}
        <div className="lg:col-span-4 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 sm:mb-8">Estado rápido</h3>
          <div className="space-y-6 sm:space-y-8">

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800">
                <TrendingUp className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">Meta mensual</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{loading ? "-" : `${data.quick.monthlyGoalPercent}%`}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-2 rounded-full bg-yellow-400" style={{ width: `${data.quick.monthlyGoalPercent}%` }}></div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">Entregas completadas</span>
                  <span className="text-sm font-bold text-emerald-500">{loading ? "-" : `${data.quick.deliveriesCompletedPercent}%`}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {loading ? "" : `${data.quick.deliveredCount} de ${data.quick.ordersCount} pedidos`}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">Tiempo prom. entrega</span>
                  <span className="text-sm font-bold text-blue-500">{loading ? "-" : `${data.quick.avgDeliveryDays}d`}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">0 días desde compra</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-900/20">
                <Package className="h-5 w-5 text-orange-500" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">Paquetes en bodega</span>
                  <span className="text-sm font-bold text-orange-500">{loading ? "-" : data.quick.packagesInWarehouseCount}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Miami warehouse</p>
              </div>
            </div>

          </div>
        </div>

        {/* Pedidos recientes */}
        <div className="lg:col-span-8 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pedidos recientes</h3>
            <Link href="/pedidos" className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
              Ver todos &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                  <th className="pb-4 pr-4">ID</th>
                  <th className="pb-4 pr-4">CLIENTE</th>
                  <th className="pb-4 pr-4">PRODUCTO</th>
                  <th className="pb-4 pr-4">ESTADO</th>
                  <th className="pb-4 text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {!loading && recentRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-sm text-slate-500 dark:text-slate-400">
                      No hay pedidos recientes.
                    </td>
                  </tr>
                ) : null}
                {recentRows.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 pr-4 font-medium text-slate-900 dark:text-white">{o.code}</td>
                    <td className="py-4 pr-4 text-slate-500 dark:text-slate-400">{o.clientName}</td>
                    <td className="py-4 pr-4 text-slate-900 dark:text-white">{o.productName ?? "-"}</td>
                    <td className="py-4 pr-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(o.status)}`}>
                        {statusLabel(o.status)}
                      </span>
                    </td>
                    <td className="py-4 font-bold text-slate-900 dark:text-white text-right">{o.totalCop === null ? "-" : formatCop(o.totalCop)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

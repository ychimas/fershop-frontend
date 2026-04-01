"use client";

import { Search, Plus, UserCircle2, Mail, Phone, MapPin, MoreHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import { apiFetch } from "@/lib/api";

type ClientRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  status: "NEW" | "ACTIVE" | "INACTIVE";
  ordersCount: number;
  totalSpentCop: number;
};

export default function Page() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [clientes, setClientes] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formCity, setFormCity] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchClientes = async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await apiFetch<ClientRow[]>("/clients");
      setClientes(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error cargando clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchClientes();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter((c) => {
      const name = c.name.toLowerCase();
      const city = (c.city ?? "").toLowerCase();
      return name.includes(q) || city.includes(q);
    });
  }, [clientes, query]);

  const formatCop = (value: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

  const initials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
    return `${first}${last}`.toUpperCase();
  };

  const statusLabel = (status: ClientRow["status"]) => {
    if (status === "ACTIVE") return "Activo";
    if (status === "INACTIVE") return "Inactivo";
    return "Nuevo";
  };

  const statusClass = (status: ClientRow["status"]) => {
    if (status === "ACTIVE") return "bg-emerald-50 text-emerald-600";
    if (status === "INACTIVE") return "bg-slate-100 text-slate-500";
    return "bg-blue-50 text-blue-600";
  };

  const onOpenModal = () => {
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormCity("");
    setIsModalOpen(true);
  };

  const onCreateCliente = async () => {
    if (!formName.trim()) return;
    try {
      setSaving(true);
      await apiFetch("/clients", {
        method: "POST",
        body: JSON.stringify({
          name: formName.trim(),
          email: formEmail.trim() || null,
          phone: formPhone.trim() || null,
          city: formCity.trim() || null,
        }),
      });
      setIsModalOpen(false);
      await fetchClientes();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error creando cliente");
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
            <UserCircle2 className="h-6 w-6 brand-icon-fg" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Clientes</h2>
            <p className="text-slate-500">{loading ? "Cargando..." : `${clientes.length} clientes registrados`}</p>
          </div>
        </div>
        <button
          onClick={onOpenModal}
          className="flex items-center gap-2 rounded-xl brand-solid px-4 py-2.5 text-sm font-medium transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nuevo Cliente
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o ciudad..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 shadow-sm"
        />
      </div>

      {/* Grid de Clientes */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}
        {!loading && !filtered.length && !error ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 text-sm text-slate-500">
            No hay clientes para mostrar.
          </div>
        ) : null}
        {filtered.map((cliente) => (
          <div key={cliente.name} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                  {initials(cliente.name)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{cliente.name}</h3>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${statusClass(cliente.status)}`}>
                    {statusLabel(cliente.status)}
                  </span>
                </div>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Mail className="h-4 w-4" />
                {cliente.email ?? "-"}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Phone className="h-4 w-4" />
                {cliente.phone ?? "-"}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <MapPin className="h-4 w-4" />
                {cliente.city ?? "-"}
              </div>
            </div>

            <div className="flex justify-between items-end pt-4 border-t border-slate-50">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Pedidos</p>
                <p className="font-bold text-slate-900">{cliente.ordersCount}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 mb-0.5">Total compras</p>
                <p className="font-bold text-slate-900">{formatCop(cliente.totalSpentCop)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nuevo Cliente"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre completo</label>
            <input value={formName} onChange={(e) => setFormName(e.target.value)} type="text" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white" placeholder="Ej. Juan Pérez" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Correo electrónico</label>
            <input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} type="email" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white" placeholder="juan@ejemplo.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Teléfono</label>
              <input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} type="tel" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white" placeholder="+57..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ciudad</label>
              <input value={formCity} onChange={(e) => setFormCity(e.target.value)} type="text" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white" placeholder="Ej. Bogotá" />
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
              disabled={saving || !formName.trim()}
              onClick={onCreateCliente}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium text-white transition-colors ${saving || !formName.trim() ? "bg-slate-300 cursor-not-allowed" : "brand-solid"}`}
            >
              Guardar Cliente
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

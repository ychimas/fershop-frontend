"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { ArrowLeft, Printer } from "lucide-react";

type BrandingSettings = {
  brand: string;
  name: string;
  subtitle: string;
};

type QuoteView = {
  id: string;
  status: string;
  currency: string;
  totalCop: number;
  note: string | null;
  createdAt: string;
  client: null | {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    city: string | null;
    address: string | null;
  };
  items: Array<{
    id: string;
    productId: string | null;
    name: string;
    quantity: number;
    unitCop: number;
    totalCop: number;
  }>;
};

const formatCop = (value: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [branding, setBranding] = useState<BrandingSettings>({ brand: "orange", name: "FerShop", subtitle: "PERSONAL SHOPPER" });
  const [quote, setQuote] = useState<QuoteView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const [brandingData, quoteData] = await Promise.all([
          apiFetch<BrandingSettings>("/settings/branding").catch(() => ({ brand: "orange", name: "FerShop", subtitle: "PERSONAL SHOPPER" })),
          apiFetch<QuoteView>(`/quotes/${id}`),
        ]);
        if (cancelled) return;
        setBranding(brandingData);
        setQuote(quoteData);
      } catch (e: unknown) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Error cargando cotización");
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const createdAt = useMemo(() => {
    if (!quote) return "";
    return new Date(quote.createdAt).toLocaleString("es-CO");
  }, [quote]);

  return (
    <div className="max-w-4xl mx-auto pt-14 md:pt-0">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>

      <div className="no-print flex items-center justify-between gap-4 mb-6">
        <button
          onClick={() => router.push("/cotizacion")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl brand-solid px-4 py-2.5 text-sm font-medium transition-colors"
          disabled={loading || !!error || !quote}
        >
          <Printer className="h-4 w-4" />
          Imprimir / Guardar PDF
        </button>
      </div>

      {error ? <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {loading ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 text-sm text-slate-500">Cargando…</div>
      ) : null}

      {quote ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-2xl font-bold text-slate-900">{branding.name}</div>
              <div className="text-xs font-semibold tracking-wider text-slate-400">{branding.subtitle}</div>
              <div className="mt-4 text-sm text-slate-500">Cotización #{quote.id.slice(0, 8)}</div>
              <div className="text-sm text-slate-500">{createdAt}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</div>
              <div className="text-2xl font-bold text-slate-900">{formatCop(quote.totalCop)}</div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Cliente</div>
              <div className="font-bold text-slate-900">{quote.client?.name ?? "-"}</div>
              <div className="text-sm text-slate-500">{quote.client?.email ?? ""}</div>
              <div className="text-sm text-slate-500">{quote.client?.phone ?? ""}</div>
              <div className="text-sm text-slate-500">{quote.client?.city ?? ""}</div>
              <div className="text-sm text-slate-500">{quote.client?.address ?? ""}</div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nota</div>
              <div className="text-sm text-slate-700">{quote.note ?? "-"}</div>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-xl border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold tracking-wider text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3 text-right">Cant.</th>
                  <th className="px-4 py-3 text-right">Unitario</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quote.items.map((i) => (
                  <tr key={i.id}>
                    <td className="px-4 py-3 text-slate-900">{i.name}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{i.quantity}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{formatCop(i.unitCop)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCop(i.totalCop)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <div className="w-full sm:w-80 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total</span>
                <span className="font-bold text-slate-900">{formatCop(quote.totalCop)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


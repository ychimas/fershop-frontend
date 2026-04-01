"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

const palettes = [
  { key: "orange", name: "Naranja", color: "#f59e0b" },
  { key: "emerald", name: "Esmeralda", color: "#10b981" },
  { key: "blue", name: "Azul", color: "#3b82f6" },
  { key: "red", name: "Rojo", color: "#ef4444" },
  { key: "violet", name: "Violeta", color: "#8b5cf6" },
  { key: "teal", name: "Verde azulado", color: "#14b8a6" },
  { key: "rose", name: "Rosa", color: "#f43f5e" },
  { key: "indigo", name: "Índigo", color: "#6366f1" },
];

type BrandingSettings = {
  brand: string;
  name: string;
  subtitle: string;
};

export default function Page() {
  const [brand, setBrand] = useState<string>("orange");
  const [brandName, setBrandName] = useState("FerShop");
  const [brandSubtitle, setBrandSubtitle] = useState("PERSONAL SHOPPER");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch<BrandingSettings>("/settings/branding")
      .then((res) => {
        if (cancelled) return;
        document.documentElement.setAttribute("data-brand", res.brand);
        setBrand(res.brand);
        setBrandName(res.name);
        setBrandSubtitle(res.subtitle);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const applyBrand = (b: string) => {
    document.documentElement.setAttribute("data-brand", b);
    setBrand(b);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight capitalize">Configuración</h2>
        <p className="text-slate-500">Preferencias del sistema</p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Nombre del proyecto</h3>
        <p className="text-sm text-slate-500 mb-4">Define el nombre y subtítulo visibles en la identidad principal de la plataforma</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nombre de marca</label>
            <input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              type="text"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
              placeholder="FerShop"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Subtítulo</label>
            <input
              value={brandSubtitle}
              onChange={(e) => setBrandSubtitle(e.target.value)}
              type="text"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
              placeholder="PERSONAL SHOPPER"
            />
          </div>
        </div>
        <div className="pt-4">
          <button
            onClick={async () => {
              setLoading(true);
              try {
                setError(null);
                const res = await apiFetch<BrandingSettings>("/settings/branding", {
                  method: "PUT",
                  body: JSON.stringify({ brand, name: brandName, subtitle: brandSubtitle }),
                });
                applyBrand(res.brand);
                setBrandName(res.name);
                setBrandSubtitle(res.subtitle);
                window.dispatchEvent(new CustomEvent("branding-updated", { detail: res }));
              } catch (e: unknown) {
                const message = typeof e === "object" && e !== null && "message" in e ? String((e as { message: unknown }).message) : "No se pudo guardar el nombre";
                setError(message);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading || !brandName.trim()}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors ${loading || !brandName.trim() ? "bg-slate-300 cursor-not-allowed" : "brand-solid"}`}
          >
            Guardar nombre
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Identidad de Marca</h3>
        <p className="text-sm text-slate-500 mb-4">Elige una paleta para la interfaz</p>
        {error ? <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700 mb-4">{error}</div> : null}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {palettes.map((p) => (
            <button
              key={p.key}
              onClick={async () => {
                setLoading(true);
                try {
                  setError(null);
                  const res = await apiFetch<BrandingSettings>("/settings/branding", {
                    method: "PUT",
                    body: JSON.stringify({ brand: p.key, name: brandName, subtitle: brandSubtitle }),
                  });
                  applyBrand(res.brand);
                  window.dispatchEvent(new CustomEvent("branding-updated", { detail: res }));
                } catch (e: unknown) {
                  const message = typeof e === "object" && e !== null && "message" in e ? String((e as { message: unknown }).message) : "No se pudo guardar la marca";
                  setError(message);
                } finally {
                  setLoading(false);
                }
              }}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-colors ${
                brand === p.key ? "border-slate-900" : "border-slate-200 hover:border-slate-400"
              }`}
              aria-pressed={brand === p.key}
              disabled={loading}
            >
              <span
                className="h-10 w-10 rounded-xl shadow-inner"
                style={{ backgroundColor: p.color }}
              />
              <span className="text-xs font-medium text-slate-700">{p.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

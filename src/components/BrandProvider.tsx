"use client";
import { useEffect } from "react";
import { apiFetch } from "@/lib/api";

type BrandingSettings = {
  brand: string;
  name: string;
  subtitle: string;
};

export function BrandProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let cancelled = false;
    const applyBranding = (settings: BrandingSettings) => {
      document.documentElement.setAttribute("data-brand", settings.brand);
    };

    apiFetch<BrandingSettings>("/settings/branding")
      .then((res) => {
        if (cancelled) return;
        applyBranding(res);
      })
      .catch(() => {});

    const handleBrandingUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<BrandingSettings>;
      if (!customEvent.detail) return;
      applyBranding(customEvent.detail);
    };

    window.addEventListener("branding-updated", handleBrandingUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("branding-updated", handleBrandingUpdated);
    };
  }, []);
  return <>{children}</>;
}

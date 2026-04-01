'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { apiFetch } from '@/lib/api';
import {
  LayoutDashboard,
  Calculator,
  FileText,
  Users,
  ClipboardList,
  ShoppingBag,
  Package,
  Plane,
  DollarSign,
  Settings,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  BarChart,
  Menu,
  X
} from 'lucide-react';

const menuSections = [
  {
    title: 'PRINCIPAL',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Calculadora', href: '/calculadora', icon: Calculator },
      { name: 'Cotización', href: '/cotizacion', icon: FileText },
    ]
  },
  {
    title: 'GESTIÓN',
    items: [
      { name: 'Clientes', href: '/clientes', icon: Users },
      { name: 'Pedidos', href: '/pedidos', icon: ClipboardList },
      { name: 'Compras EE.UU', href: '/compras', icon: ShoppingBag },
      { name: 'Productos', href: '/productos', icon: Package },
    ]
  },
  {
    title: 'LOGÍSTICA',
    items: [
      { name: 'Envíos', href: '/envios', icon: Plane },
      { name: 'Ventas Colombia', href: '/ventas', icon: DollarSign },
      { name: 'Reportes', href: '/reportes', icon: BarChart },
      { name: 'Configuración', href: '/configuracion', icon: Settings },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [brandName, setBrandName] = useState('FerShop');
  const [brandSubtitle, setBrandSubtitle] = useState('PERSONAL SHOPPER');
  const { theme, setTheme } = useTheme();
  const currentTheme = theme ?? 'light';

  useEffect(() => {
    let cancelled = false;

    apiFetch<{ brand: string; name: string; subtitle: string }>('/settings/branding')
      .then((res) => {
        if (cancelled) return;
        setBrandName(res.name);
        setBrandSubtitle(res.subtitle);
      })
      .catch(() => { });

    const handleBrandingUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ brand: string; name: string; subtitle: string }>;
      if (!customEvent.detail) return;
      setBrandName(customEvent.detail.name);
      setBrandSubtitle(customEvent.detail.subtitle);
    };

    window.addEventListener('branding-updated', handleBrandingUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener('branding-updated', handleBrandingUpdated);
    };
  }, []);

  return (
    <>
      {/* Botón Hamburguesa para Mobile */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A1F2C] text-white shadow-lg"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Overlay para Mobile */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-40 flex h-full flex-col bg-[#1A1F2C] text-white transition-all duration-300
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'w-64 md:w-20' : 'w-64'}
      `}>
        {/* Botón para colapsar/expandir (Solo Desktop) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-8 h-6 w-6 items-center justify-center rounded-full bg-white text-slate-800 shadow-md hover:bg-slate-50 z-10"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        {/* Header del Sidebar */}
        <div className={`flex h-24 items-center ${isCollapsed ? 'md:justify-center px-6 md:px-0' : 'px-6'}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl brand-solid">
              <ShoppingCart className="h-6 w-6 brand-on-text" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col overflow-hidden whitespace-nowrap">
                <span className="text-xl font-bold leading-tight brand-accent-text">{brandName}</span>
                <span className="text-[10px] font-semibold text-slate-400 tracking-wider">{brandSubtitle}</span>
              </div>
            )}
          </div>
        </div>

        {/* Navegación */}
        <nav className="custom-scrollbar flex-1 space-y-8 overflow-y-auto px-3 pb-6">
          {menuSections.map((section) => (
            <div key={section.title} className="flex flex-col">
              {(!isCollapsed || isMobileOpen) ? (
                <h3 className="mb-3 px-3 text-xs font-bold tracking-wider text-slate-500">
                  {section.title}
                </h3>
              ) : (
                <div className="mb-3 hidden md:block h-px w-full bg-white/10" />
              )}

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      title={isCollapsed && !isMobileOpen ? item.name : ''}
                      className={`flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : 'px-3'
                        } ${isActive
                          ? 'brand-nav-active'
                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                        }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {(!isCollapsed || isMobileOpen) && <span>{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Botón Theme Toggle */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
            className={`flex w-full items-center gap-3 rounded-xl py-2.5 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all duration-200 ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : 'px-3'
              }`}
            title={isCollapsed && !isMobileOpen ? (currentTheme === 'dark' ? 'Modo Claro' : 'Modo Oscuro') : ''}
          >
            {currentTheme === 'dark' ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
            {(!isCollapsed || isMobileOpen) && <span>{currentTheme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>}
          </button>
        </div>
      </div>
    </>
  );
}

"use client";

import { Search, Plus, Package, LayoutGrid, List, ImageUp, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import { apiFetch } from "@/lib/api";
import Image from "next/image";

type ProductRow = {
  id: string;
  name: string;
  category: "TECHNOLOGY" | "ACCESSORIES" | "FOOTWEAR" | "CLOTHING" | "OTHER";
  description: string | null;
  stock: number;
  priceUsd: number | null;
  priceCop: number | null;
  imageUrl: string | null;
};

const MAX_IMAGE_BYTES = 800 * 1024;
const MAX_IMAGE_DIMENSION = 1280;

async function fileToOptimizedDataUrl(file: File): Promise<string> {
  const imageUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo procesar la imagen"));
    img.src = imageUrl;
  });

  const ratio = Math.min(MAX_IMAGE_DIMENSION / image.width, MAX_IMAGE_DIMENSION / image.height, 1);
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo preparar la imagen");
  ctx.drawImage(image, 0, 0, width, height);

  let quality = 0.9;
  let output = canvas.toDataURL("image/jpeg", quality);

  while (output.length > MAX_IMAGE_BYTES * 1.37 && quality > 0.45) {
    quality = Number((quality - 0.1).toFixed(2));
    output = canvas.toDataURL("image/jpeg", quality);
  }

  if (output.length > MAX_IMAGE_BYTES * 1.37) {
    throw new Error("La imagen es muy pesada. Usa una imagen más liviana.");
  }

  return output;
}

export default function Page() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [productos, setProductos] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<ProductRow["category"] | "">("");
  const [formStock, setFormStock] = useState<string>("");
  const [formPriceUsd, setFormPriceUsd] = useState<string>("");
  const [formPriceCop, setFormPriceCop] = useState<string>("");
  const [formImageUrl, setFormImageUrl] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
  const [editImageUrl, setEditImageUrl] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const fetchProductos = async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await apiFetch<ProductRow[]>("/products");
      setProductos(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error cargando productos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProductos();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter((p) => p.name.toLowerCase().includes(q));
  }, [productos, query]);

  const formatCop = (value: number | null) =>
    value === null ? "-" : new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
  const formatUsd = (value: number | null) =>
    value === null ? "" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

  const categoryLabel = (category: ProductRow["category"]) => {
    if (category === "TECHNOLOGY") return "Tecnología";
    if (category === "ACCESSORIES") return "Accesorios";
    if (category === "FOOTWEAR") return "Calzado";
    if (category === "CLOTHING") return "Ropa";
    return "Otro";
  };

  const categoryClass = (category: ProductRow["category"]) => {
    if (category === "TECHNOLOGY") return "bg-orange-50 text-orange-600 border border-orange-100";
    if (category === "ACCESSORIES") return "bg-yellow-50 text-yellow-600 border border-yellow-100";
    if (category === "FOOTWEAR") return "bg-blue-50 text-blue-600 border border-blue-100";
    if (category === "CLOTHING") return "bg-emerald-50 text-emerald-600 border border-emerald-100";
    return "bg-slate-100 text-slate-600 border border-slate-200";
  };

  const onOpenModal = () => {
    setFormName("");
    setFormCategory("");
    setFormStock("");
    setFormPriceUsd("");
    setFormPriceCop("");
    setFormImageUrl("");
    setIsModalOpen(true);
  };

  const onOpenImageModal = (product: ProductRow) => {
    setSelectedProduct(product);
    setEditImageUrl(product.imageUrl ?? "");
    setIsImageModalOpen(true);
  };

  const onSelectImage = async (file: File | null) => {
    try {
      if (!file) {
        setFormImageUrl("");
        return;
      }

      const dataUrl = await fileToOptimizedDataUrl(file);
      setFormImageUrl(dataUrl);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo leer la imagen");
    }
  };

  const onSelectEditImage = async (file: File | null) => {
    try {
      if (!file) {
        return;
      }
      const dataUrl = await fileToOptimizedDataUrl(file);
      setEditImageUrl(dataUrl);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo leer la imagen");
    }
  };

  const onCreateProducto = async () => {
    if (!formName.trim()) return;
    const stock = formStock.trim() === "" ? 0 : Number(formStock);
    const priceUsd = formPriceUsd.trim() === "" ? null : Number(formPriceUsd);
    const priceCop = formPriceCop.trim() === "" ? null : Number(formPriceCop);
    try {
      setSaving(true);
      await apiFetch("/products", {
        method: "POST",
        body: JSON.stringify({
          name: formName.trim(),
          category: formCategory || "OTHER",
          stock: Number.isFinite(stock) ? stock : 0,
          priceUsd: priceUsd !== null && Number.isFinite(priceUsd) ? priceUsd : null,
          priceCop: priceCop !== null && Number.isFinite(priceCop) ? priceCop : null,
          imageUrl: formImageUrl || null,
        }),
      });
      setIsModalOpen(false);
      await fetchProductos();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error creando producto");
    } finally {
      setSaving(false);
    }
  };

  const onSaveProductImage = async () => {
    if (!selectedProduct) return;
    try {
      setSaving(true);
      await apiFetch(`/products/${selectedProduct.id}/image`, {
        method: "PATCH",
        body: JSON.stringify({
          imageUrl: editImageUrl || null,
        }),
      });
      setIsImageModalOpen(false);
      setSelectedProduct(null);
      await fetchProductos();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error actualizando imagen");
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
            <Package className="h-6 w-6 brand-icon-fg" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Productos</h2>
            <p className="text-slate-500">Catálogo de 8 productos</p>
          </div>
        </div>
        <button
          onClick={onOpenModal}
          className="flex items-center gap-2 rounded-xl brand-solid px-4 py-2.5 text-sm font-medium transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nuevo Producto
        </button>
      </div>

      {/* Controles (Buscador y Vistas) */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar producto o categoría..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <button className="rounded-xl bg-slate-100 p-2 text-slate-700">
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button className="rounded-xl p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors">
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid de Productos */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}
        {!loading && !filtered.length && !error ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 text-sm text-slate-500">
            No hay productos para mostrar.
          </div>
        ) : null}
        {filtered.map((producto) => (
          <div key={producto.id} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
            <div className="flex h-40 w-full items-center justify-center rounded-2xl bg-slate-50 mb-6 overflow-hidden">
              {producto.imageUrl ? (
                <Image unoptimized src={producto.imageUrl} alt={producto.name} width={640} height={320} className="h-full w-full object-cover" />
              ) : (
                <div className="text-3xl font-bold text-slate-300">{producto.name.slice(0, 1).toUpperCase()}</div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col flex-1">
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider w-max mb-3 ${categoryClass(producto.category)}`}>
                {categoryLabel(producto.category)}
              </span>

              <h3 className="font-bold text-slate-900 mb-2">{producto.name}</h3>

              <div className="flex items-end gap-2 mb-4">
                <span className="text-xl font-bold text-slate-900">{formatCop(producto.priceCop)}</span>
                <span className="text-sm text-slate-400 mb-0.5">{formatUsd(producto.priceUsd)}</span>
              </div>

              <div className="mt-auto">
                {producto.stock > 0 ? (
                  <span className="text-sm font-medium text-emerald-600">
                    {producto.stock} disponibles
                  </span>
                ) : (
                  <span className="text-sm font-medium text-red-500">
                    Agotado
                  </span>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => onOpenImageModal(producto)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <ImageUp className="h-4 w-4" />
                    {producto.imageUrl ? "Cambiar imagen" : "Agregar imagen"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nuevo Producto"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre del Producto</label>
            <input value={formName} onChange={(e) => setFormName(e.target.value)} type="text" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white" placeholder="Ej. Nike Air Max 90" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Imagen del producto</label>
            <input onChange={(e) => void onSelectImage(e.target.files?.[0] ?? null)} type="file" accept="image/*" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white file:mr-4 file:rounded-lg file:border-0 file:bg-slate-200 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 dark:file:bg-slate-700 dark:file:text-slate-200" />
            <p className="text-xs text-slate-400">Se optimiza antes de guardar. Máximo aproximado: 800 KB.</p>
            {formImageUrl ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50">
                <Image unoptimized src={formImageUrl} alt="Vista previa" width={640} height={320} className="h-40 w-full object-cover" />
              </div>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Categoría</label>
              <select value={formCategory} onChange={(e) => setFormCategory(e.target.value as ProductRow["category"])} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white">
                <option value="">Seleccionar</option>
                <option value="TECHNOLOGY">Tecnología</option>
                <option value="ACCESSORIES">Accesorios</option>
                <option value="FOOTWEAR">Calzado</option>
                <option value="CLOTHING">Ropa</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Stock Inicial</label>
              <input value={formStock} onChange={(e) => setFormStock(e.target.value)} type="number" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white" placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Precio USD</label>
              <input value={formPriceUsd} onChange={(e) => setFormPriceUsd(e.target.value)} type="number" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Precio COP</label>
              <input value={formPriceCop} onChange={(e) => setFormPriceCop(e.target.value)} type="number" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white" placeholder="0" />
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
              onClick={onCreateProducto}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium text-white transition-colors ${saving || !formName.trim() ? "bg-slate-300 cursor-not-allowed" : "brand-solid"}`}
            >
              Guardar Producto
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isImageModalOpen}
        onClose={() => {
          setIsImageModalOpen(false);
          setSelectedProduct(null);
        }}
        title={selectedProduct ? `Imagen: ${selectedProduct.name}` : "Editar imagen"}
      >
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50">
            {editImageUrl ? (
              <Image unoptimized src={editImageUrl} alt={selectedProduct?.name ?? "Imagen del producto"} width={640} height={320} className="h-48 w-full object-cover" />
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-slate-400">Este producto no tiene imagen.</div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Reemplazar imagen</label>
            <input
              onChange={(e) => void onSelectEditImage(e.target.files?.[0] ?? null)}
              type="file"
              accept="image/*"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:text-white file:mr-4 file:rounded-lg file:border-0 file:bg-slate-200 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 dark:file:bg-slate-700 dark:file:text-slate-200"
            />
            <p className="text-xs text-slate-400">La imagen se reduce automáticamente antes de guardarse.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setEditImageUrl("")}
              disabled={saving || !editImageUrl}
              className="flex-1 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Eliminar imagen
              </span>
            </button>
            <button
              onClick={onSaveProductImage}
              disabled={saving || !selectedProduct}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium text-white transition-colors ${saving || !selectedProduct ? "bg-slate-300 cursor-not-allowed" : "brand-solid"}`}
            >
              Guardar cambios
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

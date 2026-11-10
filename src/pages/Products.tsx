import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getAllProducts } from "../api/products";
import { getProductRatingStats, syncRealtimeFromBackend } from "../api/realtimeSync";
import ShopCard, { type Product } from "../components/product/ShopCard";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const CATEGORIES = [
  "Motor",
  "Neumáticos",
  "Carrocería",
  "Filtros",
  "Suspensión",
  "Frenos",
  "Eléctrico",
  "Accesorios",
  "Transmisión",
  "Lubricantes",
];

type SortOption = "name" | "price-asc" | "price-desc" | "rating-desc" | "reviews-desc";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const productIdParam = searchParams.get("productId");

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [onlyTopRated, setOnlyTopRated] = useState<boolean>(false);
  const [reviewTick, setReviewTick] = useState<number>(0);

  const loadProducts = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await getAllProducts();
      setProducts(data);
      setError(null);
    } catch (err: any) {
      if (!silent) setError(err.message || "Error al cargar productos");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts(false);
    syncRealtimeFromBackend();

    const handleRealtimeUpdate = () => {
      setReviewTick((t) => t + 1);
      loadProducts(true);
    };

    window.addEventListener("hurios-realtime-updated", handleRealtimeUpdate);
    window.addEventListener("storage", handleRealtimeUpdate);
    return () => {
      window.removeEventListener("hurios-realtime-updated", handleRealtimeUpdate);
      window.removeEventListener("storage", handleRealtimeUpdate);
    };
  }, [loadProducts]);

  useEffect(() => {
    let filtered = [...products];

    if (selectedCategory) {
      filtered = filtered.filter(
        (p) => (p.category || "").toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filtered = filtered.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    if (onlyTopRated) {
      filtered = filtered.filter(
        (p) => getProductRatingStats(p.id, p.name).average >= 4.5
      );
    }

    if (sortBy === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "price-asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating-desc") {
      filtered.sort((a, b) => {
        const rA = getProductRatingStats(a.id, a.name);
        const rB = getProductRatingStats(b.id, b.name);
        if (rB.average !== rA.average) return rB.average - rA.average;
        return rB.count - rA.count;
      });
    } else if (sortBy === "reviews-desc") {
      filtered.sort((a, b) => {
        const rA = getProductRatingStats(a.id, a.name);
        const rB = getProductRatingStats(b.id, b.name);
        return rB.count - rA.count;
      });
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategory, priceRange, sortBy, onlyTopRated, reviewTick]);

  // Si viene productId desde una notificación, hacer scroll suave al producto
  useEffect(() => {
    if (!productIdParam || products.length === 0) return;
    const el = document.getElementById(`product-card-${productIdParam}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [productIdParam, products.length]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setPriceRange([0, 10000]);
    setSortBy("name");
    setOnlyTopRated(false);
    if (productIdParam) {
      searchParams.delete("productId");
      setSearchParams(searchParams, { replace: true });
    }
  };

  const clearFocusedProduct = () => {
    if (productIdParam) {
      searchParams.delete("productId");
      setSearchParams(searchParams, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Catálogo de Productos</h1>
              <p className="text-sm text-gray-600">
                Explora repuestos originales con stock actualizado en tiempo real y valoraciones de clientes.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSortBy(sortBy === "rating-desc" ? "name" : "rating-desc");
                }}
                className={`px-3.5 py-2 rounded-md text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  sortBy === "rating-desc"
                    ? "bg-[var(--Primary_5)] text-white border-[var(--Primary_5)]"
                    : "bg-white text-[var(--Primary_5)] border-gray-300 hover:bg-[#ebf3fa]"
                }`}
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth={2}>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                Mejor valorados
              </button>
              <button
                type="button"
                onClick={() => setOnlyTopRated((prev) => !prev)}
                className={`px-3.5 py-2 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                  onlyTopRated
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                Solo 4.5★ o más
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Cargando productos...</div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">{error}</div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar por nombre o descripción..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--Primary_5)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--Primary_5)]"
                    >
                      <option value="">Todas</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ordenar por</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--Primary_5)]"
                    >
                      <option value="name">Nombre (A-Z)</option>
                      <option value="rating-desc">Mejor valorados (★)</option>
                      <option value="reviews-desc">Más comentados</option>
                      <option value="price-asc">Precio: Menor a Mayor</option>
                      <option value="price-desc">Precio: Mayor a Menor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio máximo: S/ {priceRange[1]}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      step="50"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap justify-between items-center gap-2">
                  <p className="text-sm text-gray-600">
                    Mostrando {filteredProducts.length} de {products.length} productos
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="text-sm text-[var(--Primary_5)] hover:underline cursor-pointer"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No se encontraron productos con los filtros aplicados</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredProducts.map((p) => (
                    <ShopCard
                      key={p.id}
                      product={p}
                      autoOpen={productIdParam !== null && Number(productIdParam) === p.id}
                      onCloseModal={clearFocusedProduct}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAllProducts } from "../api/products";
import { getProductRatingStats } from "../api/realtimeSync";
import ShopCard, { type Product } from "../components/product/ShopCard";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const CATEGORIES: { [key: string]: string } = {
  "1": "Motor",
  "2": "Neumáticos",
  "3": "Carrocería",
  "4": "Filtros",
  "5": "Suspensión",
  "6": "Frenos",
  "7": "Eléctrico",
  "8": "Accesorios",
  "9": "Transmisión",
  "10": "Lubricantes",
};

type SortOption = "name" | "rating-desc" | "reviews-desc" | "price-asc" | "price-desc";

export function Category() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("rating-desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0);

  const categoryName = categoryId ? CATEGORIES[categoryId] : undefined;

  const fetchCategoryProducts = useCallback(
    async (silent = false) => {
      if (!categoryName) {
        navigate("/products");
        return;
      }

      try {
        if (!silent) setLoading(true);
        const allProducts = await getAllProducts();
        const filtered = allProducts.filter(
          (product) =>
            (product.category || "").toLowerCase() === categoryName.toLowerCase()
        );
        setProducts(filtered);
        setError(null);
      } catch (err: any) {
        if (!silent) setError(err.message || "Error al cargar productos");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [categoryName, navigate]
  );

  useEffect(() => {
    fetchCategoryProducts(false);

    const onRealtime = () => {
      setTick((t) => t + 1);
      fetchCategoryProducts(true);
    };
    window.addEventListener("hurios-realtime-updated", onRealtime);
    window.addEventListener("storage", onRealtime);
    return () => {
      window.removeEventListener("hurios-realtime-updated", onRealtime);
      window.removeEventListener("storage", onRealtime);
    };
  }, [fetchCategoryProducts]);

  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === "rating-desc") {
      const rA = getProductRatingStats(a.id, a.name);
      const rB = getProductRatingStats(b.id, b.name);
      if (rB.average !== rA.average) return rB.average - rA.average;
      return rB.count - rA.count;
    }
    if (sortBy === "reviews-desc") {
      return (
        getProductRatingStats(b.id, b.name).count -
        getProductRatingStats(a.id, a.name).count
      );
    }
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <button
                onClick={() => navigate("/products")}
                className="text-[var(--Primary_5)] hover:underline mb-4 flex items-center gap-2 cursor-pointer"
              >
                <svg
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Volver a productos
              </button>
              <h1 className="text-3xl font-bold text-gray-900">{categoryName}</h1>
              <p className="text-gray-600 mt-1">
                {products.length} {products.length === 1 ? "producto" : "productos"} encontrado
                {products.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Ordenar por:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--Primary_5)]"
              >
                <option value="rating-desc">Mejor valorados (★)</option>
                <option value="reviews-desc">Más comentados</option>
                <option value="name">Nombre (A-Z)</option>
                <option value="price-asc">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--Primary_5)]"></div>
              <p className="mt-4 text-gray-600">Cargando productos...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg inline-block">
                {error}
              </div>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No se encontraron productos en esta categoría</p>
              <button
                onClick={() => navigate("/products")}
                className="mt-4 px-6 py-2 bg-[var(--Primary_5)] text-white rounded-md hover:bg-[#1e4a6f] transition-colors cursor-pointer"
              >
                Ver todos los productos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {sortedProducts.map((product) => (
                <ShopCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

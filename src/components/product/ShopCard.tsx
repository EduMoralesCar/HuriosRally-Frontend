// src/components/product/ShopCard.tsx
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "../../context/CartContext";
import { getRole } from "../../utils/token";
import { API_BASE_URL } from "../../config/api";
import {
  getLocalStockDeltas,
  getProductRatingStats,
  getReviewsForProduct,
  submitProductReview,
  type ProductReview,
} from "../../api/realtimeSync";

export type Product = {
  id: number;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  stock?: number;
  category?: string;
};

export const ShopCard: React.FC<{
  product: Product;
  autoOpen?: boolean;
  onCloseModal?: () => void;
}> = ({ product, autoOpen = false, onCloseModal }) => {
  const API_BASE = API_BASE_URL;
  const { addToCart, isOpen, toggleCart } = useCart();
  const isAdmin = getRole() === "ADMINISTRADOR";

  const [showDetails, setShowDetails] = useState<boolean>(autoOpen);
  const [imgError, setImgError] = useState<boolean>(false);
  const [reviews, setReviews] = useState<ProductReview[]>(() =>
    getReviewsForProduct(product.id, product.name)
  );
  const [ratingStats, setRatingStats] = useState(() =>
    getProductRatingStats(product.id, product.name)
  );
  const [liveStock, setLiveStock] = useState<number | undefined>(() => {
    const deltas = getLocalStockDeltas();
    return deltas[product.id] !== undefined ? deltas[product.id] : product.stock;
  });

  // Review form state
  const [newRating, setNewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [newComment, setNewComment] = useState<string>("");
  const [reviewerName, setReviewerName] = useState<string>(() => {
    return (
      sessionStorage.getItem("hurios_user_name") ||
      localStorage.getItem("hurios_user_name") ||
      ""
    );
  });
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (autoOpen) {
      setShowDetails(true);
    }
  }, [autoOpen]);

  useEffect(() => {
    const refreshLiveMeta = () => {
      setReviews(getReviewsForProduct(product.id, product.name));
      setRatingStats(getProductRatingStats(product.id, product.name));
      const deltas = getLocalStockDeltas();
      setLiveStock(deltas[product.id] !== undefined ? deltas[product.id] : product.stock);
    };

    refreshLiveMeta();
    window.addEventListener("hurios-realtime-updated", refreshLiveMeta);
    window.addEventListener("storage", refreshLiveMeta);
    return () => {
      window.removeEventListener("hurios-realtime-updated", refreshLiveMeta);
      window.removeEventListener("storage", refreshLiveMeta);
    };
  }, [product.id, product.name, product.stock]);

  const rawUrl = product.imageUrl || (product as any).image_url;
  const imageUrl = rawUrl
    ? rawUrl.startsWith("http") ||
      rawUrl.startsWith("/assets") ||
      rawUrl.startsWith("blob:")
      ? rawUrl
      : `${API_BASE}${rawUrl}`
    : "/assets/imgs/placeholder.svg";

  const handleImageError = () => {
    setImgError(true);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({ ...product, stock: liveStock });
    if (!isOpen) {
      toggleCart();
    }
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    if (onCloseModal) onCloseModal();
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingReview(true);
    try {
      const displayName = reviewerName.trim() || "Cliente Verificado";
      sessionStorage.setItem("hurios_user_name", displayName);
      await submitProductReview({
        productId: product.id,
        productName: product.name,
        userName: displayName,
        rating: newRating,
        comment: newComment.trim(),
        verifiedPurchase: true,
      });
      setNewComment("");
      setReviewSuccess("¡Gracias! Tu valoración se publicó en tiempo real.");
      setReviews(getReviewsForProduct(product.id, product.name));
      setRatingStats(getProductRatingStats(product.id, product.name));
      setTimeout(() => setReviewSuccess(null), 4000);
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (avg: number, size = 14) => {
    const rounded = Math.round(avg);
    return (
      <div className="flex items-center gap-0.5" aria-label={`Calificación ${avg} de 5`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={star <= rounded ? "#f59e0b" : "none"}
            stroke={star <= rounded ? "#f59e0b" : "#cbd5e1"}
            strokeWidth={2}
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <article
      id={`product-card-${product.id}`}
      className="bg-white rounded-lg shadow p-4 flex flex-col transition-transform hover:scale-[1.02] border border-gray-100"
    >
      {/* Imagen */}
      <div
        onClick={() => setShowDetails(true)}
        className="aspect-[4/3] w-full mb-3 overflow-hidden rounded cursor-pointer relative bg-gray-50"
      >
        <img
          src={imgError ? "/assets/imgs/placeholder.svg" : imageUrl}
          alt={product.name}
          className="object-cover h-full w-full"
          onError={handleImageError}
        />
        {product.category && (
          <span className="absolute top-2 left-2 bg-[var(--Primary_5)]/90 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded">
            {product.category}
          </span>
        )}
      </div>

      {/* Valoración promedio */}
      <div
        onClick={() => setShowDetails(true)}
        className="flex items-center justify-between mb-1.5 cursor-pointer"
      >
        <div className="flex items-center gap-1.5">
          {renderStars(ratingStats.average, 14)}
          <span className="text-xs font-bold text-gray-800">
            {ratingStats.average.toFixed(1)}
          </span>
        </div>
        <span className="text-xs text-gray-500 hover:text-[var(--Primary_5)]">
          ({ratingStats.count} {ratingStats.count === 1 ? "opinión" : "opiniones"})
        </span>
      </div>

      {/* Título y descripción */}
      <h3
        onClick={() => setShowDetails(true)}
        className="text-lg font-semibold mb-1 cursor-pointer hover:text-[var(--Primary_5)] line-clamp-2"
      >
        {product.name}
      </h3>
      <p className="text-sm text-gray-600 flex-1 line-clamp-2 mb-2">
        {product.description || "Sin descripción"}
      </p>

      {/* Precio y Stock */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-xl font-bold text-[var(--Primary_5)]">
          S/ {Number(product.price).toFixed(2)}
        </div>
        {liveStock !== undefined && liveStock > 0 && (
          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
            Stock: {liveStock} und.
          </span>
        )}
      </div>

      {/* Advertencia de stock bajo */}
      {liveStock !== undefined && liveStock < 10 && liveStock > 0 && (
        <div className="text-xs text-orange-600 font-medium mb-2 flex items-center gap-1 bg-orange-50 px-2 py-1 rounded">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          ¡Solo quedan {liveStock} unidades!
        </div>
      )}
      {liveStock !== undefined && liveStock <= 0 && (
        <div className="text-xs text-red-600 font-medium mb-2 flex items-center gap-1 bg-red-50 px-2 py-1 rounded">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          Agotado
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex flex-col gap-2 mt-1">
        <button
          onClick={handleAddToCart}
          className="w-full px-4 py-2 bg-[var(--Primary_5)] text-white rounded-md font-medium hover:bg-[#1e4a6f] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--Primary_5)] cursor-pointer"
          aria-label={`Añadir ${product.name} al carrito`}
          disabled={isAdmin || (liveStock !== undefined && liveStock <= 0)}
          title={isAdmin ? "Vista de administrador activa" : undefined}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx={9} cy={21} r={1}></circle>
            <circle cx={20} cy={21} r={1}></circle>
            <path d="m1 1 4 4 14 1-1 7H6"></path>
          </svg>
          {isAdmin
            ? "Solo para clientes"
            : liveStock !== undefined && liveStock <= 0
            ? "Agotado"
            : "Añadir al carrito"}
        </button>
        <button
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            setShowDetails(true);
          }}
          className="w-full px-4 py-2 border border-[var(--Primary_5)] text-[var(--Primary_5)] rounded-md font-medium hover:bg-[var(--Primary_5)] hover:text-white transition-colors text-sm cursor-pointer"
          aria-label={`Ver detalles y comentarios de ${product.name}`}
        >
          Ver detalles y opiniones ({ratingStats.count})
        </button>
      </div>

      {showDetails &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            onClick={handleCloseDetails}
          >
            <div
              className="bg-white rounded-xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleCloseDetails}
                aria-label="Cerrar detalles"
                className="sticky top-3 float-right mr-3 mt-3 z-10 text-gray-600 hover:text-gray-900 p-2 rounded-full bg-white shadow hover:bg-gray-100 cursor-pointer"
              >
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div className="md:flex md:gap-6 items-start p-5 sm:p-6">
                <div className="md:w-2/5 w-full flex flex-col items-center justify-center bg-gray-50 p-4 rounded-lg border border-gray-100 mb-4 md:mb-0">
                  <img
                    src={imgError ? "/assets/imgs/placeholder.svg" : imageUrl}
                    alt={product.name}
                    className="w-full h-auto max-h-72 object-contain"
                    onError={handleImageError}
                  />
                </div>

                <div className="md:w-3/5 w-full flex flex-col gap-3">
                  {product.category && (
                    <span className="inline-block w-fit text-xs font-semibold uppercase tracking-wide bg-[#ebf3fa] text-[var(--Primary_5)] px-2.5 py-1 rounded">
                      Categoría: {product.category}
                    </span>
                  )}
                  <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>

                  {/* Resumen de estrellas */}
                  <div className="flex items-center gap-3">
                    {renderStars(ratingStats.average, 18)}
                    <span className="text-sm font-bold text-gray-800">
                      {ratingStats.average.toFixed(1)} de 5
                    </span>
                    <span className="text-sm text-gray-500">
                      ({ratingStats.count} valoraciones de clientes)
                    </span>
                  </div>

                  <div className="flex items-baseline gap-4 my-1">
                    <div className="text-3xl font-bold text-[var(--Primary_5)]">
                      S/ {Number(product.price).toFixed(2)}
                    </div>
                    {liveStock !== undefined && (
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded ${
                          liveStock > 10
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : liveStock > 0
                            ? "bg-orange-50 text-orange-700 border border-orange-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {liveStock > 0
                          ? `Stock disponible: ${liveStock} unidades`
                          : "Producto agotado"}
                      </span>
                    )}
                  </div>

                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed bg-gray-50 p-3.5 rounded-lg border border-gray-100">
                    {product.description || "Repuesto original garantizado para vehículos y trimóviles Hurios Rally."}
                  </p>

                  <div className="pt-2">
                    <button
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleAddToCart(e);
                        handleCloseDetails();
                      }}
                      className="w-full px-6 py-3 bg-[var(--Primary_5)] text-white rounded-md font-semibold hover:bg-[#1e4a6f] transition-colors text-base disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                      disabled={isAdmin || (liveStock !== undefined && liveStock <= 0)}
                    >
                      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <circle cx={9} cy={21} r={1}></circle>
                        <circle cx={20} cy={21} r={1}></circle>
                        <path d="m1 1 4 4 14 1-1 7H6"></path>
                      </svg>
                      {isAdmin
                        ? "Vista Administrador (Solo lectura de compra)"
                        : liveStock !== undefined && liveStock <= 0
                        ? "Agotado"
                        : "Añadir al carrito de compras"}
                    </button>
                  </div>
                </div>
              </div>

              {/* SECCIÓN DE VALORACIONES Y COMENTARIOS DE CLIENTES */}
              <div className="border-t border-gray-200 bg-[#f8fafc] p-5 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Formulario para valorar producto */}
                  <div className="lg:col-span-5 bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
                    <h3 className="text-base font-bold text-gray-900 mb-1">
                      Valorar este producto
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
                      Comparte tu experiencia con la calidad y compatibilidad de este repuesto.
                    </p>

                    <form onSubmit={handleSubmitReview} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Tu calificación:
                        </label>
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const active = (hoverRating || newRating) >= star;
                            return (
                              <button
                                key={star}
                                type="button"
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setNewRating(star)}
                                className="p-1 focus:outline-none cursor-pointer transition-transform hover:scale-110"
                                aria-label={`Calificar con ${star} estrellas`}
                              >
                                <svg
                                  width={24}
                                  height={24}
                                  viewBox="0 0 24 24"
                                  fill={active ? "#f59e0b" : "none"}
                                  stroke={active ? "#f59e0b" : "#94a3b8"}
                                  strokeWidth={2}
                                >
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                              </button>
                            );
                          })}
                          <span className="ml-2 text-xs font-bold text-amber-600">
                            {newRating} de 5 ★
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Tu nombre:
                        </label>
                        <input
                          type="text"
                          value={reviewerName}
                          onChange={(e) => setReviewerName(e.target.value)}
                          placeholder="Ej. Carlos Mendoza"
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--Primary_5)]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Comentario sobre el producto:
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Escribe qué tal te pareció el repuesto, ajuste o entrega..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--Primary_5)]"
                        />
                      </div>

                      {reviewSuccess && (
                        <div className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded">
                          {reviewSuccess}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={submittingReview || !newComment.trim()}
                        className="w-full py-2 px-4 bg-[var(--Primary_5)] text-white text-sm font-semibold rounded-md hover:bg-[#1e4a6f] transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {submittingReview ? "Publicando..." : "Publicar valoración"}
                      </button>
                    </form>
                  </div>

                  {/* Lista de comentarios */}
                  <div className="lg:col-span-7 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-bold text-gray-900">
                        Comentarios de clientes ({reviews.length})
                      </h3>
                      <span className="text-xs font-semibold text-[var(--Primary_5)] bg-[#ebf3fa] px-2.5 py-1 rounded">
                        Promedio: {ratingStats.average.toFixed(1)} ★
                      </span>
                    </div>

                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {reviews.map((rev) => (
                        <div
                          key={rev.id}
                          className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-2xs"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-900">
                                {rev.userName}
                              </span>
                              {rev.verifiedPurchase && (
                                <span className="text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded">
                                  Compra verificada
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-400">
                              {new Date(rev.createdAt).toLocaleDateString("es-PE", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <div className="mb-1.5">{renderStars(rev.rating, 13)}</div>
                          <p className="text-sm text-gray-700">{rev.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </article>
  );
};

export default ShopCard;

// src/components/product/ProductCard.tsx
import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config/api";
import { getLocalStockDeltas } from "../../api/realtimeSync";

type Product = {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  stock?: number;
};

type ProductCardProps = {
  product: Product;
};

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const API_BASE = API_BASE_URL;
  const [imgError, setImgError] = useState(false);
  const [liveStock, setLiveStock] = useState<number | undefined>(() => {
    const deltas = getLocalStockDeltas();
    return deltas[product.id] !== undefined ? deltas[product.id] : product.stock;
  });

  useEffect(() => {
    const syncStock = () => {
      const deltas = getLocalStockDeltas();
      setLiveStock(deltas[product.id] !== undefined ? deltas[product.id] : product.stock);
    };
    syncStock();
    window.addEventListener("hurios-realtime-updated", syncStock);
    window.addEventListener("storage", syncStock);
    return () => {
      window.removeEventListener("hurios-realtime-updated", syncStock);
      window.removeEventListener("storage", syncStock);
    };
  }, [product.id, product.stock]);

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

  return (
    <div className="bg-white shadow rounded-lg p-4 border border-gray-100">
      <img
        src={imgError ? "/assets/imgs/placeholder.svg" : imageUrl}
        alt={product.name}
        className="w-full h-40 object-cover mb-3 rounded"
        onError={handleImageError}
      />
      <h3 className="text-lg font-semibold line-clamp-1">{product.name}</h3>
      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{product.description}</p>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">Stock disponible:</p>
          <p className="text-sm text-gray-900 font-bold">{liveStock ?? 0} und.</p>
        </div>
        <p className="text-[var(--Primary_5)] font-bold text-lg">
          S/ {Number(product.price).toFixed(2)}
        </p>
      </div>
      {liveStock !== undefined && liveStock < 10 && liveStock > 0 && (
        <p className="text-xs text-orange-600 font-medium mt-1">
          ¡Solo quedan {liveStock} unidades!
        </p>
      )}
      {liveStock !== undefined && liveStock <= 0 && (
        <p className="text-xs text-red-600 font-medium mt-1">Agotado</p>
      )}
    </div>
  );
};

export default ProductCard;

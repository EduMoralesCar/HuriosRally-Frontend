// src/components/ProductCard.tsx
import React from "react";
import { API_BASE_URL } from "../../config/api";

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
  const [imgError, setImgError] = React.useState(false);
  
  const rawUrl = product.imageUrl || (product as any).image_url;
  const imageUrl = rawUrl 
    ? (
        rawUrl.startsWith('http') ||
        rawUrl.startsWith('/assets') ||
        rawUrl.startsWith('blob:')
          ? rawUrl
          : `${API_BASE}${rawUrl}`
      )
    : "/assets/imgs/placeholder.svg";

  const handleImageError = () => {
    console.error(`Error cargando imagen para producto ${product.id}:`, imageUrl);
    setImgError(true);
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <img
        src={imgError ? "/assets/imgs/placeholder.svg" : imageUrl}
        alt={product.name}
        className="w-full h-40 object-cover mb-3"
        onError={handleImageError}
      />
      <h3 className="text-lg font-semibold">{product.name}</h3>
      <p className="text-sm text-gray-600">{product.description}</p>
      <p className="text-sm text-gray-600">Stock disponible:</p>
      <p className="text-sm text-black font-bold">{product.stock}</p>
      <p className="text-blue-600 font-bold">S/ {product.price.toFixed(2)}</p>
      {product.stock !== undefined && product.stock < 10 && product.stock > 0 && (
        <p className="text-sm text-orange-600 font-medium mt-1">¡Solo quedan {product.stock}!</p>
      )}
      {product.stock !== undefined && product.stock === 0 && (
        <p className="text-sm text-red-600 font-medium mt-1">Agotado</p>
      )}
    </div>
  );
};

export default ProductCard;
import { getToken, handleUnauthorizedResponse } from "../utils/token";

import { API_BASE_URL } from "../config/api";

const API_BASE = API_BASE_URL;

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  stock?: number;
  category?: string;
  createdAt?: string;
}

function asNetworkError(error: unknown): never {
  if (error instanceof TypeError && error.message.includes("fetch")) {
    throw new Error("No se puede conectar con el servidor. Verifica que el backend esté corriendo.");
  }
  throw error;
}

function handleUnauthorizedStatus(status: number) {
  if (status === 401 || status === 403) {
    handleUnauthorizedResponse();
  }
}

export async function getAllProducts(category?: string): Promise<Product[]> {
  try {
    const url = category?.trim()
      ? `${API_BASE}/products?category=${encodeURIComponent(category)}`
      : `${API_BASE}/products`;

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || body.message || "Error al obtener productos");
    }

    return await res.json();
  } catch (error) {
    asNetworkError(error);
  }
}

export async function searchProducts(query: string): Promise<Product[]> {
  try {
    const url = query.trim()
      ? `${API_BASE}/products/search?q=${encodeURIComponent(query)}`
      : `${API_BASE}/products/search`;

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || body.message || "Error al buscar productos");
    }

    return await res.json();
  } catch (error) {
    asNetworkError(error);
  }
}

export async function addStockToProduct(
  productId: number,
  quantity: number
): Promise<{ message: string; newStock: number }> {
  const token = getToken();
  if (!token) {
    throw new Error("No hay sesión activa");
  }

  try {
    const res = await fetch(`${API_BASE}/products/${productId}/add-stock`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quantity }),
    });

    handleUnauthorizedStatus(res.status);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || body.message || "Error al agregar stock");
    }

    return await res.json();
  } catch (error) {
    asNetworkError(error);
  }
}

export async function getProductById(id: number): Promise<Product> {
  try {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || body.message || "Error al obtener producto");
    }

    return await res.json();
  } catch (error) {
    asNetworkError(error);
  }
}

export async function uploadImage(file: File): Promise<{ imageUrl: string; filename: string }> {
  const token = getToken();
  if (!token) {
    throw new Error("No hay sesión activa");
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/api/images/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    handleUnauthorizedStatus(res.status);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || body.message || "Error al subir imagen");
    }

    return await res.json();
  } catch (error) {
    asNetworkError(error);
  }
}

export async function updateProduct(
  productId: number,
  productData: { name?: string; description?: string; price?: number; imageUrl?: string }
): Promise<Product> {
  const token = getToken();
  if (!token) {
    throw new Error("No hay sesión activa");
  }

  try {
    const res = await fetch(`${API_BASE}/products/${productId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    });

    handleUnauthorizedStatus(res.status);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || body.message || "Error al actualizar producto");
    }

    return await res.json();
  } catch (error) {
    asNetworkError(error);
  }
}

export async function deleteProduct(productId: number): Promise<{ message: string; id: number }> {
  const token = getToken();
  if (!token) {
    throw new Error("No hay sesión activa");
  }

  try {
    const res = await fetch(`${API_BASE}/products/${productId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    handleUnauthorizedStatus(res.status);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || body.message || "Error al eliminar producto");
    }

    return await res.json();
  } catch (error) {
    asNetworkError(error);
  }
}

export async function createProduct(productData: {
  name: string;
  price: number;
  description?: string;
  stock?: number;
  imageUrl?: string;
}): Promise<Product> {
  const token = getToken();
  if (!token) {
    throw new Error("No hay sesión activa");
  }

  try {
    const res = await fetch(`${API_BASE}/products`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    });

    handleUnauthorizedStatus(res.status);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || body.message || "Error al crear producto");
    }

    return await res.json();
  } catch (error) {
    asNetworkError(error);
  }
}

export async function syncProductsFromApi(): Promise<{ message: string; nuevos_productos: number; total_productos: number }> {
  try {
    const res = await fetch(`${API_BASE}/products/sync-api`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || body.message || "Error al sincronizar catálogo con la API");
    }

    return await res.json();
  } catch (error) {
    asNetworkError(error);
  }
}


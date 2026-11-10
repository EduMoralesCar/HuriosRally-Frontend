import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { getMyOrders, getSaleById, type PaymentSale } from "../api/payments";
import { submitProductReview } from "../api/realtimeSync";
import { getToken } from "../utils/token";

function formatCurrency(value: number) {
  return `S/ ${value.toFixed(2)}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-PE");
}

function getDisplayDocumentType(documentType: string) {
  return documentType?.toLowerCase() === "dni" ? "Boleta" : "Factura";
}

export function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<PaymentSale[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PaymentSale | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado para valorar producto comprado
  const [reviewingItemId, setReviewingItemId] = useState<number | null>(null);
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [commentValue, setCommentValue] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewedItemIds, setReviewedItemIds] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!getToken()) {
      navigate("/login");
      return;
    }

    void loadOrders();
  }, [navigate]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyOrders();
      setOrders(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error al cargar los pedidos");
      }
    } finally {
      setLoading(false);
    }
  };

  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [orders]
  );

  const openOrder = async (orderId: number) => {
    try {
      setDetailsLoading(true);
      setError(null);
      const sale = await getSaleById(orderId);
      setSelectedOrder(sale);
      setReviewingItemId(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error al obtener el detalle del pedido");
      }
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSendOrderReview = async (
    itemId: number,
    productId: number,
    productName: string,
    customerName: string
  ) => {
    if (!commentValue.trim()) return;
    setSubmittingReview(true);
    try {
      await submitProductReview({
        productId,
        productName,
        userName: customerName || "Cliente Verificado",
        rating: ratingValue,
        comment: commentValue.trim(),
        verifiedPurchase: true,
      });
      setReviewedItemIds((prev) => ({ ...prev, [itemId]: true }));
      setReviewingItemId(null);
      setCommentValue("");
      setRatingValue(5);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--Primary_0)] py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mis Pedidos</h1>
              <p className="text-gray-600 mt-1">
                Revisa tus compras, su estado y valora los productos adquiridos.
              </p>
            </div>
            <button
              onClick={() => navigate("/user-profile")}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Regresar
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--Primary_5)]"></div>
              <p className="mt-4 text-gray-600">Cargando pedidos...</p>
            </div>
          ) : sortedOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Aún no tienes pedidos</h2>
              <p className="text-gray-600 mb-4">Cuando realices una compra, la verás aquí.</p>
              <button
                onClick={() => navigate("/products")}
                className="px-5 py-3 bg-[var(--Primary_5)] text-white rounded-md hover:bg-[#1e4a6f] transition-colors cursor-pointer"
              >
                Ver productos
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {sortedOrders.map((order) => (
                <article
                  key={order.id}
                  className="bg-white rounded-lg shadow-md p-5 border border-gray-100"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Pedido #{order.id}</p>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {getDisplayDocumentType(order.documentType)} - {order.status}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Fecha: {formatDate(order.createdAt)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Método de pago: {order.paymentMethod}
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-sm text-gray-500">Total pagado</p>
                      <p className="text-2xl font-bold text-[var(--Primary_5)]">
                        {formatCurrency(order.total)}
                      </p>
                      <button
                        onClick={() => void openOrder(order.id)}
                        className="mt-3 px-4 py-2 bg-[var(--Primary_5)] cursor-pointer text-white rounded-md hover:bg-[#1e4a6f] transition-colors text-sm font-medium"
                      >
                        Ver detalle y valorar productos
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      {selectedOrder && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Detalle del pedido #{selectedOrder.id}
                </h3>
                <p className="text-sm text-gray-500">
                  {getDisplayDocumentType(selectedOrder.documentType)} - {selectedOrder.status}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-500 hover:text-gray-700 text-xl cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {detailsLoading ? (
                <p className="text-gray-600">Cargando detalle...</p>
              ) : (
                <>
                  <section className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-500">Cliente</p>
                      <p className="font-medium text-gray-900">{selectedOrder.fullName}</p>
                      <p className="text-gray-600">{selectedOrder.phone}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-500">Entrega</p>
                      <p className="font-medium text-gray-900">{selectedOrder.deliveryMethod}</p>
                      <p className="text-gray-600">
                        {selectedOrder.deliveryAddress || "Sin dirección registrada"}
                      </p>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Productos adquiridos
                    </h4>
                    <div className="space-y-3">
                      {(selectedOrder.items || []).map((item) => {
                        const prodId = item.product?.id || item.id;
                        const prodName = item.product?.name || `Producto #${prodId}`;
                        const isReviewing = reviewingItemId === item.id;
                        const alreadyReviewed = reviewedItemIds[item.id];

                        return (
                          <div
                            key={item.id}
                            className="border border-gray-200 rounded-lg p-4 bg-white"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold text-gray-900">{prodName}</p>
                                <p className="text-sm text-gray-600">
                                  {item.quantity} x {formatCurrency(item.unitPrice)}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <p className="font-bold text-gray-900">
                                  {formatCurrency(item.subtotal)}
                                </p>
                                {alreadyReviewed ? (
                                  <span className="text-xs font-semibold bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded">
                                    ¡Valoración enviada!
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReviewingItemId(isReviewing ? null : item.id);
                                      setRatingValue(5);
                                      setCommentValue("");
                                    }}
                                    className="px-3 py-1.5 text-xs font-semibold rounded border border-[var(--Primary_5)] text-[var(--Primary_5)] hover:bg-[var(--Primary_5)] hover:text-white transition-colors cursor-pointer"
                                  >
                                    {isReviewing ? "Cancelar" : "Valorar producto ★"}
                                  </button>
                                )}
                              </div>
                            </div>

                            {isReviewing && (
                              <div className="mt-4 pt-3 border-t border-gray-100 bg-gray-50 p-3.5 rounded-lg space-y-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-gray-700">
                                    Calificación:
                                  </span>
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setRatingValue(star)}
                                      className="p-0.5 cursor-pointer"
                                    >
                                      <svg
                                        width={20}
                                        height={20}
                                        viewBox="0 0 24 24"
                                        fill={star <= ratingValue ? "#f59e0b" : "none"}
                                        stroke={star <= ratingValue ? "#f59e0b" : "#94a3b8"}
                                        strokeWidth={2}
                                      >
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                      </svg>
                                    </button>
                                  ))}
                                  <span className="text-xs font-bold text-amber-600">
                                    {ratingValue} de 5 ★
                                  </span>
                                </div>

                                <textarea
                                  rows={2}
                                  value={commentValue}
                                  onChange={(e) => setCommentValue(e.target.value)}
                                  placeholder={`Escribe tu opinión sobre ${prodName}...`}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[var(--Primary_5)]"
                                />

                                <div className="flex justify-end">
                                  <button
                                    type="button"
                                    disabled={submittingReview || !commentValue.trim()}
                                    onClick={() =>
                                      void handleSendOrderReview(
                                        item.id,
                                        prodId,
                                        prodName,
                                        selectedOrder.fullName
                                      )
                                    }
                                    className="px-4 py-1.5 bg-[var(--Primary_5)] text-white text-xs font-semibold rounded-md hover:bg-[#1e4a6f] disabled:opacity-50 cursor-pointer"
                                  >
                                    {submittingReview ? "Publicando..." : "Publicar comentario"}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <section className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Subtotal</span>
                      <span>{formatCurrency(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Envío</span>
                      <span>{formatCurrency(selectedOrder.shippingCost)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                      <span>Total</span>
                      <span>{formatCurrency(selectedOrder.total)}</span>
                    </div>
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

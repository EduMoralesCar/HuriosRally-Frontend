import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/layout/Footer";
import Navbar from "../components/layout/Navbar";
import { useCart } from "../context/CartContext";
import { getToken, handleUnauthorizedResponse } from "../utils/token";
import { generateBoletaPDF, generateFacturaPDF } from "../utils/pdfGenerator";
import { useRoleProtection } from "../hooks/useRoleProtection";
import ButtonShowPsd from "../components/ui/ButtonShowPwd";
import { Input } from "../components/ui/Input";
import { API_BASE_URL } from "../config/api";
import { recordSaleAndNotify, recordStockOverride } from "../api/realtimeSync";

type PaymentMethod = "card" | "yape";

interface CardData {
    cardNumber: string;
    cardName: string;
    expiry: string;
    cvc: string;
}

interface YapeData {
    phone: string;
    approvalCode: string;
}

const API_BASE = API_BASE_URL;

export function Payment() {
    useRoleProtection('payment'); // Bloquear acceso a admins
    const navigate = useNavigate();
    const { items, totalPrice, clearCart } = useCart();
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingError, setProcessingError] = useState("");
    const [showThankYouModal, setShowThankYouModal] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [CVC,setVerCVC]=useState(false)
    // Card payment state
    const [cardData, setCardData] = useState<CardData>({
        cardNumber: "",
        cardName: "",
        expiry: "",
        cvc: "",
    });
    const [cardBrand, setCardBrand] = useState<string>("");
    const cardInputRef = useRef<HTMLInputElement | null>(null);
    const expiryInputRef = useRef<HTMLInputElement | null>(null);
    const [cardErrors, setCardErrors] = useState<Record<string, string>>({});

    // Yape payment state
    const [yapeData, setYapeData] = useState<YapeData>({
        phone: "",
        approvalCode: "",
    });
    const [yapeErrors, setYapeErrors] = useState<Record<string, string>>({});

    // Verificar autenticación y datos de checkout
    useEffect(() => {
        const token = getToken();
        if (!token) {
            navigate("/login", { state: { from: "/payment" } });
            return;
        }

        const checkoutData = sessionStorage.getItem("checkoutData");
        if (!checkoutData || items.length === 0) {
            navigate("/cart");
        }
    }, [navigate, items]);

    const shippingCost = totalPrice >= 200 ? 0 : 10;
    const finalTotal = totalPrice + shippingCost;

    // Card validation helpers
    const sanitizeNumber = (s: string) => s.replace(/\s+/g, "");

    const luhnCheck = (num: string) => {
        const s = sanitizeNumber(num);
        if (!/^[0-9]+$/.test(s)) return false;
        let sum = 0;
        let alt = false;
        for (let i = s.length - 1; i >= 0; i--) {
            let n = parseInt(s.charAt(i), 10);
            if (alt) {
                n *= 2;
                if (n > 9) n -= 9;
            }
            sum += n;
            alt = !alt;
        }
        return sum % 10 === 0;
    };

    const detectCardBrand = (digits: string) => {
        if (/^4/.test(digits)) return "visa";
        if (/^(34|37)/.test(digits)) return "amex";
        if (/^(5[1-5])/.test(digits)) return "mastercard";
        if (/^(222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/.test(digits)) return "mastercard";
        return "unknown";
    };

    const formatByBrand = (digits: string, brand: string) => {
        if (brand === "amex") {
            return digits
                .replace(/(\d{1,4})(\d{1,6})?(\d{1,5})?/, (_, g1, g2, g3) => {
                    return [g1, g2, g3].filter(Boolean).join(" ").trim();
                })
                .trim();
        }
        return digits.replace(/(.{4})/g, "$1 ").trim();
    };

    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const el = e.target;
        const rawValue = el.value;
        const prevPos = el.selectionStart || 0;
        const digits = rawValue.replace(/\D/g, "");
        const brand = detectCardBrand(digits);
        const formatted = formatByBrand(digits, brand);

        const digitsBeforeCursor = rawValue.slice(0, prevPos).replace(/\D/g, "").length;
        let newPos = 0;
        let counted = 0;
        for (let i = 0; i < formatted.length; i++) {
            if (/\d/.test(formatted[i])) counted++;
            newPos++;
            if (counted >= digitsBeforeCursor) break;
        }

        setCardBrand(brand === "unknown" ? "" : brand);
        setCardData((prev) => ({ ...prev, cardNumber: formatted }));

        requestAnimationFrame(() => {
            const input = cardInputRef.current;
            if (input) {
                input.setSelectionRange(newPos, newPos);
            }
        });
    };

    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const el = e.target;
        const raw = el.value;
        const prevPos = el.selectionStart || 0;
        const digits = raw.replace(/\D/g, "");

        let formatted = "";
        if (digits.length <= 2) {
            formatted = digits;
        } else {
            const month = digits.slice(0, 2);
            const rest = digits.slice(2, 6);
            formatted = month + "/" + rest;
        }

        const digitsBeforeCursor = raw.slice(0, prevPos).replace(/\D/g, "").length;
        let newPos = 0;
        let counted = 0;
        for (let i = 0; i < formatted.length; i++) {
            if (/\d/.test(formatted[i])) counted++;
            newPos++;
            if (counted >= digitsBeforeCursor) break;
        }

        setCardData((prev) => ({ ...prev, expiry: formatted }));
        requestAnimationFrame(() => {
            const input = expiryInputRef.current;
            if (input) input.setSelectionRange(newPos, newPos);
        });
    };

    const validateCardPayment = (): boolean => {
        const errors: Record<string, string> = {};
        const numSan = sanitizeNumber(cardData.cardNumber);
        
        // Validación estricta: solo números, exactamente 16 dígitos
        if (!numSan) {
            errors.cardNumber = "Número de tarjeta requerido";
        } else if (!/^\d+$/.test(numSan)) {
            errors.cardNumber = "El número de tarjeta solo debe contener dígitos";
        } else if (numSan.length !== 16) {
            errors.cardNumber = "El número de tarjeta debe tener 16 dígitos";
        } else if (!luhnCheck(numSan)) {
            errors.cardNumber = "Número de tarjeta inválido";
        }
        
        if (!cardData.cardName.trim()) errors.cardName = "Nombre del titular requerido";

        const expMatch = cardData.expiry.match(/^(0[1-9]|1[0-2])\/(?:(\d{2})|(\d{4}))$/);
        if (!expMatch) {
            errors.expiry = "Fecha inválida (MM/AA)";
        } else {
            const month = parseInt(expMatch[1], 10);
            const yearRaw = expMatch[2] || expMatch[3];
            let year = parseInt(yearRaw, 10);
            if (yearRaw.length === 2) {
                const prefix = Math.floor(new Date().getFullYear() / 100) * 100;
                year += prefix;
                if (year < new Date().getFullYear()) year += 100;
            }
            const expDate = new Date(year, month, 0, 23, 59, 59);
            if (expDate < new Date()) errors.expiry = "Tarjeta expirada";
        }

        if (!/^[0-9]{3,4}$/.test(cardData.cvc)) errors.cvc = "CVC inválido";

        setCardErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateYapePayment = (): boolean => {
        const errors: Record<string, string> = {};
        
        // Validar teléfono
        if (!yapeData.phone.trim()) {
            errors.phone = "Número de celular requerido";
        } else if (!/^\d{9}$/.test(yapeData.phone)) {
            errors.phone = "El número debe tener 9 dígitos";
        }
        
        // Validación estricta del código Yape: solo 6 números
        if (!yapeData.approvalCode.trim()) {
            errors.approvalCode = "Código de aprobación requerido";
        } else if (!/^\d+$/.test(yapeData.approvalCode)) {
            errors.approvalCode = "El código solo debe contener números";
        } else if (yapeData.approvalCode.length !== 6) {
            errors.approvalCode = "El código debe tener exactamente 6 dígitos";
        }

        setYapeErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmitPayment = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validar según método de pago
        let isValid = false;
        if (paymentMethod === "card") {
            isValid = validateCardPayment();
        } else {
            isValid = validateYapePayment();
        }

        if (!isValid) return;

        setIsProcessing(true);
        setProcessingError("");

        try {
            const token = getToken();
            if (!token) {
                throw new Error("No hay sesión activa");
            }
            const checkoutData = JSON.parse(sessionStorage.getItem("checkoutData") || "{}");

            // Preparar datos de pago
            const paymentData = {
                checkoutInfo: checkoutData,
                paymentMethod,
                paymentDetails:
                    paymentMethod === "card"
                        ? {
                              cardNumber: sanitizeNumber(cardData.cardNumber).slice(-4),
                              cardName: cardData.cardName,
                          }
                        : {
                              phone: yapeData.phone,
                              approvalCode: yapeData.approvalCode,
                          },
                items: items.map((item) => ({
                    productId: item.id,
                    quantity: item.quantity,
                    price: item.price,
                })),
                totalPrice,
                shippingCost,
                finalTotal,
            };

            const res = await fetch(`${API_BASE}/payments/process`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(paymentData),
            });

            if (res.status === 401 || res.status === 403) {
                handleUnauthorizedResponse();
            }

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || "Error al procesar el pago");
            }

            const result = await res.json();

            // Sincronizar venta y descuento de stock en tiempo real para el Dashboard Admin y Campana
            try {
                items.forEach((it) => {
                    if (it.stock !== undefined) {
                        const updatedStock = Math.max(0, it.stock - it.quantity);
                        recordStockOverride(it.id, updatedStock);
                    }
                });
                await recordSaleAndNotify({
                    orderId: result.orderId || Date.now(),
                    customerName:
                        checkoutData.fullName ||
                        checkoutData.companyName ||
                        "Cliente Web",
                    total: finalTotal,
                    paymentMethod: paymentMethod === "card" ? "Tarjeta" : "Yape",
                    items: items.map((it) => ({
                        productId: it.id,
                        productName: it.name,
                        category: it.category || "Repuestos",
                        quantity: it.quantity,
                        unitPrice: it.price,
                    })),
                });
            } catch {
                // ignore realtime sync error so payment flow never fails
            }

            // Generar PDF según tipo de documento
            const documentType = checkoutData.documentType;
            const currentDate = new Date().toLocaleDateString('es-PE');
            const paymentMethodLabel = paymentMethod === "card" ? "Tarjeta" : "Yape";
            const deliveryMethodLabel = checkoutData.deliveryMethod === "pickup" ? "Recojo en tienda" : "Entrega a domicilio";
            
            const pdfItems = items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.price,
                total: item.price * item.quantity
            }));
            
            const baseImponible = finalTotal / 1.18;
            const igvCalculado = finalTotal - baseImponible;
            
            if (documentType === "dni") {
                // Generar Boleta (asíncrono)
                await generateBoletaPDF({
                    boletaNumber: `B001-${result.orderId || '00001'}`,
                    date: currentDate,
                    clientName: checkoutData.fullName,
                    clientDNI: checkoutData.dni,
                    items: pdfItems,
                    subtotal: totalPrice,
                    igv: igvCalculado,
                    total: finalTotal,
                    paymentMethod: paymentMethodLabel,
                    deliveryMethod: deliveryMethodLabel
                });
            } else {
                // Generar Factura (asíncrono)
                await generateFacturaPDF({
                    facturaNumber: `F001-${result.orderId || '00001'}`,
                    date: currentDate,
                    clientName: checkoutData.companyName,
                    clientRUC: checkoutData.ruc,
                    clientAddress: checkoutData.companyAddress,
                    items: pdfItems,
                    subtotal: totalPrice,
                    anticipos: 0,
                    descuentos: 0,
                    valorVenta: baseImponible,
                    isc: 0,
                    igv: igvCalculado,
                    total: finalTotal,
                    paymentMethod: paymentMethodLabel,
                    deliveryMethod: deliveryMethodLabel
                });
            }

            // Primero mostrar modal, LUEGO limpiar
            console.log('Setting orderId:', result.orderId);
            setOrderId(result.orderId);
            setIsProcessing(false);
            
            // Mostrar modal inmediatamente
            setTimeout(() => {
                console.log('Showing thank you modal');
                setShowThankYouModal(true);
            }, 300);
        } catch (error: any) {
            console.error("Error processing payment:", error);
            setProcessingError(error.message || "Error al procesar el pago. Por favor intenta nuevamente.");
            setIsProcessing(false);
        }
    };

    // Debug: verificar estado del modal
    console.log('showThankYouModal:', showThankYouModal);
    console.log('orderId:', orderId);

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-[var(--Primary_0)]">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Metodo de Pago</h1>
                        <button
                            onClick={() => navigate("/checkout")}
                            className="text-[var(--Primary_5)] hover:underline text-sm cursor-pointer"
                        >
                            ← Volver
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Formulario de pago */}
                        <div className="lg:col-span-2">
                            <form onSubmit={handleSubmitPayment}>
                                {/* Selección de método de pago */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                        Seleccionar Metodo de Pago
                                    </h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Tarjeta */}
                                        <div
                                            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                                paymentMethod === "card"
                                                    ? "border-[var(--Primary_5)] bg-blue-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                            }`}
                                            onClick={() => setPaymentMethod("card")}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    value="card"
                                                    checked={paymentMethod === "card"}
                                                    onChange={(e) =>
                                                        setPaymentMethod(e.target.value as PaymentMethod)
                                                    }
                                                    className="mr-2"
                                                />
                                                <div>
                                                    <svg
                                                        width={32}
                                                        height={32}
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth={1.5}
                                                        className="text-gray-700"
                                                    >
                                                        <rect
                                                            x={2}
                                                            y={5}
                                                            width={20}
                                                            height={14}
                                                            rx={2}
                                                        ></rect>
                                                        <line x1={2} y1={10} x2={22} y2={10}></line>
                                                    </svg>
                                                    <p className="text-sm font-semibold text-gray-900 mt-2">
                                                        Tarjeta
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Yape */}
                                        <div
                                            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                                paymentMethod === "yape"
                                                    ? "border-[var(--Primary_5)] bg-blue-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                            }`}
                                            onClick={() => setPaymentMethod("yape")}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    value="yape"
                                                    checked={paymentMethod === "yape"}
                                                    onChange={(e) =>
                                                        setPaymentMethod(e.target.value as PaymentMethod)
                                                    }
                                                    className="mr-2"
                                                />
                                                <div>
                                                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                                        Y
                                                    </div>
                                                    <p className="text-sm font-semibold text-gray-900 mt-2">
                                                        Yape
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Formulario de tarjeta */}
                                {paymentMethod === "card" && (
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                            Información de Pago
                                        </h2>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Número de tarjeta *
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        ref={cardInputRef}
                                                    value={cardData.cardNumber}
                                                        onChange={handleCardNumberChange}
                                                        placeholder="0000 0000 0000 0000"
                                                        inputMode="numeric"
                                                        maxLength={19}
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 pr-24 focus:outline-none focus:ring-2 focus:ring-[var(--Primary_5)]"
                                                    />
                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                        {cardBrand === "visa" && (
                                                            <span className="text-xs font-semibold text-blue-600">
                                                                Visa
                                                            </span>
                                                        )}
                                                        {cardBrand === "mastercard" && (
                                                            <span className="text-xs font-semibold text-orange-600">
                                                                Mastercard
                                                            </span>
                                                        )}
                                                        {cardBrand === "amex" && (
                                                            <span className="text-xs font-semibold text-indigo-600">
                                                                Amex
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {cardErrors.cardNumber && (
                                                    <p className="text-xs text-red-600 mt-1">
                                                        {cardErrors.cardNumber}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Titular de la tarjeta *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={cardData.cardName}
                                                    onChange={(e) =>
                                                        setCardData((prev) => ({
                                                            ...prev,
                                                            cardName: e.target.value,
                                                        }))
                                                    }
                                                    placeholder="Diego Santos"
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--Primary_5)]"
                                                />
                                                {cardErrors.cardName && (
                                                    <p className="text-xs text-red-600 mt-1">
                                                        {cardErrors.cardName}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Fecha de expiración *
                                                    </label>
                                                    <input
                                                        ref={expiryInputRef}
                                                        value={cardData.expiry}
                                                        onChange={handleExpiryChange}
                                                        placeholder="MM/AA"
                                                        inputMode="numeric"
                                                        maxLength={5}
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--Primary_5)]"
                                                    />
                                                    {cardErrors.expiry && (
                                                        <p className="text-xs text-red-600 mt-1">
                                                            {cardErrors.expiry}
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    <Input
                                                        type={CVC ? "text" : "password"}
                                                        value={cardData.cvc}
                                                        onChange={(e) =>
                                                            setCardData((prev) => ({
                                                                ...prev,
                                                                cvc: e.target.value.replace(/\D/g, "").slice(0, 4),
                                                            }))
                                                        }
                                                        label="CVC"
                                                        placeholder="123"
                                                        inputMode="numeric"
                                                        maxLength={4}
                                                        rightIcon={
                                                            <ButtonShowPsd
                                                                onClick={() => setVerCVC(prev => !prev)}
                                                                aria-label={CVC ? "Ocultar contraseña" : "Ver contraseña"}
                                                                className="bg-transparent border-0 cursor-pointer text-inherit p-0 flex items-center"
                                                                >
                                                                <span className="material-symbols-outlined"  translate="no">
                                                                {CVC ? "visibility" : "visibility_off"}
                                                                </span>
                                                            </ButtonShowPsd>
                                                            }
                                                    />
                                                    
                                                    {cardErrors.cvc && (
                                                        <p className="text-xs text-red-600 mt-1">
                                                            {cardErrors.cvc}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Formulario de Yape */}
                                {paymentMethod === "yape" && (
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                            Información de Pago
                                        </h2>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Número de Celular *
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={yapeData.phone}
                                                    onChange={(e) =>
                                                        setYapeData((prev) => ({
                                                            ...prev,
                                                            phone: e.target.value.replace(/\D/g, "").slice(0, 9),
                                                        }))
                                                    }
                                                    placeholder="942480155"
                                                    inputMode="numeric"
                                                    maxLength={9}
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--Primary_5)]"
                                                />
                                                {yapeErrors.phone && (
                                                    <p className="text-xs text-red-600 mt-1">{yapeErrors.phone}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Código de Aprobación *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={yapeData.approvalCode}
                                                    onChange={(e) =>
                                                        setYapeData((prev) => ({
                                                            ...prev,
                                                            approvalCode: e.target.value.replace(/\D/g, "").slice(0, 6),
                                                        }))
                                                    }
                                                    placeholder="123456"
                                                    inputMode="numeric"
                                                    maxLength={6}
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--Primary_5)]"
                                                />
                                                {yapeErrors.approvalCode && (
                                                    <p className="text-xs text-red-600 mt-1">
                                                        {yapeErrors.approvalCode}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Realiza el pago por Yape e ingresa el código de aprobación que
                                                    aparece en tu aplicación
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {processingError && (
                                    <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                                        <p className="text-sm text-red-700">{processingError}</p>
                                    </div>
                                )}
                            </form>
                        </div>

                        {/* Resumen */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumen</h2>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-medium">S/ {totalPrice.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Envío</span>
                                        <span
                                            className={`font-medium ${
                                                shippingCost === 0 ? "text-green-600" : ""
                                            }`}
                                        >
                                            {shippingCost === 0 ? "Gratis" : `S/ ${shippingCost.toFixed(2)}`}
                                        </span>
                                    </div>
                                    <div className="border-t border-gray-200 pt-3">
                                        <div className="flex justify-between">
                                            <span className="text-lg font-semibold text-gray-900">Total</span>
                                            <span className="text-lg font-bold text-gray-900">
                                                S/ {finalTotal.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSubmitPayment}
                                        disabled={isProcessing}
                                        className="w-full bg-[var(--Primary_5)] text-white py-3 px-4 rounded-md font-medium hover:bg-[#1e4a6f] transition-colors mt-4 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <svg
                                                    className="animate-spin h-5 w-5"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                >
                                                    <circle
                                                        className="opacity-25"
                                                        cx={12}
                                                        cy={12}
                                                        r={10}
                                                        strokeWidth={4}
                                                    ></circle>
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    ></path>
                                                </svg>
                                                Procesando...
                                            </>
                                        ) : (
                                            `Pagar S/ ${finalTotal.toFixed(2)}`
                                        )}
                                    </button>

                                    <p className="text-xs text-gray-500 text-center mt-3">
                                        Tu pago es seguro y protegido
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal de Agradecimiento Personalizado */}
            {showThankYouModal && (
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                >
                            <div className="bg-white rounded-2xl max-w-md w-full mx-4 p-8 shadow-2xl transform animate-scaleIn">
                                {/* Icono de Éxito */}
                                <div className="flex justify-center mb-6">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
                                        <div className="relative w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                                            <svg
                                                className="w-10 h-10 text-white"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                strokeWidth={3}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Título */}
                                <h3 className="text-3xl font-bold text-gray-900 text-center mb-3">
                                    ¡Gracias por tu compra!
                                </h3>

                                {/* Mensaje */}
                                <div className="text-center mb-6">
                                    <p className="text-gray-600 text-lg mb-2">
                                        Tu pedido ha sido procesado exitosamente.
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Te hemos enviado un comprobante de pago.
                                    </p>
                                    {orderId && (
                                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <p className="text-xs text-blue-600 font-medium">
                                                Número de orden
                                            </p>
                                            <p className="text-lg font-bold text-blue-700">
                                                #{orderId}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Botón */}
                                <button
                                    onClick={() => {
                                        // Limpiar carrito y sessionStorage al hacer clic en Aceptar
                                        clearCart();
                                        sessionStorage.removeItem("checkoutData");
                                        setShowThankYouModal(false);
                                        navigate("/", { state: { orderSuccess: true, orderId } });
                                    }}
                                    className="w-full bg-gradient-to-r from-[var(--Primary_5)] to-[#1e4a6f] text-white py-4 px-6 rounded-xl cursor-pointer font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                                >
                                    Aceptar
                                </button>

                                {/* Decoración */}
                                <div className="mt-6 flex justify-center gap-2">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
}



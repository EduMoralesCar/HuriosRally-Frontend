// src/config/whatsapp.ts

export const WHATSAPP_CONFIG = {
  // Formato internacional SIN "+", SIN espacios, SIN guiones
  // Perú: 51 + 9 dígitos (añade 51 automáticamente si son 9 dígitos)
  phoneNumber: (() => {
    const raw = String(import.meta.env.VITE_WHATSAPP_NUMBER || "51953157200").replace(/\D/g, "");
    return raw.length === 9 ? `51${raw}` : raw;
  })(),

  // Mensaje por defecto al abrir el chat
  defaultMessage:
    "Hola, vengo desde la web de Hurios y quisiera más información.",

  // Opcional: mensaje distinto según contexto
  messages: {
    product: (productName: string) =>
      `Hola, estoy interesado en el producto: ${productName}`,
    support:
      "Hola, necesito ayuda con mi pedido.",
    general:
      "Hola, vengo desde la web de Hurios y quisiera más información.",
  },
};

/**
 * Genera la URL de WhatsApp con mensaje pre-rellenado.
 * Docs: https://faq.whatsapp.com/5913398998672934
 */
export function buildWhatsAppUrl(message?: string): string {
  const text = encodeURIComponent(message || WHATSAPP_CONFIG.defaultMessage);
  return `https://wa.me/${WHATSAPP_CONFIG.phoneNumber}?text=${text}`;
}

/**
 * Abre WhatsApp en nueva pestaña (Web o App según el dispositivo).
 */
export function openWhatsApp(message?: string): void {
  window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
}
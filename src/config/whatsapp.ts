// src/config/whatsapp.ts

export const WHATSAPP_CONFIG = {
  // Número oficial de atención automatizada de Hurios Rally (+51 932 544 926)
  phoneNumber: (() => {
    const envVal = String(import.meta.env.VITE_WHATSAPP_NUMBER || "").replace(/\D/g, "");
    // Si en el entorno quedó el número personal anterior (953157200) o está vacío, usar el segundo número 932544926
    if (!envVal || envVal.endsWith("953157200")) {
      return "51932544926";
    }
    return envVal.length === 9 ? `51${envVal}` : envVal;
  })(),

  // Mensaje por defecto al abrir el chat
  defaultMessage:
    "Hola, vengo desde la web de Hurios Rally y quisiera consultar por un repuesto.",

  // Opcional: mensaje distinto según contexto
  messages: {
    product: (productName: string) =>
      `Hola, estoy interesado en el repuesto: ${productName}. ¿Tienen stock y precio?`,
    support:
      "Hola, quisiera consultar el estado de mi pedido.",
    general:
      "Hola, vengo desde la web de Hurios Rally y quisiera consultar por un repuesto.",
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
 * Abre WhatsApp real en nueva pestaña (Web o App según el dispositivo).
 */
export function openWhatsApp(message?: string): void {
  window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
}

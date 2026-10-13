// src/components/whatsapp/WhatsAppButton.tsx
import { openWhatsApp } from "../../config/whatsapp";

interface Props {
    message?: string;
    /** Tamaño del botón flotante (default 56px) */
    size?: number;
}

export default function WhatsAppButton({ message, size = 56 }: Props) {
    return (
        <button
            type="button"
            onClick={() => openWhatsApp(message)}
            aria-label="Contactar por WhatsApp"
            title="Contactar por WhatsApp"
            style={{
                position: "fixed",
                bottom: "24px",
                right: "24px",
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: "50%",
                background: "#25D366",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                transition: "transform 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
            {/* Ícono oficial de WhatsApp en SVG (sin dependencias) */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                width={size * 0.55}
                height={size * 0.55}
                fill="#fff"
            >
                <path d="M16.001 3C8.82 3 3 8.82 3 16c0 2.29.6 4.44 1.65 6.31L3 29l6.87-1.62A12.94 12.94 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm0 23.6c-1.98 0-3.83-.53-5.43-1.46l-.39-.23-4.08.96.97-3.98-.25-.4A10.55 10.55 0 0 1 5.4 16c0-5.85 4.76-10.6 10.6-10.6 5.85 0 10.6 4.75 10.6 10.6s-4.75 10.6-10.6 10.6zm5.82-7.94c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.32-.82 1.03-1 1.24-.18.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.9-1.78-2.22-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.55-.08-.16-.71-1.72-.98-2.35-.26-.62-.52-.53-.71-.54l-.6-.01c-.21 0-.55.08-.84.4-.29.32-1.1 1.08-1.1 2.63s1.13 3.05 1.29 3.26c.16.21 2.22 3.39 5.38 4.75.75.32 1.34.51 1.8.66.76.24 1.44.21 1.98.13.6-.09 1.85-.76 2.11-1.49.26-.74.26-1.36.18-1.49-.08-.13-.29-.21-.61-.37z" />
            </svg>
        </button>
    );
}
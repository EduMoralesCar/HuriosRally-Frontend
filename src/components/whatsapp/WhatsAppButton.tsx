// src/components/whatsapp/WhatsAppButton.tsx
import React, { useState, useRef, useEffect } from "react";
import { openWhatsApp } from "../../config/whatsapp";
import { clasificarConsultaML, type ProductoSugeridoML } from "../../api/ml";

interface Props {
  message?: string;
  /** Tamaño del botón flotante (default 56px) */
  size?: number;
}

interface MensajeChat {
  id: string;
  emisor: "bot" | "cliente";
  texto: string;
  hora: string;
  productos?: ProductoSugeridoML[];
}

const CONSULTAS_RAPIDAS = [
  "¿Tienes cilindro completo para Torito Bajaj 4T y cuánto cuesta?",
  "¿El kit de discos de embrague de Pulsar 180 le hace a la Discover 150?",
  "Ya pagué por Yape mi pedido web, ¿a qué hora sale el envío?",
];

export default function WhatsAppButton({ message, size = 56 }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [inputTexto, setInputTexto] = useState(message || "");
  const [enviando, setEnviando] = useState(false);
  const [mensajes, setMensajes] = useState<MensajeChat[]>([
    {
      id: "bienvenida",
      emisor: "bot",
      texto:
        "¡Hola! 👋 Bienvenido al canal de atención de Hurios Rally. Escríbenos el repuesto que buscas, tu consulta de compatibilidad o el estado de tu pedido y te atenderemos al instante.",
      hora: new Date().toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (abierto) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensajes, abierto]);

  const enviarConsulta = async (textoAEnviar: string) => {
    const limpio = textoAEnviar.trim();
    if (!limpio || enviando) return;

    const horaActual = new Date().toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const msgCliente: MensajeChat = {
      id: `cli-${Date.now()}`,
      emisor: "cliente",
      texto: limpio,
      hora: horaActual,
    };

    setMensajes((prev) => [...prev, msgCliente]);
    setInputTexto("");
    setEnviando(true);

    try {
      const res = await clasificarConsultaML(limpio);
      const msgBot: MensajeChat = {
        id: res.id_conversacion || `bot-${Date.now()}`,
        emisor: "bot",
        texto:
          res.respuesta_automatica_bot ||
          "Hemos registrado tu consulta y un asesor te atenderá en breve.",
        hora: new Date().toLocaleTimeString("es-PE", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        productos: res.productos_sugeridos_supabase,
      };
      setMensajes((prev) => [...prev, msgBot]);
      window.dispatchEvent(new Event("hurios-nueva-consulta-ml"));
    } finally {
      setEnviando(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await enviarConsulta(inputTexto);
  };

  const ultimoMensajeCliente =
    [...mensajes].reverse().find((m) => m.emisor === "cliente")?.texto ||
    message;

  return (
    <>
      {/* Ventana de Chat estilo WhatsApp */}
      {abierto && (
        <div
          className="fixed bottom-24 right-5 w-[350px] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
          style={{ zIndex: 9999, maxHeight: "calc(100vh - 120px)" }}
        >
          {/* Cabecera WhatsApp */}
          <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center font-bold text-sm shadow-xs">
                HR
              </div>
              <div>
                <h3 className="text-sm font-semibold leading-tight">
                  Hurios Rally — Atención
                </h3>
                <p className="text-[11px] text-emerald-100 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#25D366] inline-block" />
                  Respuesta automática en línea
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="text-white/80 hover:text-white text-xl leading-none px-1 cursor-pointer"
              aria-label="Cerrar chat"
            >
              ×
            </button>
          </div>

          {/* Cuerpo de mensajes */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#ECE5DD] max-h-[340px]">
            {mensajes.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.emisor === "cliente" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs sm:text-[13px] shadow-xs whitespace-pre-line ${
                    m.emisor === "cliente"
                      ? "bg-[#DCF8C6] text-gray-900 rounded-br-none"
                      : "bg-white text-gray-800 rounded-bl-none"
                  }`}
                >
                  <p>{m.texto}</p>

                  {m.productos && m.productos.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100 space-y-1.5">
                      {m.productos.map((p) => (
                        <div
                          key={p.id}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-2 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-900 truncate">
                              {p.nombre}
                            </p>
                            <p className="text-[11px] text-gray-500">
                              Stock: {p.stock_disponible} und.
                            </p>
                          </div>
                          <span className="text-xs font-bold text-emerald-700 shrink-0">
                            S/ {Number(p.precio_soles).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <span className="block text-[10px] text-gray-400 text-right mt-1">
                    {m.hora} {m.emisor === "cliente" ? "✓✓" : ""}
                  </span>
                </div>
              </div>
            ))}

            {enviando && (
              <div className="flex items-start">
                <div className="bg-white text-gray-500 rounded-xl rounded-bl-none px-3 py-2 text-xs shadow-xs">
                  Escribiendo respuesta...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Consultas rápidas sugeridas */}
          {mensajes.length <= 2 && (
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex gap-1.5 overflow-x-auto">
              {CONSULTAS_RAPIDAS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => void enviarConsulta(q)}
                  className="text-[11px] bg-white hover:bg-emerald-50 text-gray-700 border border-gray-200 rounded-full px-2.5 py-1 whitespace-nowrap cursor-pointer transition-colors"
                >
                  {q.length > 36 ? q.slice(0, 36) + "…" : q}
                </button>
              ))}
            </div>
          )}

          {/* Formulario de envío */}
          <form
            onSubmit={handleSubmit}
            className="p-2.5 bg-white border-t border-gray-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputTexto}
              onChange={(e) => setInputTexto(e.target.value)}
              placeholder="Escribe tu consulta aquí..."
              className="flex-1 px-3 py-2 text-xs sm:text-sm bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-[#25D366]"
            />
            <button
              type="submit"
              disabled={enviando || !inputTexto.trim()}
              className="w-9 h-9 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] text-white flex items-center justify-center disabled:opacity-50 cursor-pointer shrink-0 transition-colors"
              aria-label="Enviar mensaje"
            >
              <svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>

          {/* Enlace opcional para abrir la app externa de WhatsApp */}
          <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span>¿Prefieres hablar desde tu celular?</span>
            <button
              type="button"
              onClick={() => openWhatsApp(ultimoMensajeCliente)}
              className="text-[#075E54] font-semibold hover:underline cursor-pointer"
            >
              Abrir WhatsApp App →
            </button>
          </div>
        </div>
      )}

      {/* Botón flotante de WhatsApp */}
      <button
        type="button"
        onClick={() => setAbierto((prev) => !prev)}
        aria-label="Atención por WhatsApp"
        title="Atención en línea por WhatsApp"
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
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
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
    </>
  );
}

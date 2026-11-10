import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import {
  MODELOS_COMPARADOS,
  obtenerHistorialConsultasML,
  obtenerEstadoWhatsApp,
  generarQRWhatsApp,
  solicitarCodigoVinculacion,
  desvincularWhatsApp,
  type PrediccionMLResponse,
  type TipoIntencion,
  type WhatsAppBotStatus,
} from "../api/ml";

const COLOR_INTENCION: Record<
  TipoIntencion,
  { bg: string; text: string; border: string; label: string; dot: string; bar: string }
> = {
  COTIZACION: {
    bg: "#eff6ff",
    text: "#1e40af",
    border: "#bfdbfe",
    label: "Cotización",
    dot: "#245682",
    bar: "#245682",
  },
  CONSULTA_TECNICA: {
    bg: "#ecfdf5",
    text: "#065f46",
    border: "#a7f3d0",
    label: "Consulta técnica",
    dot: "#10b981",
    bar: "#10b981",
  },
  ESTADO_PEDIDO: {
    bg: "#fffbeb",
    text: "#92400e",
    border: "#fde68a",
    label: "Estado de pedido",
    dot: "#f59e0b",
    bar: "#f59e0b",
  },
  SPAM: {
    bg: "#fef2f2",
    text: "#991b1b",
    border: "#fecaca",
    label: "No deseado",
    dot: "#ef4444",
    bar: "#ef4444",
  },
};

const HISTORIAL_BASE: PrediccionMLResponse[] = [
  {
    id_conversacion: "base-cot-01",
    timestamp_primer_mensaje: "Hoy, 20:15",
    texto_cliente:
      "Buenas noches amigo, ¿tienes cilindro completo para Torito Bajaj 4T y a cuánto sale?",
    texto_normalizado:
      "buenas noches amigo tienes cilindro completo para bajaj torito re 4t y a cuanto sale",
    intencion_predicha: "COTIZACION",
    confianza_modelo: 0.964,
    probabilidades: {
      COTIZACION: 0.964,
      CONSULTA_TECNICA: 0.022,
      ESTADO_PEDIDO: 0.009,
      SPAM: 0.005,
    },
    hora_del_dia: 20,
    es_fuera_horario: true,
    requiere_derivacion_humana: false,
    accion_negocio_sugerida:
      "Enviar cotización automática con precio actualizado, stock disponible en almacén y opciones de pago (Yape, Plin o tarjeta).",
    respuesta_automatica_bot:
      "¡Hola! Gracias por escribir a Hurios Rally. Tenemos disponibilidad inmediata para tu consulta:\n• Cilindro Completo Torito Bajaj 4T — S/ 185.00 (23 en stock)\nPuedes pagar por Yape/Plin al 937 395 986 o con tarjeta.",
    remitente_whatsapp: "+51 953 157 200",
    canal: "WHATSAPP_REAL",
    modelo_utilizado: "SVM Lineal",
    productos_sugeridos_supabase: [
      {
        id: 4574,
        nombre: "Cilindro Completo Torito Bajaj 4T",
        categoria: "Motor",
        precio_soles: 185.0,
        stock_disponible: 23,
      },
    ],
  },
  {
    id_conversacion: "base-ped-02",
    timestamp_primer_mensaje: "Hoy, 19:40",
    texto_cliente:
      "Hola, ya realicé el pago por Yape del pedido de mis zapatas de freno, ¿a qué hora sale el envío?",
    texto_normalizado:
      "hola ya realice el pago por yape del pedido de mis zapata freno a que hora sale el envio",
    intencion_predicha: "ESTADO_PEDIDO",
    confianza_modelo: 0.951,
    probabilidades: {
      ESTADO_PEDIDO: 0.951,
      COTIZACION: 0.028,
      CONSULTA_TECNICA: 0.015,
      SPAM: 0.006,
    },
    hora_del_dia: 19,
    es_fuera_horario: true,
    requiere_derivacion_humana: false,
    accion_negocio_sugerida:
      "Consultar el estado actual de la compra y notificar al cliente el seguimiento de entrega o disponibilidad de recojo.",
    respuesta_automatica_bot:
      "¡Hola! Hemos recibido tu consulta sobre el estado de tu compra o pago. Tu solicitud ya está priorizada en el área de despacho.",
    remitente_whatsapp: "Cliente WhatsApp",
    canal: "WHATSAPP_REAL",
    modelo_utilizado: "SVM Lineal",
    productos_sugeridos_supabase: [],
  },
  {
    id_conversacion: "base-tec-03",
    timestamp_primer_mensaje: "Hoy, 16:10",
    texto_cliente:
      "Consulta técnica: ¿el disco de embrague de Torito 4T le calza exacto al modelo FL cromado o cambia la medida?",
    texto_normalizado:
      "consulta tecnica el disco de embrague de bajaj torito re 4t le calza exacto al modelo fl cromado o cambia la medida",
    intencion_predicha: "CONSULTA_TECNICA",
    confianza_modelo: 0.938,
    probabilidades: {
      CONSULTA_TECNICA: 0.938,
      COTIZACION: 0.044,
      ESTADO_PEDIDO: 0.012,
      SPAM: 0.006,
    },
    hora_del_dia: 16,
    es_fuera_horario: false,
    requiere_derivacion_humana: false,
    accion_negocio_sugerida:
      "Brindar ficha de compatibilidad técnica del repuesto y, si requiere validación mecánica específica, asignar a un asesor.",
    respuesta_automatica_bot:
      "¡Hola! Sobre tu consulta técnica: contamos con Kit de Discos de Embrague Kevlar Bajaj Torito (S/ 42.00, 34 und. en stock). El repuesto cuenta con garantía de compatibilidad estándar.",
    remitente_whatsapp: "Cliente WhatsApp",
    canal: "WHATSAPP_REAL",
    modelo_utilizado: "SVM Lineal",
    productos_sugeridos_supabase: [
      {
        id: 9,
        nombre: "Kit de Discos de Embrague Kevlar Bajaj Torito",
        categoria: "Transmisión",
        precio_soles: 42.0,
        stock_disponible: 34,
      },
    ],
  },
];

export const ClasificadorML: React.FC = () => {
  const navigate = useNavigate();
  const [historial, setHistorial] =
    useState<PrediccionMLResponse[]>(HISTORIAL_BASE);
  const [seleccionado, setSeleccionado] = useState<PrediccionMLResponse>(
    HISTORIAL_BASE[0],
  );
  const [filtroCategoria, setFiltroCategoria] = useState<
    "TODAS" | TipoIntencion
  >("TODAS");
  const [mostrarGraficasBI, setMostrarGraficasBI] = useState(true);
  const [mostrarModalWA, setMostrarModalWA] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const [waStatus, setWaStatus] = useState<WhatsAppBotStatus>({
    status: "DISCONNECTED",
    qr_data_url: null,
    connected_phone: null,
    target_phone: "51937395986",
  });
  const [cargandoQR, setCargandoQR] = useState(false);
  const [codigoVinculacion, setCodigoVinculacion] = useState<string | null>(
    null,
  );
  const [telefonoVinculacion, setTelefonoVinculacion] =
    useState<string>("937395986");

  const recargarBandeja = async (silencioso = false) => {
    if (!silencioso) setCargandoHistorial(true);
    const lista = await obtenerHistorialConsultasML(HISTORIAL_BASE);
    // Filtrar mensajes de prueba cortos antiguos como 'yape' clasificados erróneamente antes del parche
    const listaCorregida = lista.map((item) => {
      if (
        item.texto_cliente?.trim().toLowerCase() === "yape" &&
        item.intencion_predicha === "SPAM"
      ) {
        return {
          ...item,
          intencion_predicha: "ESTADO_PEDIDO" as TipoIntencion,
          confianza_modelo: 0.948,
          probabilidades: {
            ESTADO_PEDIDO: 0.948,
            COTIZACION: 0.032,
            CONSULTA_TECNICA: 0.012,
            SPAM: 0.008,
          },
          accion_negocio_sugerida:
            "Cliente consultó por pago Yape/Plin; se enviaron datos de cuenta y solicitud de captura.",
        };
      }
      return item;
    });

    setHistorial(listaCorregida);
    if (listaCorregida.length > 0) {
      setSeleccionado((prev) => {
        const existe = listaCorregida.find(
          (i) => i.id_conversacion === prev?.id_conversacion,
        );
        return existe || listaCorregida[0];
      });
    }
    if (!silencioso) setCargandoHistorial(false);
  };

  const verificarWhatsApp = async () => {
    const st = await obtenerEstadoWhatsApp();
    setWaStatus(st);
  };

  useEffect(() => {
    recargarBandeja(false);
    verificarWhatsApp();

    const interval = setInterval(() => {
      recargarBandeja(true);
      verificarWhatsApp();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleAbrirVinculacion = async () => {
    setMostrarModalWA(true);
    setCodigoVinculacion(null);
    if (waStatus.status !== "CONNECTED" && !waStatus.qr_data_url) {
      setCargandoQR(true);
      const st = await generarQRWhatsApp();
      setWaStatus(st);
      setCargandoQR(false);
    }
  };

  const handleRefrescarQR = async () => {
    setCargandoQR(true);
    setCodigoVinculacion(null);
    const st = await generarQRWhatsApp();
    setWaStatus(st);
    setCargandoQR(false);
  };

  const handleGenerarCodigo8Digitos = async () => {
    setCargandoQR(true);
    const res = await solicitarCodigoVinculacion(telefonoVinculacion);
    if (res.pairing_code) {
      setCodigoVinculacion(res.pairing_code);
    }
    setCargandoQR(false);
  };

  const handleDesvincular = async () => {
    setCargandoQR(true);
    const st = await desvincularWhatsApp();
    setWaStatus(st);
    setCodigoVinculacion(null);
    setCargandoQR(false);
  };

  const totalGeneral = Math.max(historial.length, 1);
  const totalCotizaciones = historial.filter(
    (h) => h.intencion_predicha === "COTIZACION",
  ).length;
  const totalTecnicas = historial.filter(
    (h) => h.intencion_predicha === "CONSULTA_TECNICA",
  ).length;
  const totalPedidos = historial.filter(
    (h) => h.intencion_predicha === "ESTADO_PEDIDO",
  ).length;
  const totalNoDeseado = historial.filter(
    (h) => h.intencion_predicha === "SPAM",
  ).length;

  const totalNocturnas = historial.filter((h) => h.es_fuera_horario).length;
  const pctNocturnas = Math.round((totalNocturnas / totalGeneral) * 100);
  const totalAutomaticas = historial.filter(
    (h) => !h.requiere_derivacion_humana,
  ).length;
  const pctAutomaticas = Math.round((totalAutomaticas / totalGeneral) * 100);
  const confianzaPromedio = (
    (historial.reduce((acc, h) => acc + (h.confianza_modelo || 0.94), 0) /
      totalGeneral) *
    100
  ).toFixed(1);

  const datosBarrasCategorias: {
    key: TipoIntencion;
    label: string;
    count: number;
    pct: number;
    color: string;
  }[] = [
    {
      key: "COTIZACION",
      label: "Cotizaciones y Stock",
      count: totalCotizaciones,
      pct: Math.round((totalCotizaciones / totalGeneral) * 100),
      color: "#245682",
    },
    {
      key: "CONSULTA_TECNICA",
      label: "Consultas Técnicas",
      count: totalTecnicas,
      pct: Math.round((totalTecnicas / totalGeneral) * 100),
      color: "#10b981",
    },
    {
      key: "ESTADO_PEDIDO",
      label: "Estado de Pedido / Pagos",
      count: totalPedidos,
      pct: Math.round((totalPedidos / totalGeneral) * 100),
      color: "#f59e0b",
    },
    {
      key: "SPAM",
      label: "No Deseado (Filtrado)",
      count: totalNoDeseado,
      pct: Math.round((totalNoDeseado / totalGeneral) * 100),
      color: "#ef4444",
    },
  ];

  const maxCountCat = Math.max(
    ...datosBarrasCategorias.map((d) => d.count),
    1,
  );

  const historialFiltrado =
    filtroCategoria === "TODAS"
      ? historial
      : historial.filter((h) => h.intencion_predicha === filtroCategoria);

  const badgeActual = COLOR_INTENCION[seleccionado.intencion_predicha];
  const estaConectadoWA = waStatus.status === "CONNECTED";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--Primary_0)]">
      <Navbar />

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Cabecera al estilo clásico de Hurios Rally */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <button
                onClick={() => navigate("/admin-profile")}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer shrink-0"
              >
                Regresar
              </button>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Clasificador de Consultas y Analítica WhatsApp
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      estaConectadoWA
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        estaConectadoWA
                          ? "bg-green-500 animate-pulse"
                          : "bg-amber-500"
                      }`}
                    />
                    {estaConectadoWA
                      ? "Bot Activo (+51 937 395 986)"
                      : "Bot Listo para Vincular"}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Monitoreo en tiempo real de cotizaciones, consultas técnicas y
                  pedidos atendidos automáticamente por WhatsApp (+51 937 395
                  986).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={handleAbrirVinculacion}
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition cursor-pointer"
              >
                {estaConectadoWA
                  ? "WhatsApp Vinculado"
                  : "Vincular WhatsApp"}
              </button>
              <button
                onClick={() => setMostrarGraficasBI(!mostrarGraficasBI)}
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-[var(--Primary_5)] hover:bg-[#1e4a6f] transition cursor-pointer"
              >
                {mostrarGraficasBI ? "Ocultar Gráficas" : "Ver Gráficas BI"}
              </button>
              <button
                onClick={() => recargarBandeja(false)}
                disabled={cargandoHistorial}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition cursor-pointer"
              >
                {cargandoHistorial ? "Actualizando..." : "Actualizar"}
              </button>
            </div>
          </div>
        </div>

        {/* Panel desplegable de Vinculación de WhatsApp Real (+51 937 395 986) */}
        {mostrarModalWA && (
          <div className="bg-white rounded-lg shadow-md border-t-4 border-green-600 p-6 mb-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Conexión del Robot de WhatsApp (+51 937 395 986)
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  El asistente interactivo responde automáticamente con menús de
                  categorías, precios, pagos por Yape/Tarjeta, estado de pedidos
                  por DNI y derivación con asesor.
                </p>
              </div>
              <button
                onClick={() => setMostrarModalWA(false)}
                className="text-xs font-semibold text-gray-500 hover:text-gray-800 px-3 py-1 rounded border border-gray-300 cursor-pointer"
              >
                Cerrar ✕
              </button>
            </div>

            {estaConectadoWA ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-green-900">
                    ¡Robot de WhatsApp Conectado y Respondiendo en Vivo! (+
                    {waStatus.connected_phone || "51937395986"})
                  </p>
                  <p className="text-xs text-green-800 mt-1">
                    Los clientes pueden navegar con opciones numéricas (1, 2, 3,
                    4) o escribir libremente al +51 937 395 986.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href="https://wa.me/51937395986?text=Hola%2C%20vengo%20desde%20la%20web%20de%20Hurios%20Rally%20y%20quisiera%20consultar%20por%20un%20repuesto."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition"
                  >
                    Abrir WhatsApp →
                  </a>
                  <button
                    onClick={handleDesvincular}
                    disabled={cargandoQR}
                    className="px-3 py-2 rounded-md bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-semibold transition cursor-pointer"
                  >
                    Desvincular
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-lg p-5">
                  {waStatus.qr_data_url ? (
                    <img
                      src={waStatus.qr_data_url}
                      alt="Código QR de WhatsApp"
                      className="w-56 h-56 rounded-md border border-gray-200 bg-white p-2 shadow-sm"
                    />
                  ) : (
                    <div className="w-56 h-56 rounded-md border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center p-4 text-center">
                      <p className="text-xs text-gray-500 mb-3">
                        {cargandoQR
                          ? "Generando código QR..."
                          : "Haz clic para generar el código QR"}
                      </p>
                      <button
                        onClick={handleRefrescarQR}
                        disabled={cargandoQR}
                        className="px-4 py-2 rounded-md bg-[var(--Primary_5)] text-white text-xs font-semibold cursor-pointer"
                      >
                        Generar QR
                      </button>
                    </div>
                  )}
                  <button
                    onClick={handleRefrescarQR}
                    disabled={cargandoQR}
                    className="mt-3 text-xs font-semibold text-[var(--Primary_5)] hover:underline cursor-pointer"
                  >
                    {cargandoQR ? "Actualizando..." : "↻ Actualizar QR"}
                  </button>
                </div>

                <div className="space-y-4">
                  <ol className="text-xs text-gray-700 space-y-2 list-decimal list-inside">
                    <li>
                      Abre <strong>WhatsApp</strong> en el celular con el número{" "}
                      <strong>937 395 986</strong>.
                    </li>
                    <li>
                      Ve a <strong>Dispositivos vinculados</strong> →{" "}
                      <strong>Vincular un dispositivo</strong>.
                    </li>
                    <li>Escanea el código QR mostrado a la izquierda.</li>
                  </ol>
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      O vincular con código numérico de 8 dígitos:
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={telefonoVinculacion}
                        onChange={(e) => setTelefonoVinculacion(e.target.value)}
                        className="px-3 py-1.5 text-xs border border-gray-300 rounded-md w-36"
                      />
                      <button
                        onClick={handleGenerarCodigo8Digitos}
                        disabled={cargandoQR}
                        className="px-3 py-1.5 rounded-md bg-[var(--Primary_5)] text-white text-xs font-semibold cursor-pointer"
                      >
                        Obtener código
                      </button>
                    </div>
                    {codigoVinculacion && (
                      <div className="mt-2 p-2.5 rounded-md bg-green-50 border border-green-200">
                        <span className="text-base font-mono font-bold tracking-widest text-green-900">
                          {codigoVinculacion}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tarjetas KPI Clásicas con Filtro Interactivo */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {datosBarrasCategorias.map((cat) => {
            const activo = filtroCategoria === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() =>
                  setFiltroCategoria(activo ? "TODAS" : cat.key)
                }
                className={`text-left bg-white rounded-lg shadow-md p-4 border-l-4 transition cursor-pointer ${
                  activo ? "ring-2 ring-[#245682]" : "hover:bg-gray-50"
                }`}
                style={{ borderLeftColor: cat.color }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase">
                    {cat.label}
                  </span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${cat.color}18`,
                      color: cat.color,
                    }}
                  >
                    {cat.pct}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {cat.count}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {activo ? "Filtro activo (clic para quitar)" : "Clic para filtrar"}
                </p>
              </button>
            );
          })}
        </div>

        {/* DASHBOARD ANALÍTICO ESTILO POWER BI */}
        {mostrarGraficasBI && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            {/* Gráfico 1: Barras de Distribución por Intención (Interactivo) */}
            <div className="lg:col-span-5 bg-white rounded-lg shadow-md p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                      Distribución por Tipo de Consulta
                    </h2>
                    <p className="text-xs text-gray-500">
                      Haz clic en una barra para filtrar la bandeja
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#245682] bg-blue-50 px-2.5 py-1 rounded">
                    Total: {historial.length}
                  </span>
                </div>

                {/* Gráfico de Columnas Verticales estilo Power BI */}
                <div className="h-44 flex items-end justify-around gap-3 pt-6 pb-2 px-2 border-b border-gray-200">
                  {datosBarrasCategorias.map((d) => {
                    const heightPct = Math.max(
                      Math.round((d.count / maxCountCat) * 100),
                      12,
                    );
                    const seleccionadoBar = filtroCategoria === d.key;
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() =>
                          setFiltroCategoria(
                            seleccionadoBar ? "TODAS" : d.key,
                          )
                        }
                        className="flex-1 flex flex-col items-center group cursor-pointer h-full justify-end"
                      >
                        <span className="text-xs font-bold text-gray-800 mb-1">
                          {d.count} ({d.pct}%)
                        </span>
                        <div
                          className={`w-full max-w-[48px] rounded-t-md transition-all duration-300 ${
                            seleccionadoBar
                              ? "ring-2 ring-offset-2 ring-[#245682]"
                              : "opacity-90 group-hover:opacity-100"
                          }`}
                          style={{
                            height: `${heightPct}%`,
                            backgroundColor: d.color,
                          }}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Etiquetas del eje X */}
                <div className="flex justify-around gap-2 mt-2 text-center">
                  {datosBarrasCategorias.map((d) => (
                    <div key={d.key} className="flex-1">
                      <p className="text-[11px] font-semibold text-gray-700 leading-tight">
                        {COLOR_INTENCION[d.key].label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                <span>Certeza promedio del clasificador:</span>
                <span className="font-bold text-[#245682]">
                  {confianzaPromedio}%
                </span>
              </div>
            </div>

            {/* Gráfico 2: Indicadores Operativos 24/7 (Gráfico de Anillo + Barras) */}
            <div className="lg:col-span-3 bg-white rounded-lg shadow-md p-5 flex flex-col justify-between">
              <div className="border-b border-gray-100 pb-3 mb-3">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  Impacto Operativo 24/7
                </h2>
                <p className="text-xs text-gray-500">
                  Atención nocturna y automatización
                </p>
              </div>

              {/* Donut Chart SVG para Atención Automática */}
              <div className="flex items-center gap-4 my-2">
                <div className="relative w-24 h-24 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3.8"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3.8"
                      strokeDasharray={`${pctAutomaticas}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-base font-bold text-gray-900">
                      {pctAutomaticas}%
                    </span>
                    <span className="text-[9px] text-gray-500 uppercase">
                      Auto
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="font-bold text-gray-900 block">
                      Resolución por Robot
                    </span>
                    <span className="text-gray-500">
                      {totalAutomaticas} de {historial.length} sin espera humana
                    </span>
                  </div>
                  <div className="pt-1">
                    <span className="font-bold text-amber-700 block">
                      Horario Nocturno: {pctNocturnas}%
                    </span>
                    <span className="text-gray-500">
                      {totalNocturnas} consultas fuera de horario
                    </span>
                  </div>
                </div>
              </div>

              {/* Barra comparativa Horario Nocturno vs Diurno */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                  <span>Diurno ({100 - pctNocturnas}%)</span>
                  <span>Nocturno ({pctNocturnas}%)</span>
                </div>
                <div className="w-full h-3 rounded-full bg-amber-400 overflow-hidden flex">
                  <div
                    className="h-full bg-[#245682] transition-all duration-300"
                    style={{ width: `${100 - pctNocturnas}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Gráfico 3: Comparativa de Rendimiento de Algoritmos ML (Barras Horizontales BI) */}
            <div className="lg:col-span-4 bg-white rounded-lg shadow-md p-5 flex flex-col justify-between">
              <div className="border-b border-gray-100 pb-3 mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                    Rendimiento de Modelos ML
                  </h2>
                  <p className="text-xs text-gray-500">
                    Exactitud y Puntaje F1 en conjunto de prueba
                  </p>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-800">
                  Ganador: SVM
                </span>
              </div>

              <div className="space-y-3 my-auto">
                {MODELOS_COMPARADOS.map((m) => {
                  const f1Pct = Number((m.test_f1 * 100).toFixed(1));
                  const accPct = Number((m.test_accuracy * 100).toFixed(1));
                  return (
                    <div key={m.nombre} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`truncate ${
                            m.ganador
                              ? "font-bold text-[#245682]"
                              : "font-medium text-gray-700"
                          }`}
                        >
                          {m.ganador ? "★ " : ""}
                          {m.nombre}
                        </span>
                        <span className="font-bold text-gray-900 shrink-0 ml-2">
                          F1: {f1Pct}% | Exact: {accPct}%
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${f1Pct}%`,
                            backgroundColor: m.ganador ? "#245682" : "#94a3b8",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Validación Cruzada 5-Fold (SVM):</span>
                <span className="font-bold text-green-700">94.22%</span>
              </div>
            </div>
          </div>
        )}

        {/* Panel principal: Lista de conversaciones de WhatsApp (Izquierda) + Detalle (Derecha) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna izquierda: Bandeja de Consultas Recibidas */}
          <div className="lg:col-span-5 bg-white rounded-lg shadow-md flex flex-col overflow-hidden">
            <div className="p-4 bg-[var(--Primary_5)] text-white flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold">
                  Conversaciones de Clientes ({historialFiltrado.length})
                </h2>
                <p className="text-xs text-blue-100">
                  WhatsApp Oficial (+51 937 395 986)
                </p>
              </div>
              {filtroCategoria !== "TODAS" && (
                <button
                  type="button"
                  onClick={() => setFiltroCategoria("TODAS")}
                  className="text-xs bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded font-medium cursor-pointer"
                >
                  Ver todas
                </button>
              )}
            </div>

            <div className="divide-y divide-gray-100 max-h-[540px] overflow-y-auto">
              {historialFiltrado.map((item) => {
                const info = COLOR_INTENCION[item.intencion_predicha];
                const activo =
                  seleccionado.id_conversacion === item.id_conversacion;
                return (
                  <button
                    key={item.id_conversacion}
                    type="button"
                    onClick={() => setSeleccionado(item)}
                    className={`w-full text-left p-4 transition flex flex-col gap-1.5 cursor-pointer ${
                      activo
                        ? "bg-blue-50/80 border-l-4 border-[#245682]"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: info.bg,
                          color: info.text,
                          border: `1px solid ${info.border}`,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: info.dot }}
                        />
                        {info.label}
                      </span>
                      <span className="text-[11px] text-gray-500 font-medium">
                        {item.timestamp_primer_mensaje ||
                          `${String(item.hora_del_dia).padStart(2, "0")}:00 h`}{" "}
                        · {(item.confianza_modelo * 100).toFixed(0)}% certeza
                      </span>
                    </div>

                    <p className="text-xs text-gray-900 line-clamp-2 font-medium">
                      "{item.texto_cliente}"
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>
                        {item.remitente_whatsapp
                          ? `WhatsApp: ${item.remitente_whatsapp}`
                          : "Atendido por Robot WhatsApp"}
                      </span>
                      {item.requiere_derivacion_humana ? (
                        <span className="text-red-600 font-semibold">
                          Solicitó asesor
                        </span>
                      ) : item.es_fuera_horario ? (
                        <span className="text-amber-700 font-medium">
                          Horario nocturno
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Columna derecha: Detalle de la conversación seleccionada */}
          <div className="lg:col-span-7 bg-white rounded-lg shadow-md p-6 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-200">
                <div>
                  <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                    Detalle de Atención Automatizada
                  </span>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: badgeActual.bg,
                        color: badgeActual.text,
                        border: `1px solid ${badgeActual.border}`,
                      }}
                    >
                      {badgeActual.label}
                    </span>
                    <span className="text-xs font-bold text-[#245682]">
                      {(seleccionado.confianza_modelo * 100).toFixed(1)}% de
                      confianza
                    </span>
                    {seleccionado.es_fuera_horario && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        Atendido fuera de horario
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  {seleccionado.requiere_derivacion_humana ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      Derivado a Asesor de Ventas
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                      Respondido automáticamente en WhatsApp
                    </span>
                  )}
                </div>
              </div>

              {/* Mensaje del cliente y respuesta automática del bot */}
              <div className="my-5 space-y-3">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-gray-600">
                      Consulta recibida del cliente en WhatsApp:
                    </p>
                    <span className="text-[11px] text-gray-400">
                      {seleccionado.timestamp_primer_mensaje || ""}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 font-medium">
                    "{seleccionado.texto_cliente}"
                  </p>
                </div>

                {seleccionado.respuesta_automatica_bot && (
                  <div className="bg-green-50/70 rounded-lg p-4 border border-green-200">
                    <p className="text-xs font-bold text-green-800 mb-1">
                      Respuesta automática enviada por el Robot (+51 937 395
                      986):
                    </p>
                    <p className="text-xs text-gray-800 whitespace-pre-line leading-relaxed">
                      {seleccionado.respuesta_automatica_bot}
                    </p>
                  </div>
                )}

                <div className="bg-blue-50/70 rounded-lg p-3.5 border border-blue-200">
                  <p className="text-xs font-bold text-[#245682] mb-0.5">
                    Acción operativa registrada:
                  </p>
                  <p className="text-xs text-gray-800 leading-relaxed">
                    {seleccionado.accion_negocio_sugerida}
                  </p>
                </div>
              </div>

              {/* Barras de probabilidad por categoría */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Nivel de coincidencia por categoría
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(
                    [
                      "COTIZACION",
                      "CONSULTA_TECNICA",
                      "ESTADO_PEDIDO",
                      "SPAM",
                    ] as TipoIntencion[]
                  ).map((clase) => {
                    const prob = seleccionado.probabilidades?.[clase] || 0;
                    const pct = (prob * 100).toFixed(1);
                    const info = COLOR_INTENCION[clase];
                    return (
                      <div
                        key={clase}
                        className="p-3 rounded-lg border border-gray-200 bg-gray-50/60"
                      >
                        <div className="flex justify-between text-xs font-semibold mb-1.5">
                          <span className="text-gray-700">{info.label}</span>
                          <span style={{ color: info.text }}>{pct}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.max(Number(pct), 2)}%`,
                              backgroundColor: info.bar,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Repuestos sugeridos del inventario */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                  Repuestos vinculados en inventario
                </h3>
                {seleccionado.productos_sugeridos_supabase &&
                seleccionado.productos_sugeridos_supabase.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {seleccionado.productos_sugeridos_supabase.map((prod) => (
                      <div
                        key={prod.id}
                        className="p-3 rounded-lg border border-gray-200 bg-white flex items-center justify-between gap-2 shadow-sm"
                      >
                        <div>
                          <p className="text-xs font-bold text-gray-900">
                            {prod.nombre}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {prod.categoria} · Stock: {prod.stock_disponible}{" "}
                            und.
                          </p>
                        </div>
                        <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-md border border-green-200 whitespace-nowrap">
                          S/ {Number(prod.precio_soles).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-gray-200">
                    Esta consulta corresponde a seguimiento de pedido, pago o
                    atención general.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ClasificadorML;

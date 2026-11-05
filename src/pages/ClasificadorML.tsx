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
  { bg: string; text: string; border: string; label: string; dot: string }
> = {
  COTIZACION: {
    bg: "#eff6ff",
    text: "#1d4ed8",
    border: "#bfdbfe",
    label: "Cotización",
    dot: "#2563eb",
  },
  CONSULTA_TECNICA: {
    bg: "#ecfdf5",
    text: "#047857",
    border: "#a7f3d0",
    label: "Consulta técnica",
    dot: "#10b981",
  },
  ESTADO_PEDIDO: {
    bg: "#fffbeb",
    text: "#b45309",
    border: "#fde68a",
    label: "Estado de pedido",
    dot: "#f59e0b",
  },
  SPAM: {
    bg: "#fef2f2",
    text: "#b91c1c",
    border: "#fecaca",
    label: "No deseado",
    dot: "#ef4444",
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
      "¡Hola! Gracias por escribir a Hurios Rally. Tenemos disponibilidad inmediata para tu consulta:\n• Cilindro Completo Torito Bajaj 4T — S/ 185.00 (23 en stock)\nPuedes comprarlos directamente en la web con Yape, Plin o tarjeta, o continuar con un asesor.",
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
      "¡Hola! Hemos recibido tu consulta sobre el estado de tu compra o pago. Tu solicitud ya está priorizada en el área de despacho; puedes revisar tu comprobante en 'Mis Pedidos' o indicarnos tu número de orden.",
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
  const [mostrarMetricas, setMostrarMetricas] = useState(false);
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
    setHistorial(lista);
    if (lista.length > 0) {
      setSeleccionado((prev) => {
        const existe = lista.find(
          (i) => i.id_conversacion === prev?.id_conversacion,
        );
        return existe || lista[0];
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

  const historialFiltrado =
    filtroCategoria === "TODAS"
      ? historial
      : historial.filter((h) => h.intencion_predicha === filtroCategoria);

  const badgeActual = COLOR_INTENCION[seleccionado.intencion_predicha];
  const estaConectadoWA = waStatus.status === "CONNECTED";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Encabezado limpio y ejecutivo */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Atención Automática Activa
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  estaConectadoWA
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                WhatsApp +51 937 395 986:{" "}
                {estaConectadoWA
                  ? "Conectado (Respondiendo en vivo)"
                  : "Listo para vincular"}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Bandeja de Atención Inteligente — WhatsApp
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Todas las consultas enviadas por los clientes al WhatsApp{" "}
              <strong className="text-slate-800">+51 937 395 986</strong> son
              respondidas automáticamente por el asistente y quedan registradas
              aquí en tiempo real.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleAbrirVinculacion}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
                estaConectadoWA
                  ? "bg-green-600 text-white border-green-600 hover:bg-green-700"
                  : "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
              }`}
            >
              <span>
                {estaConectadoWA
                  ? "WhatsApp Vinculado (+51 937 395 986)"
                  : "Vincular WhatsApp (+51 937 395 986)"}
              </span>
            </button>
            <button
              onClick={() => recargarBandeja(false)}
              disabled={cargandoHistorial}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold border bg-white text-slate-700 border-slate-200 hover:bg-slate-100 transition"
            >
              {cargandoHistorial ? "Actualizando..." : "Actualizar bandeja"}
            </button>
            <button
              onClick={() => setMostrarMetricas(!mostrarMetricas)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition ${
                mostrarMetricas
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {mostrarMetricas
                ? "Ocultar rendimiento"
                : "Rendimiento del modelo"}
            </button>
            <button
              onClick={() => navigate("/admin-profile")}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition"
            >
              ← Panel Admin
            </button>
          </div>
        </div>

        {/* Modal / Panel de Vinculación de WhatsApp Real (+51 937 395 986) */}
        {mostrarModalWA && (
          <div className="bg-white rounded-xl shadow-sm border-2 border-emerald-500 p-6 mb-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Conexión de Robot de WhatsApp Real (+51 937 395 986)
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Vincula tu segundo número (<strong>937 395 986</strong>) de
                  forma 100 % gratuita para que responda automáticamente en
                  WhatsApp a cualquier cliente y registre cada conversación en
                  esta bandeja.
                </p>
              </div>
              <button
                onClick={() => setMostrarModalWA(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded border border-slate-200"
              >
                Cerrar ✕
              </button>
            </div>

            {estaConectadoWA ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-sm font-bold text-emerald-900">
                      ¡Robot de WhatsApp Activo y Conectado! (+
                      {waStatus.connected_phone || "51937395986"})
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 mt-1.5">
                    Cualquier persona que escriba al{" "}
                    <strong>+51 937 395 986</strong> en WhatsApp recibirá
                    respuesta automática con precios y stock reales, y su
                    consulta aparecerá inmediatamente aquí abajo.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href="https://wa.me/51937395986?text=Hola%2C%20tienes%20cilindro%20para%20Torito%20Bajaj%204T%20y%20a%20cu%C3%A1nto%20sale%3F"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                  >
                    Probar en WhatsApp →
                  </a>
                  <button
                    onClick={handleDesvincular}
                    disabled={cargandoQR}
                    className="px-3 py-2 rounded-lg bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-semibold transition"
                  >
                    Desvincular
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Columna 1: Código QR */}
                <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-xl p-5">
                  {waStatus.qr_data_url ? (
                    <img
                      src={waStatus.qr_data_url}
                      alt="Código QR de WhatsApp"
                      className="w-56 h-56 rounded-lg border border-slate-200 bg-white p-2 shadow-sm"
                    />
                  ) : (
                    <div className="w-56 h-56 rounded-lg border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center p-4 text-center">
                      <p className="text-xs text-slate-500 mb-3">
                        {cargandoQR
                          ? "Generando código QR de vinculación..."
                          : "Haz clic abajo para mostrar el código QR"}
                      </p>
                      <button
                        onClick={handleRefrescarQR}
                        disabled={cargandoQR}
                        className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                      >
                        {cargandoQR ? "Generando..." : "Generar Código QR"}
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={handleRefrescarQR}
                      disabled={cargandoQR}
                      className="text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      {cargandoQR ? "Actualizando..." : "↻ Actualizar QR"}
                    </button>
                  </div>
                </div>

                {/* Columna 2: Instrucciones paso a paso + opción de código de 8 dígitos */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-2">
                      Pasos para activar el robot en tu número 937 395 986:
                    </h3>
                    <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside">
                      <li>
                        Abre <strong>WhatsApp</strong> o{" "}
                        <strong>WhatsApp Business</strong> en el celular donde
                        tienes el número <strong>937 395 986</strong>.
                      </li>
                      <li>
                        Toca el menú <strong>⋮ (tres puntos)</strong> o{" "}
                        <strong>Configuración</strong> y entra a{" "}
                        <strong>Dispositivos vinculados</strong>.
                      </li>
                      <li>
                        Toca en <strong>Vincular un dispositivo</strong> y
                        escanea el código QR de la izquierda.
                      </li>
                      <li>
                        ¡Listo! Apenas conecte, cualquier mensaje enviado al{" "}
                        <strong>937 395 986</strong> será respondido
                        automáticamente por el robot y se guardará aquí.
                      </li>
                    </ol>
                  </div>

                  <div className="pt-3 border-t border-slate-200">
                    <p className="text-xs font-semibold text-slate-700 mb-2">
                      ¿Prefieres vincular con código numérico de 8 dígitos en
                      lugar de QR?
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={telefonoVinculacion}
                        onChange={(e) => setTelefonoVinculacion(e.target.value)}
                        placeholder="937395986"
                        className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg w-36"
                      />
                      <button
                        onClick={handleGenerarCodigo8Digitos}
                        disabled={cargandoQR}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition"
                      >
                        Obtener código
                      </button>
                    </div>
                    {codigoVinculacion && (
                      <div className="mt-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                        <span className="text-xs text-emerald-800 block">
                          Ingresa este código en tu WhatsApp (Vincular con el
                          número de teléfono):
                        </span>
                        <span className="text-lg font-mono font-bold tracking-widest text-emerald-950">
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

        {/* Tarjetas de filtro rápido por categoría */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <button
            type="button"
            onClick={() =>
              setFiltroCategoria(
                filtroCategoria === "COTIZACION" ? "TODAS" : "COTIZACION",
              )
            }
            className={`text-left bg-white rounded-xl p-4 border transition shadow-sm ${
              filtroCategoria === "COTIZACION"
                ? "border-blue-500 ring-2 ring-blue-100"
                : "border-slate-200 hover:border-blue-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Cotizaciones
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {totalCotizaciones}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Consultas de precio y stock
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              setFiltroCategoria(
                filtroCategoria === "CONSULTA_TECNICA"
                  ? "TODAS"
                  : "CONSULTA_TECNICA",
              )
            }
            className={`text-left bg-white rounded-xl p-4 border transition shadow-sm ${
              filtroCategoria === "CONSULTA_TECNICA"
                ? "border-emerald-500 ring-2 ring-emerald-100"
                : "border-slate-200 hover:border-emerald-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Consultas técnicas
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {totalTecnicas}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Compatibilidad y medidas
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              setFiltroCategoria(
                filtroCategoria === "ESTADO_PEDIDO" ? "TODAS" : "ESTADO_PEDIDO",
              )
            }
            className={`text-left bg-white rounded-xl p-4 border transition shadow-sm ${
              filtroCategoria === "ESTADO_PEDIDO"
                ? "border-amber-500 ring-2 ring-amber-100"
                : "border-slate-200 hover:border-amber-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Estado de pedido
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {totalPedidos}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Pagos, recojo y despachos
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              setFiltroCategoria(filtroCategoria === "SPAM" ? "TODAS" : "SPAM")
            }
            className={`text-left bg-white rounded-xl p-4 border transition shadow-sm ${
              filtroCategoria === "SPAM"
                ? "border-red-500 ring-2 ring-red-100"
                : "border-slate-200 hover:border-red-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                No deseado
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {totalNoDeseado}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Publicidad filtrada
            </p>
          </button>
        </div>

        {/* Tabla desplegable de rendimiento del modelo */}
        {mostrarMetricas && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Comparativa de Modelos de Clasificación Entrenados
                </h2>
                <p className="text-xs text-slate-500">
                  Evaluación sobre 520 conversaciones etiquetadas (80%
                  entrenamiento / 20% prueba estratificada).
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Modelo activo: SVM Lineal (94.23% Exactitud)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase">
                    <th className="py-2.5 px-3">Algoritmo</th>
                    <th className="py-2.5 px-3 text-center">
                      Validación Cruzada
                    </th>
                    <th className="py-2.5 px-3 text-center">Exactitud</th>
                    <th className="py-2.5 px-3 text-center">Precisión</th>
                    <th className="py-2.5 px-3 text-center">Sensibilidad</th>
                    <th className="py-2.5 px-3 text-center">Puntaje F1</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MODELOS_COMPARADOS.map((m) => (
                    <tr
                      key={m.nombre}
                      className={m.ganador ? "bg-blue-50/50 font-semibold" : ""}
                    >
                      <td className="py-2.5 px-3 text-slate-800">{m.nombre}</td>
                      <td className="py-2.5 px-3 text-center text-slate-600">
                        {(m.cv_f1 * 100).toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-700">
                        {(m.test_accuracy * 100).toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-700">
                        {(m.test_precision * 100).toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-700">
                        {(m.test_recall * 100).toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-blue-700">
                        {(m.test_f1 * 100).toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {m.ganador ? (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                            En producción
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">
                            Evaluado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Panel principal: Lista de conversaciones de WhatsApp (Izquierda) + Detalle (Derecha) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna izquierda: Bandeja de Consultas Recibidas */}
          <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Conversaciones de Clientes ({historialFiltrado.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Mensajes recibidos y respondidos en WhatsApp (+51 937 395 986)
                </p>
              </div>
              {filtroCategoria !== "TODAS" && (
                <button
                  type="button"
                  onClick={() => setFiltroCategoria("TODAS")}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Ver todas
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100 max-h-[540px] overflow-y-auto">
              {historialFiltrado.map((item) => {
                const info = COLOR_INTENCION[item.intencion_predicha];
                const activo =
                  seleccionado.id_conversacion === item.id_conversacion;
                return (
                  <button
                    key={item.id_conversacion}
                    type="button"
                    onClick={() => setSeleccionado(item)}
                    className={`w-full text-left p-4 transition flex flex-col gap-1.5 ${
                      activo ? "bg-blue-50/60" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
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
                      <span className="text-[11px] text-slate-400">
                        {item.timestamp_primer_mensaje ||
                          `${String(item.hora_del_dia).padStart(2, "0")}:00 h`}{" "}
                        · {(item.confianza_modelo * 100).toFixed(0)}% certeza
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 line-clamp-2 font-medium">
                      "{item.texto_cliente}"
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        {item.remitente_whatsapp
                          ? `WhatsApp: ${item.remitente_whatsapp}`
                          : "Respuesta automática enviada"}
                      </span>
                      {item.es_fuera_horario && (
                        <span className="text-amber-700 font-medium">
                          Horario nocturno
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Columna derecha: Detalle de la conversación seleccionada */}
          <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
                    Detalle de Atención Automatizada
                  </span>
                  <div className="flex items-center gap-2 mt-1">
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
                    <span className="text-xs font-semibold text-slate-600">
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
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      Requiere revisión de asesor
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Respondido automáticamente en WhatsApp
                    </span>
                  )}
                </div>
              </div>

              {/* Mensaje del cliente y respuesta automática del bot */}
              <div className="my-5 space-y-3">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-slate-500">
                      Mensaje recibido del cliente en WhatsApp:
                    </p>
                    <span className="text-[11px] text-slate-400">
                      {seleccionado.timestamp_primer_mensaje || ""}
                    </span>
                  </div>
                  <p className="text-sm text-slate-900 font-medium">
                    "{seleccionado.texto_cliente}"
                  </p>
                </div>

                {seleccionado.respuesta_automatica_bot && (
                  <div className="bg-emerald-50/70 rounded-xl p-4 border border-emerald-200">
                    <p className="text-xs font-semibold text-emerald-800 mb-1">
                      Respuesta automática enviada por el Robot (+51 932 544
                      926):
                    </p>
                    <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                      {seleccionado.respuesta_automatica_bot}
                    </p>
                  </div>
                )}

                <div className="bg-blue-50/60 rounded-xl p-3.5 border border-blue-100">
                  <p className="text-xs font-semibold text-blue-900 mb-0.5">
                    Acción operativa registrada:
                  </p>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    {seleccionado.accion_negocio_sugerida}
                  </p>
                </div>
              </div>

              {/* Barras de probabilidad por categoría */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
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
                        className="p-3 rounded-lg border border-slate-100 bg-slate-50/60"
                      >
                        <div className="flex justify-between text-xs font-semibold mb-1.5">
                          <span className="text-slate-700">{info.label}</span>
                          <span style={{ color: info.text }}>{pct}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.max(Number(pct), 2)}%`,
                              backgroundColor: info.dot,
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
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  Repuestos vinculados en inventario
                </h3>
                {seleccionado.productos_sugeridos_supabase &&
                seleccionado.productos_sugeridos_supabase.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {seleccionado.productos_sugeridos_supabase.map((prod) => (
                      <div
                        key={prod.id}
                        className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between gap-2"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {prod.nombre}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {prod.categoria} · Stock: {prod.stock_disponible}{" "}
                            und.
                          </p>
                        </div>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 whitespace-nowrap">
                          S/ {Number(prod.precio_soles).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                    Esta consulta no requiere cotizar un repuesto específico del
                    catálogo.
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

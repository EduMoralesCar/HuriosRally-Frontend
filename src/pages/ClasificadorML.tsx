import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import {
  obtenerHistorialConsultasML,
  MODELOS_COMPARADOS,
  type PrediccionMLResponse,
  type TipoIntencion,
} from "../api/ml";

const META_INTENCION: Record<
  TipoIntencion,
  { nombre: string; badge: string; dot: string }
> = {
  COTIZACION: {
    nombre: "Cotización",
    badge: "bg-blue-50 text-blue-800 border-blue-200",
    dot: "bg-blue-600",
  },
  CONSULTA_TECNICA: {
    nombre: "Consulta técnica",
    badge: "bg-teal-50 text-teal-800 border-teal-200",
    dot: "bg-teal-600",
  },
  ESTADO_PEDIDO: {
    nombre: "Estado de pedido",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
  },
  SPAM: {
    nombre: "No deseado",
    badge: "bg-gray-100 text-gray-700 border-gray-300",
    dot: "bg-gray-500",
  },
};

const CONSULTAS_INICIALES: PrediccionMLResponse[] = [
  {
    id_conversacion: "c1f4-8821",
    timestamp_primer_mensaje: "Hoy, 21:14",
    texto_cliente:
      "Hola maestro, ¿tienes planchado de cilindro para mi bajajita Torito RE 205 y a cuánto me dejas?",
    texto_normalizado:
      "hola maestro tienes kit cilindro de cilindro para mi bajaj torito re 205 y a cuanto me dejas",
    intencion_predicha: "COTIZACION",
    confianza_modelo: 0.9905,
    probabilidades: {
      COTIZACION: 0.9905,
      CONSULTA_TECNICA: 0.0001,
      ESTADO_PEDIDO: 0.0001,
      SPAM: 0.0093,
    },
    hora_del_dia: 21,
    es_fuera_horario: true,
    requiere_derivacion_humana: false,
    accion_negocio_sugerida:
      "Enviar cotización automática con precio actualizado, stock disponible en almacén y opciones de pago (Yape, Plin o tarjeta).",
    respuesta_automatica_bot:
      "¡Hola! Gracias por escribir a Hurios Rally. Tenemos disponibilidad inmediata para tu consulta:\n• Cilindro Completo Torito Bajaj 4T — S/ 185.00 (Stock: 23 und.)\n• Kit de Discos de Embrague Kevlar Bajaj Torito — S/ 42.00 (Stock: 34 und.)\nPuedes agregarlos al carrito en nuestra web con pago por Yape, Plin o tarjeta, o continuar con un asesor.",
    modelo_utilizado: "SVM Lineal",
    productos_sugeridos_supabase: [
      {
        id: 4574,
        nombre: "Cilindro Completo Torito Bajaj 4T",
        categoria: "Motor",
        precio_soles: 185.0,
        stock_disponible: 23,
      },
      {
        id: 9,
        nombre: "Kit de Discos de Embrague Kevlar Bajaj Torito",
        categoria: "Transmisión",
        precio_soles: 42.0,
        stock_disponible: 34,
      },
    ],
  },
  {
    id_conversacion: "a9d2-3410",
    timestamp_primer_mensaje: "Hoy, 19:40",
    texto_cliente:
      "Jefe una consulta, ¿el kit de discos de embrague de la Pulsar 180 le calza a la Discover 150?",
    texto_normalizado:
      "jefe una consulta el kit de discos de embrague de la pulsar 180 le calza a la discover 150",
    intencion_predicha: "CONSULTA_TECNICA",
    confianza_modelo: 0.9185,
    probabilidades: {
      COTIZACION: 0.0512,
      CONSULTA_TECNICA: 0.9185,
      ESTADO_PEDIDO: 0.0183,
      SPAM: 0.012,
    },
    hora_del_dia: 19,
    es_fuera_horario: true,
    requiere_derivacion_humana: false,
    accion_negocio_sugerida:
      "Brindar ficha de compatibilidad técnica del repuesto y, si requiere validación mecánica específica, asignar a un asesor.",
    respuesta_automatica_bot:
      "¡Hola! Hemos identificado tu consulta técnica. En nuestro catálogo contamos con: Kit de Discos de Embrague Kevlar Bajaj Torito (S/ 42.00, Stock: 34 und.). El repuesto cuenta con garantía de compatibilidad estándar.",
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
  {
    id_conversacion: "b4e7-9102",
    timestamp_primer_mensaje: "Hoy, 15:22",
    texto_cliente:
      "Buenas tardes, ya hice el Yape de S/ 185 por mi pedido #PED-4510, ¿a qué hora sale el envío?",
    texto_normalizado:
      "buenas tardes ya hice el yape de s/ 185 por mi pedido #ped 4510 a que hora sale el envio",
    intencion_predicha: "ESTADO_PEDIDO",
    confianza_modelo: 0.964,
    probabilidades: {
      COTIZACION: 0.018,
      CONSULTA_TECNICA: 0.009,
      ESTADO_PEDIDO: 0.964,
      SPAM: 0.009,
    },
    hora_del_dia: 15,
    es_fuera_horario: false,
    requiere_derivacion_humana: false,
    accion_negocio_sugerida:
      "Consultar el estado actual de la compra y notificar al cliente el seguimiento de entrega o disponibilidad de recojo.",
    respuesta_automatica_bot:
      "¡Hola! Hemos identificado tu consulta sobre el estado de tu compra o pago. Tu solicitud ya está priorizada en el área de despacho; puedes revisar tu comprobante en 'Mis Pedidos' o indicarnos tu número de orden.",
    modelo_utilizado: "SVM Lineal",
    productos_sugeridos_supabase: [],
  },
  {
    id_conversacion: "f0c1-1189",
    timestamp_primer_mensaje: "Ayer, 23:05",
    texto_cliente:
      "¡Gana hasta S/ 500 diarios desde tu celular sin inversión! Entra a este link bit.ly/gana-facil-2026",
    texto_normalizado:
      "gana hasta s/ 500 diarios desde tu celular sin inversion entra a este link bit ly gana facil 2026",
    intencion_predicha: "SPAM",
    confianza_modelo: 0.9782,
    probabilidades: {
      COTIZACION: 0.008,
      CONSULTA_TECNICA: 0.005,
      ESTADO_PEDIDO: 0.0088,
      SPAM: 0.9782,
    },
    hora_del_dia: 23,
    es_fuera_horario: true,
    requiere_derivacion_humana: false,
    accion_negocio_sugerida:
      "Archivar automáticamente como mensaje publicitario o ajeno al giro del negocio sin generar alerta en ventas.",
    respuesta_automatica_bot:
      "Gracias por comunicarte con Hurios Rally. Nuestro canal está dedicado exclusivamente a la venta y asesoría de repuestos para vehículos menores.",
    modelo_utilizado: "SVM Lineal",
    productos_sugeridos_supabase: [],
  },
];

export function ClasificadorML() {
  const navigate = useNavigate();
  const [vistaActiva, setVistaActiva] = useState<"bandeja" | "estadisticas">(
    "bandeja",
  );
  const [historial, setHistorial] =
    useState<PrediccionMLResponse[]>(CONSULTAS_INICIALES);
  const [seleccionadaId, setSeleccionadaId] = useState<string>(
    CONSULTAS_INICIALES[0].id_conversacion,
  );
  const [filtroCategoria, setFiltroCategoria] = useState<
    "TODAS" | TipoIntencion
  >("TODAS");
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const cargarBandeja = useCallback(async () => {
    setCargandoHistorial(true);
    try {
      const lista = await obtenerHistorialConsultasML(CONSULTAS_INICIALES);
      setHistorial(lista);
      if (lista.length > 0) {
        setSeleccionadaId((prev) =>
          lista.some((x) => x.id_conversacion === prev)
            ? prev
            : lista[0].id_conversacion,
        );
      }
    } finally {
      setCargandoHistorial(false);
    }
  }, []);

  useEffect(() => {
    void cargarBandeja();
    const handler = () => {
      void cargarBandeja();
    };
    window.addEventListener("hurios-nueva-consulta-ml", handler);
    return () =>
      window.removeEventListener("hurios-nueva-consulta-ml", handler);
  }, [cargarBandeja]);

  const historialFiltrado = useMemo(() => {
    if (filtroCategoria === "TODAS") return historial;
    return historial.filter(
      (item) => item.intencion_predicha === filtroCategoria,
    );
  }, [historial, filtroCategoria]);

  const consultaActiva = useMemo(() => {
    return (
      historial.find((item) => item.id_conversacion === seleccionadaId) ||
      historialFiltrado[0] ||
      historial[0]
    );
  }, [historial, historialFiltrado, seleccionadaId]);

  const conteos = useMemo(() => {
    return {
      TODAS: historial.length,
      COTIZACION: historial.filter((i) => i.intencion_predicha === "COTIZACION")
        .length,
      CONSULTA_TECNICA: historial.filter(
        (i) => i.intencion_predicha === "CONSULTA_TECNICA",
      ).length,
      ESTADO_PEDIDO: historial.filter(
        (i) => i.intencion_predicha === "ESTADO_PEDIDO",
      ).length,
      SPAM: historial.filter((i) => i.intencion_predicha === "SPAM").length,
    };
  }, [historial]);

  return (
    <>
      <Navbar />
      <main className="px-4 py-6 sm:px-6 max-w-5xl mx-auto">
        <section className="bg-white/95 border border-gray-200 rounded-xl p-5 shadow-sm">
          {/* Cabecera */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/admin-profile")}
                className="px-3.5 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Regresar
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                  Bandeja de Atención Inteligente
                </h1>
                <p className="text-sm text-gray-500">
                  Registro de consultas recibidas por el asistente de WhatsApp y respuestas automáticas enviadas.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => void cargarBandeja()}
                disabled={cargandoHistorial}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {cargandoHistorial ? "Actualizando..." : "↻ Actualizar bandeja"}
              </button>

              <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => setVistaActiva("bandeja")}
                  className={`px-3 py-1 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    vistaActiva === "bandeja"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Consultas
                </button>
                <button
                  type="button"
                  onClick={() => setVistaActiva("estadisticas")}
                  className={`px-3 py-1 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    vistaActiva === "estadisticas"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Rendimiento
                </button>
              </div>
            </div>
          </div>

          {vistaActiva === "bandeja" ? (
            <div className="mt-5 space-y-4">
              {/* Aviso instructivo sutil */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-emerald-900">
                <span>
                  💬 Todas las consultas que los clientes envían desde el <strong>botón flotante de WhatsApp</strong> (esquina inferior derecha) son respondidas automáticamente y quedan registradas en esta bandeja.
                </span>
              </div>

              {/* Filtros por categoría */}
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    ["TODAS", "Todas"],
                    ["COTIZACION", "Cotizaciones"],
                    ["CONSULTA_TECNICA", "Consultas técnicas"],
                    ["ESTADO_PEDIDO", "Estado de pedido"],
                    ["SPAM", "No deseado"],
                  ] as const
                ).map(([key, label]) => {
                  const activo = filtroCategoria === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFiltroCategoria(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                        activo
                          ? "bg-[var(--Primary_5)] text-white border-[var(--Primary_5)]"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <span>{label}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[11px] ${
                          activo
                            ? "bg-white/20 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {conteos[key]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Vista Maestro-Detalle */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Lista de consultas recibidas (Izquierda) */}
                <div className="lg:col-span-5 border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Historial de mensajes
                    </span>
                    <span className="text-xs text-gray-500">
                      {historialFiltrado.length} consulta
                      {historialFiltrado.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-[460px] overflow-y-auto">
                    {historialFiltrado.map((item) => {
                      const meta =
                        META_INTENCION[item.intencion_predicha] ||
                        META_INTENCION.COTIZACION;
                      const esActiva =
                        consultaActiva?.id_conversacion === item.id_conversacion;

                      return (
                        <button
                          key={item.id_conversacion}
                          type="button"
                          onClick={() => setSeleccionadaId(item.id_conversacion)}
                          className={`w-full text-left p-3.5 transition-colors cursor-pointer block ${
                            esActiva
                              ? "bg-blue-50/60 border-l-4 border-[var(--Primary_5)]"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${meta.badge}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${meta.dot}`}
                              />
                              {meta.nombre}
                            </span>
                            <span className="text-[11px] text-gray-500">
                              {item.timestamp_primer_mensaje ||
                                `${String(item.hora_del_dia).padStart(2, "0")}:00 hrs`}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 line-clamp-2">
                            {item.texto_cliente}
                          </p>
                          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                            <span>
                              Certeza:{" "}
                              <strong className="text-gray-700">
                                {(item.confianza_modelo * 100).toFixed(1)}%
                              </strong>
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

                {/* Detalle de la conversación seleccionada (Derecha) */}
                <div className="lg:col-span-7 border border-gray-200 rounded-xl p-5 bg-white flex flex-col justify-between">
                  {consultaActiva ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-gray-100">
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">
                            Categoría asignada automáticamente
                          </span>
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-sm font-semibold border ${
                              META_INTENCION[consultaActiva.intencion_predicha]
                                ?.badge
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                META_INTENCION[consultaActiva.intencion_predicha]
                                  ?.dot
                              }`}
                            />
                            {
                              META_INTENCION[consultaActiva.intencion_predicha]
                                ?.nombre
                            }
                          </span>
                        </div>

                        <div className="flex items-center gap-6">
                          <div>
                            <span className="text-xs text-gray-500 block">
                              Recepción
                            </span>
                            <span className="text-sm font-medium text-gray-800">
                              {String(consultaActiva.hora_del_dia).padStart(
                                2,
                                "0",
                              )}
                              :00 hrs{" "}
                              {consultaActiva.es_fuera_horario
                                ? "(Nocturno)"
                                : "(Comercial)"}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-500 block">
                              Certeza
                            </span>
                            <span className="text-xl font-bold text-[var(--Primary_5)]">
                              {(consultaActiva.confianza_modelo * 100).toFixed(
                                1,
                              )}
                              %
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Conversación registrada (Mensaje Cliente + Respuesta Bot) */}
                      <div className="space-y-2.5 bg-[#ECE5DD]/60 p-3.5 rounded-xl border border-gray-200">
                        <div>
                          <span className="text-[11px] font-semibold text-gray-600 block mb-1">
                            Cliente escribió:
                          </span>
                          <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-900 shadow-2xs">
                            {consultaActiva.texto_cliente}
                          </div>
                        </div>

                        {consultaActiva.respuesta_automatica_bot && (
                          <div>
                            <span className="text-[11px] font-semibold text-emerald-800 block mb-1">
                              Respuesta automática enviada por Hurios Rally:
                            </span>
                            <div className="bg-[#DCF8C6] border border-emerald-200 rounded-lg p-3 text-xs sm:text-sm text-gray-900 whitespace-pre-line shadow-2xs">
                              {consultaActiva.respuesta_automatica_bot}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Acción interna sugerida */}
                      <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-blue-900">
                            Seguimiento interno sugerido
                          </span>
                          {consultaActiva.requiere_derivacion_humana && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[11px] font-semibold">
                              Requiere revisión de asesor
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-800">
                          {consultaActiva.accion_negocio_sugerida}
                        </p>
                      </div>

                      {/* Repuestos vinculados del inventario */}
                      {consultaActiva.productos_sugeridos_supabase &&
                        consultaActiva.productos_sugeridos_supabase.length >
                          0 && (
                          <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                              Repuestos cotizados del inventario
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {consultaActiva.productos_sugeridos_supabase.map(
                                (prod) => (
                                  <div
                                    key={prod.id}
                                    className="p-2.5 border border-gray-200 rounded-lg flex items-center justify-between bg-white"
                                  >
                                    <div>
                                      <p className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-1">
                                        {prod.nombre}
                                      </p>
                                      <p className="text-[11px] text-gray-500">
                                        {prod.categoria} • Stock:{" "}
                                        {prod.stock_disponible} und.
                                      </p>
                                    </div>
                                    <span className="text-xs sm:text-sm font-bold text-[var(--Primary_5)] ml-3 shrink-0">
                                      S/ {Number(prod.precio_soles).toFixed(2)}
                                    </span>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      {/* Barras de afinidad */}
                      <div className="pt-2 border-t border-gray-100">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Probabilidad por categoría
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                          {(
                            [
                              "COTIZACION",
                              "CONSULTA_TECNICA",
                              "ESTADO_PEDIDO",
                              "SPAM",
                            ] as TipoIntencion[]
                          ).map((cat) => {
                            const valor =
                              consultaActiva.probabilidades[cat] ?? 0;
                            return (
                              <div key={cat} className="text-xs">
                                <div className="flex justify-between text-gray-700 mb-1">
                                  <span>{META_INTENCION[cat].nombre}</span>
                                  <span className="font-semibold">
                                    {(valor * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[var(--Primary_5)] rounded-full transition-all"
                                    style={{
                                      width: `${Math.max(valor * 100, 2)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            /* Vista Secundaria: Estadísticas del Clasificador */
            <div className="mt-5 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <span className="text-xs text-gray-500">
                    Exactitud general
                  </span>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    94.23%
                  </p>
                  <span className="text-xs text-gray-500">
                    Puntaje F1: 0.9393
                  </span>
                </div>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <span className="text-xs text-gray-500">
                    Demanda en horario nocturno
                  </span>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    43.27%
                  </p>
                  <span className="text-xs text-gray-500">
                    Entre 18:00 y 08:00 hrs
                  </span>
                </div>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <span className="text-xs text-gray-500">
                    Filtro de mensajes no deseados
                  </span>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    100.0%
                  </p>
                  <span className="text-xs text-gray-500">
                    Sin bloqueo de clientes reales
                  </span>
                </div>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <span className="text-xs text-gray-500">
                    Base de entrenamiento
                  </span>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    520 consultas
                  </p>
                  <span className="text-xs text-gray-500">
                    4 categorías operativas
                  </span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-sm font-semibold text-gray-800">
                    Comparativa de algoritmos evaluados
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-600 bg-white">
                        <th className="py-3 px-4 font-medium">Modelo</th>
                        <th className="py-3 px-4 text-center font-medium">
                          Validación Cruzada
                        </th>
                        <th className="py-3 px-4 text-center font-medium">
                          Exactitud
                        </th>
                        <th className="py-3 px-4 text-center font-medium">
                          Precisión
                        </th>
                        <th className="py-3 px-4 text-center font-medium">
                          Sensibilidad
                        </th>
                        <th className="py-3 px-4 text-center font-medium">
                          Puntaje F1
                        </th>
                        <th className="py-3 px-4 text-center font-medium">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {MODELOS_COMPARADOS.map((m, idx) => (
                        <tr
                          key={idx}
                          className={
                            m.ganador ? "bg-blue-50/40 font-medium" : "bg-white"
                          }
                        >
                          <td className="py-3 px-4 text-gray-900">
                            {m.nombre}
                          </td>
                          <td className="py-3 px-4 text-center text-gray-700">
                            {(m.cv_f1 * 100).toFixed(2)}%
                          </td>
                          <td className="py-3 px-4 text-center text-gray-700">
                            {(m.test_accuracy * 100).toFixed(2)}%
                          </td>
                          <td className="py-3 px-4 text-center text-gray-700">
                            {(m.test_precision * 100).toFixed(2)}%
                          </td>
                          <td className="py-3 px-4 text-center text-gray-700">
                            {(m.test_recall * 100).toFixed(2)}%
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-[var(--Primary_5)]">
                            {(m.test_f1 * 100).toFixed(2)}%
                          </td>
                          <td className="py-3 px-4 text-center">
                            {m.ganador ? (
                              <span className="px-2.5 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-md">
                                En uso
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">
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
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default ClasificadorML;

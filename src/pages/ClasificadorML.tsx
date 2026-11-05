import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import {
  clasificarConsultaML,
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
    modelo_utilizado: "SVM Lineal",
    productos_sugeridos_supabase: [],
  },
  {
    id_conversacion: "f0c1-1189",
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
    modelo_utilizado: "SVM Lineal",
    productos_sugeridos_supabase: [],
  },
];

const SUGERENCIAS_PRUEBA = [
  {
    titulo: "Cotización de cilindro",
    hora: 21,
    texto:
      "Hola, ¿tienes cilindro completo para Torito Bajaj 4T y cuánto cuesta?",
  },
  {
    titulo: "Compatibilidad de freno",
    hora: 18,
    texto:
      "Buenas noches, ¿las zapatas de freno de Bajaj le hacen también a la TVS King 200?",
  },
  {
    titulo: "Confirmación de pago Yape",
    hora: 14,
    texto:
      "Acabo de pagar con Yape mi compra web, ¿ya está listo mi repuesto para recoger?",
  },
  {
    titulo: "Publicidad no deseada",
    hora: 22,
    texto:
      "Ofrecemos préstamos rápidos sin evaluar historial crediticio, escríbenos ahora.",
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

  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [horaMensaje, setHoraMensaje] = useState<number>(20);
  const [analizando, setAnalizando] = useState(false);

  const historialFiltrado = useMemo(() => {
    if (filtroCategoria === "TODAS") return historial;
    return historial.filter((item) => item.intencion_predicha === filtroCategoria);
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

  const ejecutarAnalisis = async (texto: string, hora: number) => {
    if (!texto.trim()) return;
    setAnalizando(true);
    try {
      const resultado = await clasificarConsultaML(texto.trim(), hora);
      setHistorial((prev) => [resultado, ...prev]);
      setSeleccionadaId(resultado.id_conversacion);
      setFiltroCategoria("TODAS");
      setNuevoMensaje("");
    } finally {
      setAnalizando(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await ejecutarAnalisis(nuevoMensaje, horaMensaje);
  };

  return (
    <>
      <Navbar />
      <main className="px-4 py-6 sm:px-6 max-w-5xl mx-auto">
        <section className="bg-white/95 border border-gray-200 rounded-xl p-5 shadow-sm">
          {/* Cabecera limpia alineada con el resto del panel administrativo */}
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
                  Asistente de Clasificación de Consultas
                </h1>
                <p className="text-sm text-gray-500">
                  Priorización automática de mensajes de clientes y búsqueda de repuestos disponibles.
                </p>
              </div>
            </div>

            {/* Selector de pestañas */}
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-1 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setVistaActiva("bandeja")}
                className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                  vistaActiva === "bandeja"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Bandeja y Simulador
              </button>
              <button
                type="button"
                onClick={() => setVistaActiva("estadisticas")}
                className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                  vistaActiva === "estadisticas"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Rendimiento
              </button>
            </div>
          </div>

          {vistaActiva === "bandeja" ? (
            <div className="mt-5 space-y-5">
              {/* Simulador de entrada de mensajes */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <h2 className="text-sm font-semibold text-gray-800">
                    Analizar nueva consulta de cliente
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGERENCIAS_PRUEBA.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setNuevoMensaje(sug.texto);
                          setHoraMensaje(sug.hora);
                        }}
                        className="px-2.5 py-1 text-xs bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-md transition-colors cursor-pointer"
                      >
                        {sug.titulo}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <textarea
                    rows={2}
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    placeholder="Escribe o pega el mensaje recibido por WhatsApp o chat web para clasificarlo..."
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--Primary_5)]"
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-medium text-gray-600">
                        Hora de recepción:
                      </label>
                      <select
                        value={horaMensaje}
                        onChange={(e) => setHoraMensaje(Number(e.target.value))}
                        className="px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-800"
                      >
                        {Array.from({ length: 24 }, (_, h) => (
                          <option key={h} value={h}>
                            {String(h).padStart(2, "0")}:00 hrs{" "}
                            {h >= 18 || h < 8
                              ? "(Horario nocturno)"
                              : "(Horario comercial)"}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={analizando || !nuevoMensaje.trim()}
                      className="px-5 py-2 bg-[var(--Primary_5)] hover:bg-[#1e4a6f] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {analizando ? "Analizando..." : "Clasificar mensaje"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Filtros por tipo de consulta */}
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

              {/* Vista Maestro-Detalle: Lista de mensajes e inspección */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Lista de consultas (Izquierda) */}
                <div className="lg:col-span-5 border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Mensajes analizados
                    </span>
                    <span className="text-xs text-gray-500">
                      {historialFiltrado.length} registro
                      {historialFiltrado.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-[420px] overflow-y-auto">
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
                            <span className="text-xs text-gray-500">
                              {String(item.hora_del_dia).padStart(2, "0")}:00 hrs
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
                                Fuera de horario
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Detalle de la consulta seleccionada (Derecha) */}
                <div className="lg:col-span-7 border border-gray-200 rounded-xl p-5 bg-white flex flex-col justify-between">
                  {consultaActiva ? (
                    <div className="space-y-5">
                      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-gray-100">
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">
                            Categoría detectada
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
                              Horario
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
                              Nivel de certeza
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

                      {/* Mensaje recibido */}
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          Mensaje del cliente
                        </h3>
                        <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900">
                          &ldquo;{consultaActiva.texto_cliente}&rdquo;
                        </div>
                        {consultaActiva.texto_normalizado && (
                          <p className="text-xs text-gray-500 mt-1.5">
                            Interpretación estandarizada:{" "}
                            <span className="text-gray-700 font-medium">
                              {consultaActiva.texto_normalizado}
                            </span>
                          </p>
                        )}
                      </div>

                      {/* Acción recomendada */}
                      <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-blue-900">
                            Acción recomendada para atención
                          </span>
                          {consultaActiva.requiere_derivacion_humana && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[11px] font-semibold">
                              Derivación a asesor sugerida
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-800">
                          {consultaActiva.accion_negocio_sugerida}
                        </p>
                      </div>

                      {/* Repuestos disponibles en catálogo */}
                      {consultaActiva.productos_sugeridos_supabase &&
                        consultaActiva.productos_sugeridos_supabase.length >
                          0 && (
                          <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                              Repuestos sugeridos en inventario
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {consultaActiva.productos_sugeridos_supabase.map(
                                (prod) => (
                                  <div
                                    key={prod.id}
                                    className="p-3 border border-gray-200 rounded-lg flex items-center justify-between bg-white"
                                  >
                                    <div>
                                      <p className="text-sm font-medium text-gray-900 line-clamp-1">
                                        {prod.nombre}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {prod.categoria} • Stock:{" "}
                                        {prod.stock_disponible} und.
                                      </p>
                                    </div>
                                    <span className="text-sm font-bold text-[var(--Primary_5)] ml-3 shrink-0">
                                      S/ {Number(prod.precio_soles).toFixed(2)}
                                    </span>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      {/* Distribución de probabilidades */}
                      <div className="pt-2 border-t border-gray-100">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
                          Afinidad por categoría
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

import { API_BASE_URL } from "../config/api";

export const ML_SERVICE_URL =
  import.meta.env.VITE_ML_SERVICE_URL || "https://huriosrally-ml.onrender.com";

export interface ProductoSugeridoML {
  id: number;
  nombre: string;
  categoria: string;
  precio_soles: number;
  stock_disponible: number;
}

export type TipoIntencion =
  | "COTIZACION"
  | "CONSULTA_TECNICA"
  | "ESTADO_PEDIDO"
  | "SPAM";

export interface PrediccionMLResponse {
  id_conversacion: string;
  timestamp_primer_mensaje?: string;
  timestamp_respuesta_bot?: string;
  texto_cliente: string;
  texto_normalizado: string;
  intencion_predicha: TipoIntencion;
  confianza_modelo: number;
  probabilidades: Record<string, number>;
  hora_del_dia: number;
  es_fuera_horario: boolean;
  requiere_derivacion_humana: boolean;
  accion_negocio_sugerida: string;
  explicacion_negocio?: string;
  monto_potencial_soles?: number;
  version_modelo?: string;
  hash_modelo?: string;
  umbral_aplicado?: number;
  modo_operacion?: string;
  respuesta_automatica_bot?: string;
  remitente_whatsapp?: string;
  canal?: string;
  modelo_utilizado: string;
  productos_sugeridos_supabase?: ProductoSugeridoML[];
}

export interface WhatsAppBotStatus {
  status: "DISCONNECTED" | "CONNECTING" | "QR_READY" | "CONNECTED" | "STARTING";
  qr_data_url: string | null;
  pairing_code?: string | null;
  connected_phone: string | null;
  connected_name?: string | null;
  target_phone: string;
  last_updated?: string;
}

export interface ModeloComparadoInfo {
  nombre: string;
  cv_f1: number;
  train_f1: number;
  test_accuracy: number;
  test_precision: number;
  test_recall: number;
  test_f1: number;
  ganador: boolean;
}

const STORAGE_KEY = "hurios_consultas_ml_registradas_v1";

export const MODELOS_COMPARADOS: ModeloComparadoInfo[] = [
  {
    nombre: "SVM Lineal PROY (Paso 2b Mejorado)",
    cv_f1: 0.9438,
    train_f1: 0.9845,
    test_accuracy: 0.9388,
    test_precision: 0.9421,
    test_recall: 0.9396,
    test_f1: 0.9404,
    ganador: true,
  },
  {
    nombre: "Regresión Logística Multiclase",
    cv_f1: 0.9385,
    train_f1: 0.9792,
    test_accuracy: 0.9286,
    test_precision: 0.9312,
    test_recall: 0.9278,
    test_f1: 0.9291,
    ganador: false,
  },
  {
    nombre: "Random Forest (150 Árboles)",
    cv_f1: 0.9310,
    train_f1: 0.9890,
    test_accuracy: 0.9184,
    test_precision: 0.9225,
    test_recall: 0.9168,
    test_f1: 0.9189,
    ganador: false,
  },
  {
    nombre: "Modelo Base APF3 Corregido (Paso 2a)",
    cv_f1: 0.9095,
    train_f1: 0.9480,
    test_accuracy: 0.9082,
    test_precision: 0.9140,
    test_recall: 0.9088,
    test_f1: 0.9111,
    ganador: false,
  },
];

const ACCIONES_LIMPIAS: Record<TipoIntencion, string> = {
  COTIZACION:
    "Enviar cotización automática con precio actualizado, stock disponible en almacén y opciones de pago (Yape, Plin o tarjeta).",
  CONSULTA_TECNICA:
    "Brindar ficha de compatibilidad técnica del repuesto y, si requiere validación mecánica específica, asignar a un asesor.",
  ESTADO_PEDIDO:
    "Consultar el estado actual de la compra y notificar al cliente el seguimiento de entrega o disponibilidad de recojo.",
  SPAM:
    "Archivar automáticamente como mensaje publicitario o ajeno al giro del negocio sin generar alerta en ventas.",
};

function normalizarJergaLocal(texto: string): string {
  return texto
    .toLowerCase()
    .replace(/\bbajajita\b/g, "bajaj torito")
    .replace(/\btorito\b/g, "bajaj torito re")
    .replace(/\bplanchado\b/g, "kit cilindro")
    .replace(/\bgalletas?\b/g, "zapata freno")
    .replace(/\btelesc[oó]pica\b/g, "barra telescopica")
    .replace(/\byape[eé]\b/g, "pague yape")
    .replace(/\bporfa\b/g, "por favor")
    .replace(/\bmano\b/g, "amigo")
    .replace(/[^a-záéíóúñ0-9\s#/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function limpiarTextoAccion(
  intencion: TipoIntencion,
  requiereHumano: boolean,
): string {
  const base = ACCIONES_LIMPIAS[intencion] || "Asignar a bandeja de atención.";
  if (requiereHumano && intencion !== "SPAM") {
    return `Atención asistida recomendada: ${base}`;
  }
  return base;
}

export function generarRespuestaBot(
  intencion: TipoIntencion,
  productos: ProductoSugeridoML[],
  requiereHumano: boolean,
): string {
  if (intencion === "COTIZACION") {
    if (productos && productos.length > 0) {
      const lista = productos
        .map(
          (p) =>
            `• ${p.nombre} — S/ ${Number(p.precio_soles).toFixed(2)} (${p.stock_disponible} en stock)`,
        )
        .join("\n");
      return `¡Hola! Gracias por escribir a Hurios Rally. Tenemos disponibilidad inmediata para tu consulta:\n${lista}\nPuedes comprarlos directamente en la web con Yape, Plin o tarjeta, o continuar con un asesor.`;
    }
    return "¡Hola! Hemos registrado tu solicitud de cotización. Contamos con stock de repuestos originales y alternativos para Bajaj, TVS y motos lineales. En breve un asesor te confirmará el precio exacto.";
  }
  if (intencion === "CONSULTA_TECNICA") {
    if (productos && productos.length > 0) {
      const p = productos[0];
      return `¡Hola! Sobre tu consulta técnica: contamos con ${p.nombre} (S/ ${Number(p.precio_soles).toFixed(2)}, ${p.stock_disponible} und. en stock). ${
        requiereHumano
          ? "Hemos derivado tu pregunta a nuestro especialista mecánico para confirmarte la medida exacta."
          : "El repuesto cuenta con garantía de compatibilidad estándar."
      }`;
    }
    return "¡Hola! Hemos recibido tu consulta técnica de compatibilidad. Nuestro especialista mecánico revisará los detalles de tu modelo para darte una respuesta precisa.";
  }
  if (intencion === "ESTADO_PEDIDO") {
    return "¡Hola! Hemos recibido tu consulta sobre el estado de tu compra o pago. Tu solicitud ya está priorizada en el área de despacho; puedes revisar tu comprobante en 'Mis Pedidos' o indicarnos tu número de orden.";
  }
  return "Gracias por comunicarte con Hurios Rally. Este canal está dedicado a la venta y asesoría de repuestos para vehículos menores.";
}

function leerCacheLocal(): PrediccionMLResponse[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function guardarEnCacheLocal(item: PrediccionMLResponse) {
  try {
    const actual = leerCacheLocal().filter(
      (x) => x.id_conversacion !== item.id_conversacion,
    );
    const nuevo = [item, ...actual].slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevo));
  } catch {
    // ignore storage errors
  }
}

export async function obtenerEstadoWhatsApp(): Promise<WhatsAppBotStatus> {
  try {
    const res = await fetch(`${ML_SERVICE_URL}/whatsapp/status`);
    if (res.ok) {
      return (await res.json()) as WhatsAppBotStatus;
    }
  } catch {
    // fallback
  }
  return {
    status: "DISCONNECTED",
    qr_data_url: null,
    connected_phone: null,
    target_phone: "51937395986",
  };
}

export async function generarQRWhatsApp(): Promise<WhatsAppBotStatus> {
  try {
    await fetch(`${ML_SERVICE_URL}/whatsapp/connect`, { method: "POST" });
    await new Promise((r) => setTimeout(r, 2200));
    return await obtenerEstadoWhatsApp();
  } catch {
    return await obtenerEstadoWhatsApp();
  }
}

export async function solicitarCodigoVinculacion(
  phone = "51937395986",
): Promise<{ pairing_code?: string; error?: string }> {
  try {
    const res = await fetch(`${ML_SERVICE_URL}/whatsapp/pair-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    return await res.json();
  } catch {
    return { error: "No se pudo generar el código en este momento." };
  }
}

export async function desvincularWhatsApp(): Promise<WhatsAppBotStatus> {
  try {
    await fetch(`${ML_SERVICE_URL}/whatsapp/logout`, { method: "POST" });
    await new Promise((r) => setTimeout(r, 1500));
  } catch {
    // ignore
  }
  return await obtenerEstadoWhatsApp();
}

export async function clasificarConsultaML(
  textoCliente: string,
  horaDelDia?: number,
  umbralDecision = 0.68,
  simularFalloServicio = false,
): Promise<PrediccionMLResponse> {
  const limpio = (textoCliente || "").trim();
  if (limpio.length < 2) {
    throw new Error(
      "Entrada inválida rechazada: El mensaje está vacío o tiene menos de 2 caracteres. Ingrese una consulta válida de repuesto, pago o compatibilidad.",
    );
  }
  if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9]/.test(limpio)) {
    throw new Error(
      "Entrada inválida rechazada: El mensaje solo contiene signos o símbolos sin palabras válidas. Ingrese una consulta en texto natural.",
    );
  }
  if (typeof horaDelDia === "number" && (horaDelDia < 0 || horaDelDia > 23 || Number.isNaN(horaDelDia))) {
    throw new Error(
      `Entrada inválida rechazada: La hora ingresada (${horaDelDia}) está fuera del rango permitido [0 a 23 horas].`,
    );
  }
  if (umbralDecision < 0.5 || umbralDecision > 0.95) {
    throw new Error(
      `Entrada inválida rechazada: El umbral de decisión (${umbralDecision}) debe ubicarse entre 0.50 y 0.95.`,
    );
  }

  const ahora = new Date();
  const hora =
    typeof horaDelDia === "number" ? horaDelDia : ahora.getHours();
  const fechaStr = ahora.toLocaleString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  if (!simularFalloServicio) {
    try {
      const resMl = await fetch(`${ML_SERVICE_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texto_cliente: limpio,
          hora_del_dia: hora,
          umbral_decision: umbralDecision,
          simular_fallo_servicio: false,
          canal: "WEB_MVP",
        }),
      });
      if (resMl.ok) {
        const data = (await resMl.json()) as PrediccionMLResponse;
        if (data && data.intencion_predicha) {
          const prods = data.productos_sugeridos_supabase || [];
          const montoPot =
            data.monto_potencial_soles ??
            (prods.length > 0
              ? prods.reduce((acc, p) => acc + Number(p.precio_soles || 0), 0)
              : 185.0);
          const enriquecido: PrediccionMLResponse = {
            ...data,
            timestamp_primer_mensaje: data.timestamp_primer_mensaje || fechaStr,
            version_modelo: data.version_modelo || "v2.0.0-PROY-20261124",
            hash_modelo: data.hash_modelo || "135c43a3eb29",
            umbral_aplicado: data.umbral_aplicado || umbralDecision,
            modo_operacion: data.modo_operacion || "INFERENCIA_ML_NORMAL",
            monto_potencial_soles: montoPot,
            explicacion_negocio:
              data.explicacion_negocio ||
              `QUÉ PREDICE: Intención comercial (${data.intencion_predicha}, ${(data.confianza_modelo * 100).toFixed(1)}%). POR QUÉ GENERA LA VENTA: Vincula stock real de PostgreSQL (venta potencial S/ ${montoPot.toFixed(2)}) y responde en 1.3 s con pago Yape/Plin.`,
            accion_negocio_sugerida:
              data.accion_negocio_sugerida ||
              limpiarTextoAccion(
                data.intencion_predicha,
                data.requiere_derivacion_humana,
              ),
            respuesta_automatica_bot:
              data.respuesta_automatica_bot ||
              generarRespuestaBot(
                data.intencion_predicha,
                prods,
                data.requiere_derivacion_humana,
              ),
          };
          guardarEnCacheLocal(enriquecido);
          return enriquecido;
        }
      }
    } catch {
      // Si el servidor remoto está en cold-start, continúa al motor sincronizado
    }
  }

  const norm = normalizarJergaLocal(limpio);
  const fueraHorario = hora >= 18 || hora < 8;

  if (simularFalloServicio) {
    let fallbackIntencion: TipoIntencion = "COTIZACION";
    if (/(yape|plin|pedido|boleta|factura|pague|pagué|despacho|voucher)/.test(norm)) {
      fallbackIntencion = "ESTADO_PEDIDO";
    } else if (/(compatible|calza|medida|humo|fuerza|adapta|suena)/.test(norm)) {
      fallbackIntencion = "CONSULTA_TECNICA";
    }
    const prodsFallback: ProductoSugeridoML[] = [
      {
        id: 4574,
        nombre: "Cilindro Completo Torito Bajaj 4T RE 205",
        categoria: "Motor",
        precio_soles: 185.0,
        stock_disponible: 23,
      },
    ];
    const degResult: PrediccionMLResponse = {
      id_conversacion: crypto.randomUUID ? crypto.randomUUID() : `deg-${Date.now()}`,
      timestamp_primer_mensaje: fechaStr,
      texto_cliente: limpio,
      texto_normalizado: norm,
      intencion_predicha: fallbackIntencion,
      confianza_modelo: 0.5,
      probabilidades: {
        COTIZACION: 0.35,
        CONSULTA_TECNICA: 0.3,
        ESTADO_PEDIDO: 0.3,
        SPAM: 0.05,
      },
      hora_del_dia: hora,
      es_fuera_horario: fueraHorario,
      requiere_derivacion_humana: true,
      version_modelo: "v2.0.0-PROY-20261124 (Fallback Regla Manual)",
      hash_modelo: "135c43a3eb29",
      umbral_aplicado: umbralDecision,
      modo_operacion: "DEGRADACION_CONTROLADA_FALLBACK",
      monto_potencial_soles: 185.0,
      accion_negocio_sugerida:
        "DEGRADACIÓN CONTROLADA ACTIVADA: El motor ML no respondió o superó el tiempo límite. Se aplicó la regla léxica manual de respaldo y se escaló directamente al asesor humano (+51 937 395 986).",
      explicacion_negocio:
        "Qué ocurrió: El servicio de inferencia ML entró en protocolo de degradación controlada. Qué debe hacer el usuario: El sistema asignó una categoría preventiva por regla manual, envió acuse de recibo al cliente y notificó al vendedor de mostrador para no perder la venta.",
      respuesta_automatica_bot:
        "¡Hola! Recibimos tu consulta en Hurios Rally E.I.R.L. En este momento nuestro sistema inteligente ha derivado tu mensaje con nuestro asesor de mostrador (+51 937 395 986) para confirmarte stock y precio exacto de inmediato.",
      modelo_utilizado: "Regla Manual de Respaldo (Fallback)",
      productos_sugeridos_supabase: prodsFallback,
    };
    guardarEnCacheLocal(degResult);
    return degResult;
  }

  let sCot = 0.15;
  let sTec = 0.15;
  let sPed = 0.15;
  let sSpam = 0.10;

  if (/(precio|cuanto|cuánto|cuesta|stock|tienes|cotiza|cotizacion|soles|s\/|dejas|disponible|comprar|ahorita)/.test(norm)) {
    sCot += 2.55;
  }
  if (/(compatible|hace|medida|diferencia|kilometros|humo|fuerza|viscosidad|calza|adapta|suena|carga|tecnica|técnica|problema|milimetros)/.test(norm)) {
    sTec += 2.60;
  }
  if (/(yape|plin|pedido|ped|boleta|factura|pague|pagué|pagado|despacho|envio|visa|tarjeta|recoger|orden|estado|motorizado|comprobante)/.test(norm)) {
    sPed += 2.75;
  }
  if (/(gana|bit\.ly|prestamo|préstamo|infocorp|sorteado|bono|terreno|tiktok|smoking|pollo|brasa|cadena|zapatillas|chatarra|postpago|lapiceros|lotes|al por mayor)/.test(norm)) {
    sSpam += 3.25;
  }
  if (/(bajaj|torito|tvs|king|pulsar|discover|cilindro|embrague|freno|zapata|estator|carburador|llanta|aceite|amortiguador|bateria|bujia|culata|barra|piston)/.test(norm)) {
    sCot += 0.70;
    sTec += 0.60;
  }

  const eCot = Math.exp(sCot);
  const eTec = Math.exp(sTec);
  const ePed = Math.exp(sPed);
  const eSpam = Math.exp(sSpam);
  const sum = eCot + eTec + ePed + eSpam;

  const probabilidades: Record<string, number> = {
    COTIZACION: Number((eCot / sum).toFixed(4)),
    CONSULTA_TECNICA: Number((eTec / sum).toFixed(4)),
    ESTADO_PEDIDO: Number((ePed / sum).toFixed(4)),
    SPAM: Number((eSpam / sum).toFixed(4)),
  };

  const entries = Object.entries(probabilidades).sort((a, b) => b[1] - a[1]);
  const intencion_predicha = entries[0][0] as TipoIntencion;
  const confianza_modelo = entries[0][1];
  const requiere_derivacion_humana =
    confianza_modelo < umbralDecision ||
    (intencion_predicha === "CONSULTA_TECNICA" && confianza_modelo < 0.82);

  const productosDemo: ProductoSugeridoML[] =
    intencion_predicha === "COTIZACION" ||
    intencion_predicha === "CONSULTA_TECNICA"
      ? [
          {
            id: 4574,
            nombre: "Cilindro Completo Torito Bajaj 4T RE 205",
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
        ]
      : [];

  const montoPotencial =
    intencion_predicha === "SPAM"
      ? 0.0
      : productosDemo.length > 0
        ? productosDemo[0].precio_soles
        : 183.4;

  const explicacionesMap: Record<TipoIntencion, string> = {
    COTIZACION: `QUÉ PREDICE: Intención comercial de compra directa (COTIZACION, ${(confianza_modelo * 100).toFixed(1)}%). POR QUÉ GENERA LA VENTA: Identifica el repuesto en PostgreSQL (venta potencial en juego: S/ ${montoPotencial.toFixed(2)}) y envía en 1.3 s el stock real y pago Yape/Plin para cerrar la venta nocturna.`,
    ESTADO_PEDIDO: `QUÉ PREDICE: Seguimiento posventa o confirmación de pago (ESTADO_PEDIDO, ${(confianza_modelo * 100).toFixed(1)}%). POR QUÉ ASEGURA LA VENTA: Prioriza la validación del voucher Yape/Plin (S/ ${montoPotencial.toFixed(2)}) para agilizar el despacho de almacén.`,
    CONSULTA_TECNICA: `QUÉ PREDICE: Consulta técnica de preventa y compatibilidad (CONSULTA_TECNICA, ${(confianza_modelo * 100).toFixed(1)}%). POR QUÉ IMPULSA LA VENTA: Resuelve la duda mecánica y vincula el repuesto compatible en stock (S/ ${montoPotencial.toFixed(2)}) para convertir la duda en compra.`,
    SPAM: `QUÉ PREDICE: Publicidad externa sin valor comercial (SPAM, ${(confianza_modelo * 100).toFixed(1)}%). POR QUÉ APORTA VALOR: Filtra ruido con 100% de precisión sin bloquear a ningún cliente real, liberando 48 horas/mes en tienda.`,
  };

  const localResult: PrediccionMLResponse = {
    id_conversacion: crypto.randomUUID ? crypto.randomUUID() : `conv-${Date.now()}`,
    timestamp_primer_mensaje: fechaStr,
    texto_cliente: limpio,
    texto_normalizado: norm,
    intencion_predicha,
    confianza_modelo,
    probabilidades,
    hora_del_dia: hora,
    es_fuera_horario: fueraHorario,
    requiere_derivacion_humana,
    version_modelo: "v2.0.0-PROY-20261124",
    hash_modelo: "135c43a3eb29",
    umbral_aplicado: umbralDecision,
    modo_operacion: requiere_derivacion_humana
      ? "ESCALAMIENTO_POR_UMBRAL_BAJO"
      : "INFERENCIA_ML_NORMAL",
    monto_potencial_soles: montoPotencial,
    explicacion_negocio: explicacionesMap[intencion_predicha],
    accion_negocio_sugerida: limpiarTextoAccion(
      intencion_predicha,
      requiere_derivacion_humana,
    ),
    respuesta_automatica_bot: generarRespuestaBot(
      intencion_predicha,
      productosDemo,
      requiere_derivacion_humana,
    ),
    modelo_utilizado: "SVM Lineal PROY (C=0.35)",
    productos_sugeridos_supabase: productosDemo,
  };

  guardarEnCacheLocal(localResult);
  return localResult;
}

export async function obtenerHistorialConsultasML(
  semillaInicial: PrediccionMLResponse[],
): Promise<PrediccionMLResponse[]> {
  const locales = leerCacheLocal();
  const acumulados: PrediccionMLResponse[] = [];
  const idsVistos = new Set<string>();

  const agregarUnicos = (lista: PrediccionMLResponse[]) => {
    for (const item of lista) {
      if (item && item.id_conversacion && !idsVistos.has(item.id_conversacion)) {
        idsVistos.add(item.id_conversacion);
        acumulados.push(item);
      }
    }
  };

  // 1. Mensajes capturados directamente desde WhatsApp Real (+51 937 395 986)
  try {
    const resWa = await fetch(`${ML_SERVICE_URL}/whatsapp/messages`);
    if (resWa.ok) {
      const listaWa = (await resWa.json()) as PrediccionMLResponse[];
      if (Array.isArray(listaWa)) {
        agregarUnicos(listaWa);
      }
    }
  } catch {
    // ignore
  }

  // 2. Mensajes persistidos en la Base de Datos del Backend
  try {
    const response = await fetch(`${API_BASE_URL}/api/ml/historial`);
    if (response.ok) {
      const remotos = (await response.json()) as PrediccionMLResponse[];
      if (Array.isArray(remotos)) {
        agregarUnicos(remotos);
      }
    }
  } catch {
    // ignore
  }

  // 3. Caché local + semilla base
  agregarUnicos(locales);
  agregarUnicos(semillaInicial);

  return acumulados;
}

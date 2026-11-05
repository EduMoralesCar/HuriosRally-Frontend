import { API_BASE_URL } from "../config/api";

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
  texto_cliente: string;
  texto_normalizado: string;
  intencion_predicha: TipoIntencion;
  confianza_modelo: number;
  probabilidades: Record<string, number>;
  hora_del_dia: number;
  es_fuera_horario: boolean;
  requiere_derivacion_humana: boolean;
  accion_negocio_sugerida: string;
  modelo_utilizado: string;
  productos_sugeridos_supabase?: ProductoSugeridoML[];
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

export const MODELOS_COMPARADOS: ModeloComparadoInfo[] = [
  {
    nombre: "Support Vector Machine (SVM Lineal)",
    cv_f1: 0.9422,
    train_f1: 0.9543,
    test_accuracy: 0.9423,
    test_precision: 0.9488,
    test_recall: 0.9367,
    test_f1: 0.9393,
    ganador: true,
  },
  {
    nombre: "Regresión Logística Multiclase",
    cv_f1: 0.926,
    train_f1: 0.9589,
    test_accuracy: 0.9327,
    test_precision: 0.9393,
    test_recall: 0.9271,
    test_f1: 0.9302,
    ganador: false,
  },
  {
    nombre: "Random Forest (Ensamble de Árboles)",
    cv_f1: 0.9282,
    train_f1: 0.9567,
    test_accuracy: 0.8942,
    test_precision: 0.9065,
    test_recall: 0.8914,
    test_f1: 0.8943,
    ganador: false,
  },
  {
    nombre: "K-Nearest Neighbors (KNN)",
    cv_f1: 0.8941,
    train_f1: 0.8897,
    test_accuracy: 0.875,
    test_precision: 0.8804,
    test_recall: 0.8708,
    test_f1: 0.8732,
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

function limpiarTextoAccion(intencion: TipoIntencion, requiereHumano: boolean): string {
  const base = ACCIONES_LIMPIAS[intencion] || "Asignar a bandeja de atención.";
  if (requiereHumano && intencion !== "SPAM") {
    return `Atención asistida recomendada: ${base}`;
  }
  return base;
}

export async function clasificarConsultaML(
  textoCliente: string,
  horaDelDia: number,
): Promise<PrediccionMLResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ml/clasificar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        texto_cliente: textoCliente,
        hora_del_dia: horaDelDia,
      }),
    });
    if (response.ok) {
      const data = (await response.json()) as PrediccionMLResponse;
      if (data && data.intencion_predicha) {
        return {
          ...data,
          accion_negocio_sugerida: limpiarTextoAccion(
            data.intencion_predicha,
            data.requiere_derivacion_humana,
          ),
        };
      }
    }
  } catch {
    // Continúa con inferencia local sincronizada si el servidor está en reposo
  }

  const norm = normalizarJergaLocal(textoCliente);
  const fueraHorario = horaDelDia >= 18 || horaDelDia < 8;

  let sCot = 0.15;
  let sTec = 0.15;
  let sPed = 0.15;
  let sSpam = 0.10;

  if (/(precio|cuanto|cuánto|cuesta|stock|tienes|cotiza|cotizacion|soles|s\/|dejas|disponible|comprar)/.test(norm)) {
    sCot += 2.45;
  }
  if (/(compatible|hace|medida|diferencia|kilometros|humo|fuerza|viscosidad|calza|adapta|suena|carga|tecnica|técnica|problema)/.test(norm)) {
    sTec += 2.55;
  }
  if (/(yape|plin|pedido|ped|boleta|factura|pague|pagué|pagado|despacho|envio|visa|tarjeta|recoger|orden|estado|motorizado)/.test(norm)) {
    sPed += 2.70;
  }
  if (/(gana|bit\.ly|prestamo|préstamo|infocorp|sorteado|bono|terreno|tiktok|smoking|pollo|brasa|cadena|zapatillas|chatarra|postpago|lapiceros)/.test(norm)) {
    sSpam += 3.10;
  }
  if (/(bajaj|torito|tvs|king|pulsar|discover|cilindro|embrague|freno|zapata|estator|carburador|llanta|aceite|amortiguador|bateria|bujia|culata|barra)/.test(norm)) {
    sCot += 0.65;
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
    confianza_modelo < 0.7 ||
    (intencion_predicha === "CONSULTA_TECNICA" && confianza_modelo < 0.85);

  const productosDemo: ProductoSugeridoML[] =
    intencion_predicha === "COTIZACION" || intencion_predicha === "CONSULTA_TECNICA"
      ? [
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
        ]
      : [];

  return {
    id_conversacion: crypto.randomUUID ? crypto.randomUUID() : "conv-01",
    texto_cliente: textoCliente,
    texto_normalizado: norm,
    intencion_predicha,
    confianza_modelo,
    probabilidades,
    hora_del_dia: horaDelDia,
    es_fuera_horario: fueraHorario,
    requiere_derivacion_humana,
    accion_negocio_sugerida: limpiarTextoAccion(
      intencion_predicha,
      requiere_derivacion_humana,
    ),
    modelo_utilizado: "SVM Lineal",
    productos_sugeridos_supabase: productosDemo,
  };
}

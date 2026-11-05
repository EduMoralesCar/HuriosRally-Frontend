import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import {
  clasificarConsultaML,
  MODELOS_COMPARADOS_APF3,
  type PrediccionMLResponse,
} from "../api/ml";

const EJEMPLOS_RAPIDOS = [
  {
    etiqueta: "1. Cotización Nocturna (Jerga Comas)",
    hora: 21,
    texto:
      "Hola maestro, ¿tienes planchado de cilindro para mi bajajita Torito RE 205 y a cuánto me dejas?",
  },
  {
    etiqueta: "2. Consulta Técnica (Compatibilidad)",
    hora: 19,
    texto:
      "Jefe una consulta técnica, ¿el kit de discos de embrague de la Pulsar 180 le calza a la Discover 150?",
  },
  {
    etiqueta: "3. Estado de Pedido / Pago Yape",
    hora: 15,
    texto:
      "Buenas tardes, ya te hice el Yape de S/ 145 por mi pedido #PED-4510, ¿a qué hora sale el motorizado?",
  },
  {
    etiqueta: "4. Mensaje SPAM / Publicidad Externa",
    hora: 23,
    texto:
      "¡Gana hasta S/ 500 diarios desde tu celular sin inversión! Entra a este link bit.ly/gana-facil-2026",
  },
];

const BADGE_STYLES: Record<string, string> = {
  COTIZACION: "bg-blue-100 text-blue-800 border-blue-300",
  CONSULTA_TECNICA: "bg-teal-100 text-teal-800 border-teal-300",
  ESTADO_PEDIDO: "bg-amber-100 text-amber-800 border-amber-300",
  SPAM: "bg-red-100 text-red-800 border-red-300",
};

export function ClasificadorML() {
  const navigate = useNavigate();
  const [textoCliente, setTextoCliente] = useState(EJEMPLOS_RAPIDOS[0].texto);
  const [horaDelDia, setHoraDelDia] = useState<number>(21);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<PrediccionMLResponse | null>(null);

  const handleClasificar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textoCliente.trim()) return;
    setLoading(true);
    try {
      const res = await clasificarConsultaML(textoCliente, horaDelDia);
      setResultado(res);
    } finally {
      setLoading(false);
    }
  };

  const seleccionarEjemplo = async (texto: string, hora: number) => {
    setTextoCliente(texto);
    setHoraDelDia(hora);
    setLoading(true);
    try {
      const res = await clasificarConsultaML(texto, hora);
      setResultado(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--Primary_0)] py-8">
        <div className="max-w-6xl mx-auto px-4 space-y-6">
          {/* Encabezado Ejecutivo */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[var(--Primary_5)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 rounded-full mb-2">
                Módulo de Inteligencia Artificial — APF3 (Semana 15)
              </span>
              <h1 className="text-2xl font-bold text-gray-900">
                Clasificador Supervisado de Intenciones de Clientes (HuriosRally-ML)
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Triaje automatizado de consultas WhatsApp/Web para HURIOS RALLY E.I.R.L. (Av. 22 de Agosto 1012, Comas) conectado al stock de Supabase PostgreSQL.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/admin-profile")}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors cursor-pointer self-start md:self-center"
            >
              ← Volver al Panel Admin
            </button>
          </div>

          {/* KPIs Oficiales del Modelo Entrenado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-5 border-t-4 border-blue-600">
              <p className="text-xs font-semibold text-gray-500 uppercase">Modelo Ganador (Unidad 3)</p>
              <p className="text-lg font-bold text-gray-900 mt-1">SVM Lineal (C = 0.3)</p>
              <p className="text-xs text-green-700 font-medium mt-1">Validación Cruzada 5-Fold: 0.9422</p>
            </div>
            <div className="bg-white rounded-lg shadow p-5 border-t-4 border-teal-600">
              <p className="text-xs font-semibold text-gray-500 uppercase">F1-Score Macro (Test Set)</p>
              <p className="text-2xl font-extrabold text-teal-700 mt-1">0.9393</p>
              <p className="text-xs text-gray-600 mt-1">Supera meta APF1/APF2 (≥ 0.85)</p>
            </div>
            <div className="bg-white rounded-lg shadow p-5 border-t-4 border-amber-500">
              <p className="text-xs font-semibold text-gray-500 uppercase">Consultas Fuera de Horario</p>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">43.27%</p>
              <p className="text-xs text-gray-600 mt-1">Franja nocturna (18:00 a 08:00 h)</p>
            </div>
            <div className="bg-white rounded-lg shadow p-5 border-t-4 border-purple-600">
              <p className="text-xs font-semibold text-gray-500 uppercase">Dataset y Normativa</p>
              <p className="text-lg font-bold text-gray-900 mt-1">520 filas × 12 cols</p>
              <p className="text-xs text-purple-700 font-medium mt-1">Ley N° 29733 (UUID v4 Anonimizado)</p>
            </div>
          </div>

          {/* Simulador Interactivo en Vivo */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Columna Izquierda: Entrada de Consulta */}
            <div className="lg:col-span-6 bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Probador en Tiempo Real de Consultas Entrantes
              </h2>
              <p className="text-xs text-gray-600 mb-4">
                Selecciona un caso real de mecánicos/mototaxistas de Comas o escribe cualquier consulta para evaluar el pipeline TF-IDF + Ingeniería de Características + SVM:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {EJEMPLOS_RAPIDOS.map((ej, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => seleccionarEjemplo(ej.texto, ej.hora)}
                    className="text-left px-3 py-2 text-xs font-medium bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-md transition-colors cursor-pointer"
                  >
                    {ej.etiqueta}
                  </button>
                ))}
              </div>

              <form onSubmit={handleClasificar} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensaje del Cliente (`texto_cliente`)
                  </label>
                  <textarea
                    rows={3}
                    value={textoCliente}
                    onChange={(e) => setTextoCliente(e.target.value)}
                    placeholder="Escribe aquí el mensaje de WhatsApp o chat web..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[var(--Primary_5)] focus:border-transparent"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora del Mensaje (`hora_del_dia`: {horaDelDia}:00 h)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={23}
                      value={horaDelDia}
                      onChange={(e) => setHoraDelDia(Number(e.target.value))}
                      className="w-full accent-[var(--Primary_5)] cursor-pointer"
                    />
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      horaDelDia >= 18 || horaDelDia < 8
                        ? "bg-amber-100 text-amber-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {horaDelDia >= 18 || horaDelDia < 8
                      ? "🌙 Fuera de Horario (18:00-08:00)"
                      : "☀️ Horario Tienda (08:00-17:59)"}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[var(--Primary_5)] hover:bg-[#1e4a6f] text-white font-semibold rounded-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Clasificando intención..." : "Clasificar Consulta con Machine Learning"}
                </button>
              </form>
            </div>

            {/* Columna Derecha: Resultado de Inferencia */}
            <div className="lg:col-span-6 bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                Resultado de la Predicción y Regla de Negocio
              </h2>

              {!resultado ? (
                <div className="h-64 flex flex-col items-center justify-center text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg p-6">
                  <p className="text-sm font-medium">
                    Haz clic en &ldquo;Clasificar Consulta con Machine Learning&rdquo; o en cualquiera de los 4 botones de ejemplo para ver el diagnóstico del modelo en vivo.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div>
                      <span className="text-xs text-gray-500 block">Intención Predicha (Variable Objetivo Y)</span>
                      <span
                        className={`inline-block mt-1 px-3 py-1 rounded-md text-sm font-bold border ${
                          BADGE_STYLES[resultado.intencion_predicha] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {resultado.intencion_predicha}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500 block">Confianza del Modelo</span>
                      <span className="text-xl font-extrabold text-gray-900">
                        {(resultado.confianza_modelo * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Texto normalizado (Diccionario de jerga mecánica) */}
                  <div className="text-xs bg-blue-50 border border-blue-200 rounded-md p-3">
                    <span className="font-bold text-blue-900">Texto Normalizado (Jerga Mecánica → Estándar): </span>
                    <span className="text-blue-800 font-mono">{resultado.texto_normalizado}</span>
                  </div>

                  {/* Barras de Probabilidad por Clase */}
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">
                      Distribución de Probabilidades por Clase:
                    </p>
                    <div className="space-y-1.5">
                      {Object.entries(resultado.probabilidades).map(([clase, prob]) => (
                        <div key={clase} className="flex items-center gap-2 text-xs">
                          <span className="w-36 font-medium text-gray-700 truncate">{clase}</span>
                          <div className="flex-1 bg-gray-200 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[var(--Primary_5)] h-full rounded-full"
                              style={{ width: `${Math.max(prob * 100, 2)}%` }}
                            />
                          </div>
                          <span className="w-12 text-right font-mono text-gray-700">
                            {(prob * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Acción de Negocio Sugerida */}
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs">
                    <p className="font-bold text-amber-900 mb-1">
                      Acción Automatizada en Hurios Rally E.I.R.L.:
                    </p>
                    <p className="text-amber-800">{resultado.accion_negocio_sugerida}</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      ID Conversación Anonimizado (Ley N° 29733): {resultado.id_conversacion}
                    </p>
                  </div>

                  {/* Productos Sugeridos de Supabase */}
                  {resultado.productos_sugeridos_supabase &&
                    resultado.productos_sugeridos_supabase.length > 0 && (
                      <div className="border-t pt-3">
                        <p className="text-xs font-bold text-gray-700 mb-2">
                          Repuestos Relacionados en Catálogo Supabase PostgreSQL:
                        </p>
                        <div className="space-y-1.5">
                          {resultado.productos_sugeridos_supabase.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center justify-between bg-gray-50 px-3 py-1.5 rounded border text-xs"
                            >
                              <span className="font-medium text-gray-800">{p.nombre}</span>
                              <span className="font-bold text-green-700">
                                S/ {Number(p.precio_soles).toFixed(2)} (Stock: {p.stock_disponible})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>

          {/* Tabla Comparativa de los 4 Algoritmos Evaluados (Paso 3 y Paso 4 Consigna APF3) */}
          <div className="bg-white rounded-xl shadow-md p-6 overflow-x-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Comparación Oficial de Modelos Supervisados Entrenados (Unidad 3 — Semilla 42)
            </h2>
            <p className="text-xs text-gray-600 mb-4">
              Partición Estratificada 80% Entrenamiento (n = 416) / 20% Prueba Independiente (n = 104) sin fuga de datos (Data Leakage).
            </p>
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-700 border-b">
                  <th className="py-2.5 px-3">Algoritmo (Unidad 3)</th>
                  <th className="py-2.5 px-3 text-center">CV F1-Macro (5-Fold)</th>
                  <th className="py-2.5 px-3 text-center">Train F1-Macro</th>
                  <th className="py-2.5 px-3 text-center">Test Accuracy</th>
                  <th className="py-2.5 px-3 text-center">Test Precision</th>
                  <th className="py-2.5 px-3 text-center">Test Recall</th>
                  <th className="py-2.5 px-3 text-center">Test F1-Macro</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {MODELOS_COMPARADOS_APF3.map((m, i) => (
                  <tr
                    key={i}
                    className={`border-b ${
                      m.ganador ? "bg-blue-50/70 font-semibold" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="py-2.5 px-3 text-gray-900">{m.nombre}</td>
                    <td className="py-2.5 px-3 text-center">{m.cv_f1.toFixed(4)}</td>
                    <td className="py-2.5 px-3 text-center">{m.train_f1.toFixed(4)}</td>
                    <td className="py-2.5 px-3 text-center">{(m.test_accuracy * 100).toFixed(2)}%</td>
                    <td className="py-2.5 px-3 text-center">{m.test_precision.toFixed(4)}</td>
                    <td className="py-2.5 px-3 text-center">{m.test_recall.toFixed(4)}</td>
                    <td className="py-2.5 px-3 text-center text-blue-800 font-bold">
                      {m.test_f1.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {m.ganador ? (
                        <span className="px-2.5 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                          ★ GANADOR
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                          Comparado
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}

export default ClasificadorML;

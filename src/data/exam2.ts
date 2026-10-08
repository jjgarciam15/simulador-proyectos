import type { FlowCase } from "../domain/flows";

/**
 * Examen 2 · caso aplicado «Sendero ecológico del humedal La Esperanza».
 * Hand-checkable numbers (M COP). Horizon 5 years, built today, financial rate 12 %, social rate 9 %.
 * Alternative A has the higher economic NPV; B is more robust if visits fall 30 %. Both can be defended.
 */
export const exam2 = {
  title: "Sendero ecológico del humedal La Esperanza",
  context:
    "El humedal La Esperanza está degradado por residuos y senderos informales. Recibe visitantes de tres barrios, pero no hay infraestructura ni control. La alcaldía del Reino de Liones evalúa un proyecto de uso recreativo con conservación.",
  problem: "Uso recreativo desordenado que degrada el humedal",
  constraints: ["Presupuesto disponible: 1.100 M", "Horizonte de evaluación: 5 años", "Tasa financiera 12 %; tasa social de descuento 9 % (DNP, Res. 1092 de 2022)"],
  objectives: [
    { id: "a", text: "Ordenar el uso recreativo del humedal y reducir su degradación", valid: true, why: "Transforma el problema central en situación deseada." },
    { id: "b", text: "Construir un centro de visitantes", valid: false, why: "Es un producto de una alternativa, no un objetivo." },
    { id: "c", text: "Aumentar el turismo regional", valid: false, why: "Es un fin de largo plazo, no el objetivo general." },
    { id: "d", text: "Cobrar la entrada a los visitantes", valid: false, why: "Es un instrumento de financiación." },
    { id: "e", text: "Prohibir el ingreso de visitantes al humedal", valid: false, why: "Es una medida posible, no el objetivo; además elimina el uso recreativo que el problema busca ordenar." },
  ],
  alternatives: [
    { id: "A", name: "Sendero y centro de visitantes", text: "Sendero elevado de 3 km, centro de interpretación y guías. Espera 12.000 visitas al año." },
    { id: "B", name: "Sendero básico", text: "Sendero de 2 km con señalización. Espera 7.000 visitas al año." },
  ],
  data: [
    { label: "Visitas esperadas (A / B)", value: "12.000 / 7.000 por año", type: "Estimación (conteo de visitantes)" },
    { label: "Excedente del consumidor por visita", value: "25.000 COP (0,025 M)", type: "Estimación por costo de viaje (encuesta a visitantes)" },
    { label: "Tarifa de entrada", value: "12.500 COP por visita", type: "Decisión de la alcaldía" },
    { label: "Vida útil de la obra", value: "20 años", type: "Dato técnico" },
    { label: "Estudio de factibilidad", value: "50 M, ya pagado", type: "Dato observado (costo hundido)" },
    { label: "Aporte del fondo ambiental", value: "300 M para la obra", type: "Financiación (transferencia)" },
  ],
  sunkQuestion: {
    question: "¿Cuál de estos datos no debe entrar al flujo del proyecto porque no cambia con la decisión?",
    options: [
      { id: "estudio", text: "El estudio de factibilidad ya pagado", correct: true, feedback: "Es un costo hundido." },
      { id: "tarifa", text: "La tarifa de entrada", correct: false, feedback: "Es un ingreso financiero del proyecto." },
      { id: "vida", text: "La vida útil de la obra", correct: false, feedback: "Determina el valor residual." },
      { id: "visitas", text: "Las visitas esperadas", correct: false, feedback: "Determinan ingresos y beneficios." },
      { id: "mant", text: "El mantenimiento anual (3 % de la inversión)", correct: false, feedback: "Cambia con la alternativa elegida: es un costo del proyecto." },
    ],
  },
  tradeoff: {
    question: "¿Qué trade-off existe entre A y B?",
    options: [
      { id: "a", text: "A atiende más visitantes con mayor inversión; B invierte menos y atiende menos", correct: true, feedback: "Más alcance a cambio de más recursos y más exposición a la demanda." },
      { id: "b", text: "A es mejor en todo", correct: false, feedback: "A cuesta más y depende más de la demanda." },
      { id: "c", text: "B no tiene costos de operación", correct: false, feedback: "B también paga guías y mantenimiento." },
      { id: "d", text: "Ambas son iguales porque protegen el mismo humedal", correct: false, feedback: "Difieren en alcance, costo y riesgo." },
      { id: "e", text: "B domina porque su VPN financiero es mayor", correct: false, feedback: "El trade-off compara alcance, costo y riesgo; ninguna alternativa domina en todo." },
    ],
  },
  impacts: [
    { id: "visitas", text: "Visitas recreativas al humedal", kind: "impactoPositivo" },
    { id: "aves", text: "Perturbación de aves por más visitantes", kind: "impactoNegativo" },
    { id: "sendero", text: "Sendero y centro construidos", kind: "producto" },
    { id: "guias", text: "Empleo de guías locales", kind: "efecto" },
    { id: "degradado", text: "Humedal degradado (situación actual)", kind: "problema" },
  ],
  valuation: {
    visits: 12000,
    valuePerVisit: 0.025,
    best: "viaje",
    valid: ["contingente", "eleccion", "transferencia"],
    /** The 5 methods offered (maximum per question): the best one, one valid and three plausible traps. */
    offered: ["viaje", "contingente", "mercado", "hedonicos", "tiempo"],
  },
  rpcRows: ["obra", "mo", "guias", "mant", "entradas"],
};
/** Flow case of an alternative. Only A is built by the student; B is given for comparison. */
export function examCase(id: "A" | "B"): FlowCase {
  const big = id === "A",
    obra = big ? 800 : 400,
    mo = big ? 200 : 80,
    guias = big ? 60 : 30,
    visits = big ? 12000 : 7000;
  return {
    id: "exam2:" + id,
    title: exam2.alternatives.find((a) => a.id === id)!.name,
    horizon: 5,
    constructionEnd: 0,
    financialRate: 0.12,
    socialRate: 0.09,
    rubros: [
      { id: "obra", label: "Construcción del sendero y centro", kind: "inversion", amount: obra, timing: { type: "construccion" }, given: "entregado", rpc: "obras", why: "Inversión inicial." },
      { id: "mo", label: "Mano de obra no calificada de la obra", kind: "inversion", amount: mo, timing: { type: "construccion" }, given: "entregado", rpc: "moNoCalificada", why: "Parte de la inversión." },
      { id: "guias", label: "Guías y vigilancia", kind: "operacion", amount: guias, timing: { type: "operacion" }, given: "entregado", rpc: "moCalificada", why: "Costo anual de operación." },
      { id: "mant", label: "Mantenimiento anual", kind: "mantenimiento", amount: (obra + mo) * 0.03, timing: { type: "operacion" }, given: "calcular", formula: `3 % de la inversión física (${obra} + ${mo})`, rpc: "obras", why: "Conserva el sendero." },
      { id: "entradas", label: "Ingresos por entradas", kind: "ingreso", amount: (visits * 12500) / 1e6, timing: { type: "operacion" }, given: "calcular", formula: `${visits.toLocaleString("es-CO")} visitas × 12.500 COP`, rpc: "transferencia", why: "En el flujo económico la entrada es una transferencia: el beneficio está en el excedente valorado." },
      { id: "residual", label: "Valor residual de la obra", kind: "residual", amount: (obra * 15) / 20, timing: { type: "final" }, given: "calcular", formula: `${obra} × (20 − 5) / 20`, rpc: "obras", why: "La obra dura 20 años y se evalúa en 5." },
      { id: "estudio", label: "Estudio de factibilidad ya pagado", kind: "excluir", amount: 50, timing: { type: "ninguno" }, given: "entregado", rpc: "transferencia", why: "es un costo hundido." },
      { id: "fondo", label: "Aporte del fondo ambiental", kind: "excluir", amount: 300, timing: { type: "ninguno" }, given: "entregado", rpc: "transferencia", why: "es financiación, no un flujo del proyecto." },
    ],
    benefits: [
      { id: "recreativo", label: "Valor recreativo (costo de viaje)", annual: visits * 0.025, source: "viaje" },
      { id: "aves", label: "Perturbación de aves (gastos de restauración)", annual: big ? -20 : -10, source: "gastos" },
      { id: "predios", label: "Mayor valor de predios vecinos", annual: big ? 80 : 40, overlap: "recreativo", source: "hedonicos" },
    ],
  };
}

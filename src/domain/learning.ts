import type { GameState } from "./types";
import { scenarioById } from "../data/scenarios";
import { npv, random } from "./finance";

export interface LearningAttempt {
  id: string;
  choice: string;
  confidence: "seguro" | "duda";
  correct: boolean;
  phase: number;
}
export interface LearningChallenge {
  id: string;
  phase: number;
  transfer: boolean;
  topic: string;
  question: string;
  options: { id: string; text: string; feedback: string }[];
  answer: string;
  application: string;
}
const options = (good: string, bad: string, other: string, why: string) => [
  { id: "reasoned", text: good, feedback: why },
  {
    id: "shortcut",
    text: bad,
    feedback: "Revisa el criterio antes de concluir. " + why,
  },
  {
    id: "confusion",
    text: other,
    feedback:
      "Con esta decisión faltaría evidencia para sostener la conclusión. " +
      why,
  },
];
// Fixed micro-cases are independent of hidden scenario truth and player forecasts.
export function learningChallenges(g: GameState): LearningChallenge[] {
  const s = scenarioById(g.scenarioId),
    u = Math.max(10, Math.round(s.budget / 1000)),
    annual = Math.round(u * 60) / 100,
    net = npv([-u, annual, annual], 0.1);
  const cases: [string, string, string, string, string, string, string][] = [
    [
      "Problema y evidencia",
      `En ${s.title}, el Consejo pide comprar equipos antes de estudiar la necesidad. ¿Cuál es tu primer paso?`,
      "Describir la situación negativa, la población afectada y su magnitud",
      "Convertir la compra en el problema central",
      "Usar el presupuesto disponible como medida de la necesidad",
      "La necesidad se sustenta con evidencia; la compra es una posible intervención.",
      "Revisa si el árbol describe una situación o una solución ausente.",
    ],
    [
      "Objetivos y alternativas",
      "Dos propuestas entregan obras distintas para atender la misma necesidad. ¿Cómo las comparas?",
      "Con el mismo objetivo, población, horizonte y restricciones",
      "Escogiendo la obra más grande",
      "Sumando sus coberturas aunque atiendan a las mismas personas",
      "Una comparación útil exige condiciones comunes y evita duplicar beneficiarios.",
      "Comprueba cobertura y restricciones en el comparador de alternativas.",
    ],
    [
      "Cadena de valor",
      "El equipo contrató personal y ejecutó el presupuesto. ¿Qué falta demostrar?",
      "Qué bien o servicio entregó y qué cambio produjo en la población",
      "Que gastar todo equivale a lograr el objetivo",
      "Que contratar personal ya es el impacto final",
      "Recursos, actividades, productos y resultados requieren evidencias distintas.",
      "Vincula las actividades al producto y define cómo verificarás el resultado.",
    ],
    [
      "Valor del dinero en el tiempo",
      `Microcaso en M COP: inviertes ${u} hoy y recibes ${annual} netos al final de cada uno de los próximos dos años. Tasa real educativa: 10 %. ¿Qué VPN corresponde?`,
      `${net.toFixed(2)} M COP`,
      `${(u * 0.2).toFixed(2)} M COP`,
      `${(u * 1.2).toFixed(2)} M COP`,
      `VPN = −${u} + ${annual}/1,10 + ${annual}/1,10² = ${net.toFixed(2)} M COP. Sumar sin descontar ignora el momento de los flujos.`,
      "En Evaluación, distingue el flujo neto anual de su valor presente.",
    ],
    [
      "Metodología y marco normativo",
      "Una propuesta está diligenciada en MGA Web. ¿Qué puedes concluir solo con ese hecho?",
      "Que registró información; todavía debe sustentar sus análisis y requisitos aplicables",
      "Que ya tiene recursos asignados",
      "Que una tarifa regulada sustituye la evaluación del proyecto",
      "La herramienta registra el proyecto; diligenciar no demuestra por sí solo viabilidad ni financiación.",
      "Distingue MGA, requisitos jurídicos del proyecto y regulación económica del servicio.",
    ],
    [
      "Evaluación social y financiera",
      "El VPN financiero es negativo y el social positivo. ¿Qué decisión está mejor sustentada?",
      "Examinar sostenibilidad financiera, beneficios sociales y alternativas factibles antes de decidir",
      "Aprobar automáticamente porque hay beneficio social",
      "Rechazar cualquier proyecto público que no produzca utilidad",
      "El bienestar no paga las obligaciones de caja. Los dos análisis responden preguntas diferentes.",
      "Explica cómo financiarás operación y mantenimiento además de la inversión.",
    ],
    [
      "Seguimiento y causalidad",
      "La cobertura cayó durante la ejecución y hubo una interrupción externa. ¿Cómo investigas?",
      "Contrastar indicadores, decisiones y supuesto externo con la evidencia del diario",
      "Atribuir todo a mala formulación sin revisar datos",
      "Cambiar la meta original para que parezca cumplida",
      "Una desviación necesita explicación. Separar decisiones y condiciones externas evita atribuciones injustificadas.",
      "Compara lo planeado y lo observado antes de elegir una respuesta al evento.",
    ],
    [
      "Costo de oportunidad",
      "Dos alternativas factibles bajo iguales condiciones generan valores sociales de 120 y 100 M COP. Elegiste la segunda. ¿Cuál es la diferencia de valor sacrificada?",
      "20 M COP",
      "100 M COP",
      "220 M COP",
      "La diferencia es 120 − 100 = 20 M COP. Es distinta del gasto realizado y no se suma automáticamente a recursos desperdiciados.",
      "En el informe, compara solo las alternativas factibles bajo restricciones equivalentes.",
    ],
  ];
  const transfers: [string, string, string, string, string][] = [
    [
      "El registro identifica 900 personas afectadas y 500 cupos de servicio. ¿Cómo obtienes el déficit?",
      "Primero compruebo demanda, oferta y unidades comparables",
      "Resto personas y cupos sin definir el servicio",
      "Sumo 900 y 500 como población objetivo",
      "La población y el servicio pueden usar unidades distintas; necesitas una relación explícita antes de calcular el déficit.",
    ],
    [
      "El objetivo dice “construir una sede”. ¿Cómo lo revisas?",
      "Defino el cambio buscado en el acceso o calidad del servicio",
      "Le añado un costo mayor",
      "Lo doy por logrado al contratar el diseño",
      "El objetivo expresa el cambio; una sede puede ser un medio para alcanzarlo.",
    ],
    [
      "Una obra llegó al 100 % físico, pero el servicio atiende a la mitad de lo previsto. ¿Qué evidencia falta?",
      "Medir el acceso efectivo y comprobar causas operativas",
      "Declarar el resultado al 100 %",
      "Usar desembolsos como indicador de bienestar",
      "La terminación física y el resultado en la población no son intercambiables.",
    ],
    [
      "Un beneficio positivo se retrasa un año, sin cambiar su monto. Con tasa positiva, ¿qué ocurre con su valor presente?",
      "Disminuye",
      "Aumenta",
      "No cambia",
      "Un flujo más lejano se divide por un factor de descuento mayor. Usa el experimento de Evaluación para comprobarlo.",
    ],
    [
      "El proyecto se alinea con un plan de desarrollo. ¿Eso elimina la necesidad de revisar permisos y competencias?",
      "No: la alineación y los requisitos jurídicos son comprobaciones distintas",
      "Sí: la alineación reemplaza permisos",
      "Sí, si el proyecto tiene VPN positivo",
      "La coherencia con un plan no resuelve por sí misma los requisitos de la intervención. Consulta los instrumentos oficiales aplicables.",
    ],
    [
      "Un subsidio interno de 40 M COP financia un servicio cuyo beneficio social ya fue valorado. ¿Lo sumas otra vez como beneficio social?",
      "No; separo la transferencia de los beneficios y costos reales",
      "Sí, porque entró dinero a la caja",
      "Lo sumo dos veces por beneficiar a dos actores",
      "Una transferencia interna redistribuye recursos; sumarla al beneficio ya contado duplicaría valor.",
    ],
    [
      "Aumenta el costo operativo previsto. ¿Qué revisas antes de reducir mantenimiento?",
      "El flujo de operación y el efecto del mantenimiento sobre continuidad y riesgos",
      "Solo la caja de este mes",
      "La línea base, para ocultar el aumento",
      "Ahorrar hoy puede reducir fiabilidad y aumentar costos futuros. Revisa consecuencias sobre el servicio.",
    ],
    [
      "Elegiste un valor social de 90 M COP. Otra opción factible aporta 110; una de 160 excede el presupuesto y no tiene financiación viable. ¿Qué diferencia sacrificaste entre las opciones factibles?",
      "20 M COP: comparo 110 con 90",
      "70 M COP: comparo 160 con 90",
      "90 M COP: uso el valor de la elegida",
      "La alternativa de 160 no cumple las restricciones. Entre las factibles, la diferencia es 110 − 90 = 20 M COP. El mayor valor teórico no siempre está disponible.",
    ],
  ];
  return cases.flatMap(
    ([topic, question, good, bad, other, why, application], phase) => {
      const t = transfers[phase];
      return [false, true].map((transfer) => {
        const id = `aprendizaje-v1-${phase}-${transfer ? "transferencia" : "caso"}`;
        const opts = transfer
          ? options(t[1], t[2], t[3], t[4])
          : options(good, bad, other, why);
        return {
          id,
          phase,
          transfer,
          topic,
          question: transfer ? t[0] : question,
          answer: "reasoned",
          application,
          options: opts.sort(
            (a, b) => random(g.seed, id + a.id) - random(g.seed, id + b.id),
          ),
        };
      });
    },
  );
}
export function recordLearning(
  g: GameState,
  id: string,
  choice: string,
  confidence: LearningAttempt["confidence"],
): GameState {
  const c = learningChallenges(g).find((c) => c.id === id);
  if (!c || c.phase > g.phase)
    throw new Error("Este reto corresponde a una etapa posterior.");
  if (
    !c.options.some((o) => o.id === choice) ||
    !["seguro", "duda"].includes(confidence)
  )
    throw new Error("Selecciona una respuesta y tu nivel de seguridad.");
  if (g.learning?.some((a) => a.id === id))
    throw new Error(
      "Tu primera respuesta ya está guardada. Revisa la explicación y prueba el caso de transferencia.",
    );
  if (
    c.transfer &&
    !g.learning?.some((a) => a.id === `aprendizaje-v1-${c.phase}-caso`)
  )
    throw new Error("Resuelve primero el caso inicial.");
  return {
    ...g,
    learning: [
      ...(g.learning ?? []),
      { id, choice, confidence, correct: choice === c.answer, phase: c.phase },
    ],
  };
}
export function learningSummary(g: GameState) {
  const all = learningChallenges(g),
    attempts = all.flatMap((c) => {
      const a = g.learning?.find((a) => a.id === c.id);
      return a
        ? [
            {
              ...a,
              correct: a.choice === c.answer,
              transfer: c.transfer,
              topic: c.topic,
            },
          ]
        : [];
    });
  const score = (transfer: boolean) => {
    const subset = attempts.filter((a) => a.transfer === transfer);
    return {
      answered: subset.length,
      correct: subset.filter((a) => a.correct).length,
    };
  };
  return {
    attempts,
    initial: score(false),
    transfer: score(true),
    total: all.length,
    review: attempts.filter((a) => !a.correct),
    overconfident: attempts.filter(
      (a) => !a.correct && a.confidence === "seguro",
    ).length,
  };
}
export function discountExperiment(
  capital: number,
  annual: number,
  rate: number,
  delay: number,
) {
  const flows = [-capital, ...Array(delay).fill(0), annual, annual];
  return {
    flows,
    value: npv(flows, rate),
    terms: flows.map((flow, year) => ({
      year,
      flow,
      present: flow / (1 + rate) ** year,
    })),
  };
}

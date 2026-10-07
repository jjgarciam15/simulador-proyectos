import type { GameState } from "./types";
import { learningChallenges } from "./learning";
import { random } from "./finance";
import { difficultyRules, retryFactors } from "../data/balance";
import {appliedCases} from './appliedCases';
import { generatedQuestions } from './project/activityRegistry';
import { territoryActive } from './territory';
export interface QuestionV2 {
  id: string;
  phase: number;
  context: string;
  concept: string;
  difficulty: string;
  question: string;
  options: { id: string; text: string; feedback?:string }[];
  answers: string[];
  explanation: string;
  hints: string[];
  points: number;
  penalty: number;
  tags: string[];
}
function questionDraft(g: GameState): QuestionV2[] {
  return learningChallenges(g).map((c) => ({
    id: "v2-" + c.id,
    phase: c.phase,
    context: scenarioName(g),
    concept: c.topic,
    difficulty: g.difficulty,
    question: c.question,
    options: [
      // Five options (the maximum): the reasoned answer, two errors and two case-specific traps.
      ...c.options.map(({ id, text }) => ({ id, text })),
    ].sort((a, b) => random(g.seed, c.id + a.id) - random(g.seed, c.id + b.id)),
    answers: [c.answer],
    explanation: c.options.find((o) => o.id === c.answer)!.feedback,
    hints: [
      `Distingue qué mide cada opción: ${c.topic.toLowerCase()}.`,
      c.application,
      `Revisa estas dos ideas: ${c.options.find((o) => o.id === c.answer)!.text}. Contrástala con la evidencia del caso.`,
    ],
    points: 100,
    penalty: difficultyRules[g.difficulty].hintPenalty,
    tags: [c.topic, c.transfer ? "transferencia" : "inicial"],
  }));
}
function scenarioName(g: GameState) {
  return `Expediente ${g.scenarioId} · fase ${g.phase + 1}`;
}
export function questionsV2(g: GameState):QuestionV2[] {
  return questionDraft(g).map((q) =>
    q.phase === 2 && q.tags.includes("transferencia")
      ? {
          ...q,
          question:
            "Una obra terminó, pero su servicio atiende a la mitad de lo previsto. Selecciona las dos comprobaciones que permiten evaluar el resultado.",
          options: [
            {
              id: "access",
              text: "Medir personas con acceso efectivo frente a la meta y fuente previstas",
            },
            {
              id: "operation",
              text: "Contrastar continuidad del servicio y condiciones operativas",
            },
            {
              id: "spending",
              text: "Usar el gasto total como indicador suficiente de cobertura",
            },
            {
              id: "goal",
              text: "Reducir retroactivamente la meta a la cobertura observada",
            },
            {
              id: "asset",
              text: "Dar por probado el resultado al recibir el activo físico",
            },
          ].sort(
            (a, b) => random(g.seed, q.id + a.id) - random(g.seed, q.id + b.id),
          ),
          answers: ["access", "operation"],
          explanation:
            "La entrega física necesita traducirse en acceso y continuidad. Contrasta fuentes y condiciones operativas; ejecutar presupuesto no prueba cobertura.",
          hints: [
            "Separa entrega física y servicio efectivo.",
            "Contrasta metas con datos y revisa qué impide operar.",
            "Busca evidencia de acceso y de continuidad, sin modificar retrospectivamente la meta.",
          ],
        }
      : q,
  ).concat(appliedCases(g), generatedQuestions(g.scenarioId), territoryActive(g) ? ley388Questions(g) : []);
}
/** Practice on the Ley 388 de 1997 (Regulation stage; games from 3.0 on). */
function ley388Questions(g: GameState): QuestionV2[] {
  const base = { phase: 4, context: scenarioName(g), difficulty: g.difficulty, points: 100, penalty: difficultyRules[g.difficulty].hintPenalty };
  const mix = (id: string, list: { id: string; text: string }[]) => [...list].sort((a, b) => random(g.seed, id + a.id) - random(g.seed, id + b.id));
  return [
    {
      ...base,
      id: "ley388-principio",
      concept: "Ordenamiento territorial",
      question: "¿Qué principio de la Ley 388 de 1997 justifica que el municipio participe en la plusvalía que generan sus decisiones?",
      options: mix("ley388-principio", [
        { id: "reparto", text: "La distribución equitativa de las cargas y los beneficios" },
        { id: "libre", text: "La libre disposición del propietario sobre todo el mayor valor" },
        { id: "eficiencia", text: "La eficiencia del gasto: recaudar para cubrir el funcionamiento" },
        { id: "autonomia", text: "La autonomía del contratista para fijar el precio del suelo" },
        { id: "neutral", text: "La neutralidad fiscal: las decisiones urbanísticas no generan valor" },
      ]),
      answers: ["reparto"],
      explanation: "Art. 2: los principios son la función social y ecológica de la propiedad, la prevalencia del interés general y la distribución equitativa de cargas y beneficios. La plusvalía devuelve a la comunidad parte del valor que crean sus decisiones (arts. 73 y 85).",
      hints: ["Busca entre los tres principios del art. 2.", "Piensa en quién crea el mayor valor: la decisión pública, no el propietario.", "Los recursos tienen destinación específica (art. 85), no de funcionamiento."],
      tags: ["Ley 388", "plusvalía"],
    },
    {
      ...base,
      id: "ley388-expansion",
      concept: "Ordenamiento territorial",
      question: "Un terreno del borde fue incorporado al suelo de expansión urbana y todavía no tiene redes. ¿Qué se necesita antes de urbanizarlo?",
      options: mix("ley388-expansion", [
        { id: "parcial", text: "Un plan parcial que lo desarrolle (art. 19)" },
        { id: "licencia", text: "Solo la licencia de construcción del edificio" },
        { id: "rural", text: "Nada: sigue siendo suelo rural y se puede construir" },
        { id: "decreto", text: "Un decreto del alcalde que lo declare urbano sin más trámite" },
        { id: "valorizacion", text: "Cobrar primero la contribución de valorización" },
      ]),
      answers: ["parcial"],
      explanation: "Arts. 19 y 32: el suelo de expansión se habilita para uso urbano mediante planes parciales, que definen redes, cesiones y reparto de cargas y beneficios.",
      hints: ["El suelo de expansión aún no es urbano.", "Revisa qué instrumento desarrolla el plan en esas áreas.", "Art. 19."],
      tags: ["Ley 388", "clases de suelo"],
    },
  ];
}
export type QuestionAction =
  | { type: "answerV2"; id: string; choices: string[] }
  | { type: "hintV2"; id: string };
export function assessQuestion(original: GameState, a: QuestionAction) {
  const g = structuredClone(original),
    v = g.v2;
  if (!v) throw new Error("Requiere partida V2.");
  const q = questionsV2(g).find((q) => q.id === a.id);
  if (!q || q.phase > g.maxPhase) throw new Error("Pregunta no disponible.");
  const prior = v.assessments[q.id] ?? {
    choices: [],
    hints: 0,
    score: 0,
    solved: false,
  };
  if (prior.solved || prior.choices.length >= 3)
    throw new Error("Ejercicio cerrado; revisa la explicación.");
  if (a.type === "hintV2") {
    if (prior.hints >= helpPolicy(original).maxHints) throw new Error(helpPolicy(original).exam ? "En modo evaluación solo hay una pista por ejercicio." : "Ya consultaste todas las pistas.");
    v.assessments[q.id] = { ...prior, hints: prior.hints + 1 };
    return g;
  }
  if (
    !a.choices.length ||
    new Set(a.choices).size !== a.choices.length ||
    a.choices.some((id) => !q.options.some((o) => o.id === id))
  )
    throw new Error("Selecciona opciones válidas.");
  const solved =
    a.choices.length === q.answers.length &&
    q.answers.every((id) => a.choices.includes(id));
  const accuracy = Math.max(
    0,
    (a.choices.filter((id) => q.answers.includes(id)).length -
      a.choices.filter((id) => !q.answers.includes(id)).length) /
      q.answers.length,
  );
  v.assessments[q.id] = {
    ...prior,
    choices: [...prior.choices, a.choices],
    solved,
    score: Math.max(
      prior.score,
      Math.max(
        0,
        accuracy * 100 * retryFactors[prior.choices.length] -
          prior.hints * q.penalty,
      ),
    ),
  };
  return g;
}
export function learningPenalty(g: GameState) {
  const attempts = Object.values(g.v2?.assessments ?? {});
  return Math.min(
    8,
    attempts.reduce(
      (n, a) =>
        n +
        a.hints * difficultyRules[g.difficulty].hintPenalty * 0.1 +
        Math.max(0, a.choices.length - 1) * 0.2,
      0,
    ),
  );
}

export function practiceFeedback(g: GameState, id: string) {
  const q = questionsV2(g).find((q) => q.id === id),
    attempt = g.v2?.assessments[id];
  if (!q || !attempt?.choices.length) return "";
  if (attempt.solved || attempt.choices.length >= 3) return q.explanation;
  const last = attempt.choices.at(-1)!;
  const specific=q.options.find(o=>o.id===last[0])?.feedback;
  if(specific)return specific;
  if (q.answers.length > 1)
    return last.every((id) => q.answers.includes(id))
      ? "Tu selección aporta evidencia pertinente, pero no cubre todas las comprobaciones necesarias. Distingue la entrega del activo y el servicio que recibe la población."
      : "Hay opciones que confunden gasto, entrega física o cambio de metas con resultados. Mantén la meta original y contrástala con evidencia de servicio.";
  const base = learningChallenges(g).find((c) => "v2-" + c.id === id);
  const feedback = base?.options.find((o) => o.id === last[0])?.feedback;
  return (
    feedback ??
    [
      "La población de referencia, la afectada y la demanda tienen unidades y funciones diferentes. Revisa quién padece el problema y qué servicio le falta.",
      "La cobertura debe contrastarse con costos de operación, capacidad y restricciones durante toda la vida del proyecto.",
      "Pagar o contratar es gestión; entregar un producto y observar un cambio en la población requieren evidencias distintas.",
      "Cada flujo debe ubicarse en su año y descontarse. El ingreso bruto omite recursos que también tienen costo de oportunidad.",
      "La alineación estratégica no demuestra factibilidad ni explica por sí misma los incentivos de una regulación.",
      "La financiación aporta liquidez y obligaciones; no constituye por sí sola beneficio económico del proyecto.",
      "Las metas y fuentes definidas antes de ejecutar permiten interpretar las desviaciones; cambiarlas para coincidir con el resultado oculta el aprendizaje.",
      "El costo de oportunidad exige alternativas factibles y condiciones comparables; no se suma dos veces el mismo costo.",
    ][q.phase]
  );
}

export function practiceAnalytics(g: GameState) {
  const rows = Object.values(g.v2?.assessments ?? {});
  return {
    cases: rows.filter((r) => r.choices.length).length,
    solved: rows.filter((r) => r.solved).length,
    attempts: rows.reduce((n, r) => n + r.choices.length, 0),
    hints: rows.reduce((n, r) => n + r.hints, 0),
    retries: rows.reduce((n, r) => n + Math.max(0, r.choices.length - 1), 0),
  };
}

import { helpPolicy } from "./help";

import type { GameState } from "./types";
import { scenarioById } from "../data/scenarios";
import { dependencyRules, difficultyRules } from "../data/balance";
import { directSDGs } from "../data/relationships";
import { random } from "./finance";
export const chainLevels = [
  "Insumos",
  "Actividades",
  "Productos",
  "Resultados",
  "Impactos",
] as const;
export type ChainLevel = (typeof chainLevels)[number];
export interface ChainPlacement {
  id: string;
  level: ChainLevel;
}
export interface V2State {
  negotiationRules?:2;
  budgetLines?:import('./budgetLines').BudgetLine[];
  challenge?:import('./challenges').Challenge;
  negotiations?:Record<string,import('./negotiations').NegotiationRecord>;
  /** Dilemmas drawn in this game (seeded), with the choice once resolved. */
  dilemmas?: import('./dilemmas').DilemmaRecord[];
  pendingDilemma?: string;
  /** Consequences that materialise when the investment is committed. */
  delayed?: import('./dilemmas').DelayedEffect[];
  /** Additive change in execution event exposure (systemic consequence). */
  eventRisk?: number;
  /** Money received from dilemma choices (co-financing, supplier credit). */
  inflows?: number;
  /** Project log of immediate, delayed and systemic consequences. */
  consequences?: import('./regulationLab').Consequence[];
  /** V2.2 academic modules (objectives, effects, valuation, flows, committee). Absent in older games. */
  v22?: V22State;
  version: 2;
  completed: number[];
  reviews: Record<number, string[]>;
  initialCash: number;
  resetCount?: number;
  chain: ChainPlacement[];
  connections: { from: string; to: string }[];
  sdgReasons: Record<
    number,
    { kind: "directa" | "indirecta"; evidence: string; text: string }
  >;
  regulatory: {
    evidence: string;
    incentive: string;
    adverse: string;
    reason: string;
    /** Regulatory causal puzzle: card id per slot (optional for older games). */
    chain?: Record<string, string>;
  };
  actorMap: Record<
    string,
    { power: "alto" | "bajo"; interest: "alto" | "bajo" }
  >;
  assessments: Record<
    string,
    { choices: string[][]; hints: number; score: number; solved: boolean }
  >;
  planner: number;
  /** Árbol del problema built by the player: card id → level (or "fuera"). */
  tree?: { placements: Record<string, import("./problemTree").TreeSlot> };
  /** Local analytics: seconds spent in each stage (not scored). */
  stageSeconds?: Record<number, number>;
  changes: { phase: number; action: string; month: number }[];
}
export interface V22State {
  version: 1;
  mode: "aprendizaje" | "evaluacion";
  /** Modo exploración (V2.4): immediate feedback and free changes; the score is marked as not comparable. */
  exploration?: boolean;
  objectives?: { general: string; specific: string[] };
  impacts?: { placements: import("./valuation").ImpactPlacement[]; builtFor: string };
  valuation?: {
    choices: import("./valuation").ValuationChoice[];
    paid: Record<string, import("./valuation").Study>;
    builtFor: string;
  };
  flow?: { rows: import("./flows").RowInput[]; builtFor: string };
  economic?: { rows: import("./flows").EconomicRowInput[]; benefits: string[]; builtFor: string };
  committee?: { answers: Record<string, string> };
  /** Anti-farming: confirmations per module (score uses the confirmed state, not repetitions). */
  attempts?: Record<string, number>;
}
export function newV2State(g: GameState): V2State {
  return {
    negotiationRules:2,
    version: 2,
    completed: [],
    reviews: {},
    initialCash:
      scenarioById(g.scenarioId).budget * difficultyRules[g.difficulty].cash,
    chain: [],
    connections: [],
    sdgReasons: {},
    regulatory: { evidence: "", incentive: "", adverse: "", reason: "" },
    actorMap: {},
    assessments: {},
    planner: 0,
    changes: [],
  };
}
export function invalidateV2(g: GameState, action: string) {
  if (!g.v2) return;
  for (const phase of dependencyRules[action] ?? [])
    if (g.v2.completed.includes(phase) || phase < g.maxPhase) {
      g.v2.reviews[phase] = [
        ...new Set([
          ...(g.v2.reviews[phase] ?? []),
          specificReason[action]?.[phase] ??
            `Cambió ${actionLabels[action] ?? action} en el mes ${g.month}. Comprueba que esta etapa sigue siendo coherente.`,
        ]),
      ];
    }
  g.v2.changes.push({ phase: g.phase, action, month: g.month });
}
/** Reasons shown when a change affects a stage in a specific way. */
const specificReason: Record<string, Record<number, string>> = {
  alternative: {
    2: "La cadena de valor, el presupuesto y los efectos e impactos se construyeron con otra alternativa. Se conservan: revisa si siguen siendo coherentes.",
    3: "La valoración y los flujos financiero y económico usan datos de otra alternativa. Se conservan tus entradas: recalcula y corrige los rubros.",
  },
  impacts: { 3: "Cambió la clasificación de efectos e impactos: revisa qué impactos valoras y qué beneficios entran al flujo económico." },
  valuation: { 5: "Cambió la valoración de impactos: los beneficios del flujo económico y la comparación de alternativas cambiaron." },
  objectives: { 2: "Cambiaron los objetivos: revisa que la cadena de valor y los productos respondan a ellos." },
};
const actionLabels: Record<string, string> = {
  objectives: "los objetivos",
  impacts: "la clasificación de efectos e impactos",
  valuation: "la valoración económica",
  flow: "el flujo financiero",
  economic: "el flujo económico",
  committee: "la defensa ante el comité",
  alternative: "la alternativa",
  target: "la población objetivo",
  nodes: "el Árbol del problema",
  budget: "el presupuesto",
  activities: "el cronograma",
  assumptions: "los supuestos económicos",
  policy: "la política regulatoria",
  chain: "la cadena de valor",
  objective: "el objetivo",
  indicators: "los indicadores",
  study: "la información disponible",
  actor: "la estrategia de actores",
  alignment: "la alineación ODS",
  mitigate: "la mitigación",
  regulatory: "el argumento regulatorio",
};
export function stageStatus(g: GameState, phase: number) {
  if (phase === 5 && g.snapshot) return "completada";
  if (g.outcome && phase === 7) return "completada";
  if (g.outcome && phase === 6)
    return ["abandonado", "insolvencia"].includes(g.outcome.status)
      ? "cerrada sin completar"
      : "completada";
  return phase > g.maxPhase
    ? "bloqueada"
    : g.v2?.reviews[phase]?.length
      ? "requiere revisión"
      : phase === g.phase
        ? "en progreso"
        : g.v2?.completed.includes(phase)
          ? "completada"
          : "pendiente";
}
export interface ChainCard {
  id: string;
  label: string;
  /** Level where the card belongs conceptually. */
  level: ChainLevel;
  valid: boolean;
  /** Related but weaker: earns half credit (e.g. a management milestone presented as a product). */
  partial?: boolean;
  /** Explanation shown after confirming, depending on difficulty. */
  why: string;
}
/**
 * Card bank built from the mission and the selected alternative. Legacy ids (capital, knowledge, design,
 * build, service, access, welfare, publicity, spending, promise, grant, building) are preserved so older
 * saved chains remain valid. The order is shuffled by seed so the list does not reveal the levels.
 */
export function chainBank(g: GameState): ChainCard[] {
  const s = scenarioById(g.scenarioId),
    a = s.alternatives.find((a) => a.id === g.alternative),
    obj = (i: number) => s.nodes.find((n) => n.id === "n" + i)?.objective ?? "",
    decoy = s.nodes.find((n) => n.id === "d1")?.objective ?? "Construir una obra emblemática";
  const cards: ChainCard[] = [
    { id: "capital", label: a ? `Recursos de inversión y equipo técnico para ${a.name.toLowerCase()}` : "Capital y equipo técnico", level: "Insumos", valid: true, why: "Recursos que se consumen para ejecutar actividades." },
    { id: "knowledge", label: "Estudios y conocimiento territorial", level: "Insumos", valid: true, why: "La información es un insumo: permite diseñar y focalizar." },
    { id: "goal-input", label: "Meta de cobertura del 100 % de la población", level: "Insumos", valid: false, why: "Una meta describe un resultado esperado, no un recurso que se consume." },
    { id: "design", label: "Diseñar y obtener permisos", level: "Actividades", valid: true, why: "Acción del equipo que transforma insumos." },
    { id: "build", label: a ? `Implementar: ${a.description.toLowerCase()}` : "Implementar y poner en servicio", level: "Actividades", valid: true, why: "Actividad central que produce el bien o servicio." },
    { id: "cause-activity", label: `Ejecutar acciones para ${obj(2).toLowerCase()}`, level: "Actividades", valid: true, why: "Actúa sobre la causa indirecta identificada en el Árbol del problema." },
    { id: "campaign", label: "Campaña de comunicación sobre el proyecto", level: "Actividades", valid: false, partial: true, why: "Es una actividad real, pero no actúa sobre las causas del problema: aporta poco a la cadena." },
    { id: "service", label: a?.product ?? "Servicio por definir", level: "Productos", valid: true, why: "Bien o servicio entregado por el proyecto y verificable." },
    { id: "operators", label: "Operadores capacitados y protocolos de operación", level: "Productos", valid: true, why: "Producto que permite sostener el servicio." },
    { id: "contract", label: "Contrato de obra firmado", level: "Productos", valid: false, partial: true, why: "Es un hito de gestión: demuestra avance administrativo, no un producto entregado a la población." },
    { id: "promise", label: "Prometer cobertura sin operación", level: "Productos", valid: false, why: "Una promesa sin operación no es un producto verificable." },
    { id: "building", label: "Diseño contratado como servicio ya prestado", level: "Productos", valid: false, why: "Confunde una actividad en curso con el servicio entregado." },
    { id: "access", label: obj(0), level: "Resultados", valid: true, why: "Cambio en la población atendida: es el objetivo central." },
    { id: "direct-result", label: obj(1), level: "Resultados", valid: true, why: "Corrige la causa directa: cambio observable en las condiciones del servicio." },
    { id: "publicity", label: "Aumentar visibilidad del Consejo", level: "Resultados", valid: false, why: "Beneficia a la institución, no a la población objetivo." },
    { id: "executed", label: "Presupuesto ejecutado al 100 %", level: "Resultados", valid: false, why: "Ejecutar el presupuesto mide gestión, no un cambio en la población." },
    { id: "effect-impact", label: obj(3), level: "Impactos", valid: true, why: "Reduce un efecto del problema en el largo plazo." },
    { id: "welfare", label: obj(4), level: "Impactos", valid: true, why: "Cambio de largo plazo en bienestar al que contribuye el proyecto." },
    { id: "spending", label: "Gastar todo el presupuesto como bienestar", level: "Impactos", valid: false, why: "Gastar no equivale a generar bienestar." },
    { id: "grant", label: "Obtener crédito como impacto social", level: "Impactos", valid: false, why: "La financiación es una fuente de recursos, no un impacto." },
    { id: "emblem", label: decoy, level: "Impactos", valid: false, why: "Proviene de una causa mal planteada (falta de una obra), no del problema diagnosticado." },
  ];
  return cards.sort((x, y) => random(g.seed, "chain" + x.id) - random(g.seed, "chain" + y.id));
}
/** Per-card review after confirmation. */
export function chainReview(g: GameState) {
  const bank = chainBank(g);
  return (g.v2?.chain ?? []).map((p) => {
    const c = bank.find((c) => c.id === p.id);
    const status = !c
      ? "desconocida"
      : c.valid && c.level === p.level
        ? "correcta"
        : c.partial && c.level === p.level
          ? "parcial"
          : c.valid || c.partial
            ? "mal clasificada"
            : "distractor";
    return { id: p.id, label: c?.label ?? p.id, placed: p.level, expected: c?.level, status, why: c?.why ?? "" };
  });
}
export function chainV2Score(g: GameState) {
  const p = g.v2?.chain ?? [],
    links = g.v2?.connections ?? [],
    bank = chainBank(g);
  if (!p.length) return 0;
  const credit = (x: ChainPlacement) => {
    const c = bank.find((c) => c.id === x.id);
    if (!c || c.level !== x.level) return 0;
    return c.valid ? 1 : c.partial ? 0.5 : 0;
  };
  const valid = p.filter((x) => credit(x) === 1);
  const covered = new Set(valid.map((x) => x.level)).size / 5;
  const precision = p.reduce((n, x) => n + credit(x), 0) / p.length;
  const usable = new Set(p.filter((x) => credit(x) > 0).map((x) => x.id));
  const good = links.filter(
    (l) =>
      usable.has(l.from) &&
      usable.has(l.to) &&
      chainLevels.indexOf(p.find((x) => x.id === l.to)!.level) ===
        chainLevels.indexOf(p.find((x) => x.id === l.from)!.level) + 1,
  );
  const linkedLevels =
    new Set(good.map((l) => p.find((x) => x.id === l.from)!.level)).size / 4;
  return Math.round(
    100 *
      (0.4 * covered + 0.3 * precision + 0.3 * linkedLevels) *
      (links.length ? good.length / links.length : 0),
  );
}
export function actorMapScore(g: GameState) {
  const s = scenarioById(g.scenarioId);
  return (
    (100 *
      s.actors.reduce((n, a) => {
        const p = g.v2?.actorMap[a.id];
        return (
          n +
          Number(p?.power === (a.power >= 60 ? "alto" : "bajo")) +
          Number(p?.interest === (a.interest >= 60 ? "alto" : "bajo"))
        );
      }, 0)) /
    (s.actors.length * 2)
  );
}
export function sdgReasonScore(g: GameState) {
  if (!g.sdgs.length) return 0;
  const s = scenarioById(g.scenarioId);
  return Math.max(
    0,
    (100 *
      g.sdgs.reduce((n, id) => {
        const r = g.v2?.sdgReasons[id],
          direct = directSDGs[g.scenarioId]?.includes(id);
        const aligned =
          r?.kind === (direct ? "directa" : "indirecta") &&
          (direct
            ? ["producto", "resultado"].includes(r.evidence)
            : r.evidence === "impacto");
        return (
          n + (s.sdgs.includes(id) && r?.text.trim() ? (aligned ? 1 : 0.4) : -1)
        );
      }, 0)) /
      Math.max(s.sdgs.length, g.sdgs.length),
  );
}
/** Per-ODS review after the player justifies them: relevance, kind of relation, evidence, omissions and excess. */
export function sdgReview(g: GameState) {
  const s = scenarioById(g.scenarioId),
    direct = directSDGs[g.scenarioId] ?? [];
  const rows = g.sdgs.map((id) => {
    const r = g.v2?.sdgReasons[id],
      relevant = s.sdgs.includes(id),
      isDirect = direct.includes(id),
      kindOk = r?.kind === (isDirect ? "directa" : "indirecta"),
      evidenceOk = isDirect ? ["producto", "resultado"].includes(r?.evidence ?? "") : r?.evidence === "impacto";
    return {
      id,
      status: !relevant ? "sin relación" : kindOk && evidenceOk ? "bien sustentado" : "pertinente, mal sustentado",
      why: !relevant
        ? "El proyecto no produce cambios verificables en este objetivo: seleccionarlo resta puntos."
        : !kindOk
          ? `La relación es ${isDirect ? "directa: el servicio actúa sobre este objetivo" : "indirecta: llega a través de efectos del servicio"}.`
          : !evidenceOk
            ? isDirect
              ? "Una relación directa se demuestra con productos o resultados en la población."
              : "Una relación indirecta se demuestra con impactos o externalidades esperadas."
            : "Relación y evidencia coherentes.",
    };
  });
  const omitted = s.sdgs.filter((id) => !g.sdgs.includes(id));
  return { rows, omitted, excess: g.sdgs.filter((id) => !s.sdgs.includes(id)).length };
}

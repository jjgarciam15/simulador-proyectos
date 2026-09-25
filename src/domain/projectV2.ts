import type { GameState } from "./types";
import { scenarioById } from "../data/scenarios";
import { dependencyRules, difficultyRules } from "../data/balance";
import { directSDGs } from "../data/relationships";
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
  changes: { phase: number; action: string; month: number }[];
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
          `Cambió ${actionLabels[action] ?? action} en el mes ${g.month}. Comprueba que esta etapa sigue siendo coherente.`,
        ]),
      ];
    }
  g.v2.changes.push({ phase: g.phase, action, month: g.month });
}
const actionLabels: Record<string, string> = {
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
export function chainBank(g: GameState) {
  const s = scenarioById(g.scenarioId),
    a = s.alternatives.find((a) => a.id === g.alternative);
  return [
    {
      id: "capital",
      label: "Capital y equipo técnico",
      level: "Insumos",
      valid: true,
    },
    {
      id: "knowledge",
      label: "Estudios y conocimiento territorial",
      level: "Insumos",
      valid: true,
    },
    {
      id: "design",
      label: "Diseñar y obtener permisos",
      level: "Actividades",
      valid: true,
    },
    {
      id: "build",
      label: "Implementar y poner en servicio",
      level: "Actividades",
      valid: true,
    },
    {
      id: "service",
      label: a?.product ?? "Servicio por definir",
      level: "Productos",
      valid: true,
    },
    {
      id: "access",
      label: s.nodes[0].objective,
      level: "Resultados",
      valid: true,
    },
    {
      id: "welfare",
      label: s.nodes[4].objective,
      level: "Impactos",
      valid: true,
    },
    {
      id: "publicity",
      label: "Aumentar visibilidad del Consejo",
      level: "Resultados",
      valid: false,
    },
    {
      id: "spending",
      label: "Gastar todo el presupuesto como bienestar",
      level: "Impactos",
      valid: false,
    },
    {
      id: "promise",
      label: "Prometer cobertura sin operación",
      level: "Productos",
      valid: false,
    },
    {
      id: "grant",
      label: "Obtener crédito como impacto social",
      level: "Impactos",
      valid: false,
    },
    {
      id: "building",
      label: "Diseño contratado como servicio ya prestado",
      level: "Productos",
      valid: false,
    },
  ] as { id: string; label: string; level: ChainLevel; valid: boolean }[];
}
export function chainV2Score(g: GameState) {
  const p = g.v2?.chain ?? [],
    links = g.v2?.connections ?? [],
    bank = chainBank(g);
  if (!p.length) return 0;
  const valid = p.filter((p) => {
    const c = bank.find((c) => c.id === p.id);
    return c?.valid && c.level === p.level;
  });
  const covered = new Set(valid.map((p) => p.level)).size / 5;
  const precision = valid.length / p.length;
  const validIds = new Set(valid.map((p) => p.id));
  const good = links.filter(
    (l) =>
      validIds.has(l.from) &&
      validIds.has(l.to) &&
      chainLevels.indexOf(p.find((p) => p.id === l.to)!.level) ===
        chainLevels.indexOf(p.find((p) => p.id === l.from)!.level) + 1,
  );
  const linkedLevels =
    new Set(good.map((l) => p.find((p) => p.id === l.from)!.level)).size / 4;
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

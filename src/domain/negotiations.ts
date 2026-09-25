import type { Budget, GameState } from "./types";
import { scenarioById } from "../data/scenarios";
import { negotiationProfiles } from "../data/negotiationProfiles";
export interface NegotiationCondition {
  category: keyof Budget;
  name: string;
  minimum: number;
  evidence: string;
}
export type NegotiationChoice =
  "escuchar" | "acuerdo" | "compensar" | "retirarse";
export interface NegotiationRecord {
  condition?: NegotiationCondition;
  consulted: boolean;
  status: "abierto" | "acuerdo" | "cerrado";
  rounds: {
    choice: NegotiationChoice;
    detail: string;
    cost: number;
    months: number;
  }[];
}
export type NegotiationAction = {
  type: "negotiate";
  actorId: string;
  choice: NegotiationChoice;
};
export const negotiationChoices: Record<NegotiationChoice, string> = {
  escuchar: "Escuchar y contrastar",
  acuerdo: "Proponer un compromiso verificable",
  compensar: "Financiar acompañamiento inmediato",
  retirarse: "Cerrar sin acuerdo",
};
export function actorCommitment(g: GameState, actorId: string) {
  const s = scenarioById(g.scenarioId),
    index = s.actors.findIndex((a) => a.id === actorId);
  if (index < 0) throw new Error("Actor desconocido.");
  const saved = g.v2?.negotiations?.[actorId]?.condition;
  if (saved) return { ...saved, actor: s.actors[index] };
  const profile =
    g.v2?.negotiationRules === 2
      ? negotiationProfiles[s.id]?.[index]
      : undefined;
  if (profile)
    return {
      category: profile.category,
      name: profile.name,
      minimum: Math.round(s.budget * profile.fraction),
      evidence: profile.evidence,
      actor: s.actors[index],
    };
  const category: (keyof Budget)[] = [
    "social",
    "maintenance",
    "environment",
    "oversight",
  ];
  const names = [
    "gestión social y acceso",
    "mantenimiento anual",
    "gestión ambiental",
    "interventoría y transparencia",
  ];
  return {
    evidence:
      "Verificación de la asignación presupuestal acordada (reglas anteriores).",
    category: category[index % 4],
    name: names[index % 4],
    minimum: Math.round(s.budget * [0.012, 0.018, 0.015, 0.012][index % 4]),
    actor: s.actors[index],
  };
}
export function negotiationQuote(
  g: GameState,
  actorId: string,
  choice: NegotiationChoice,
) {
  if (!g.v2 || g.phase !== 0 || g.snapshot || g.outcome)
    throw new Error("Negocia en Diagnóstico antes de comprometer inversión.");
  if (!Object.hasOwn(negotiationChoices, choice))
    throw new Error("Oferta no válida.");
  const s = scenarioById(g.scenarioId),
    condition = actorCommitment(g, actorId),
    prior = g.v2.negotiations?.[actorId] ?? {
      consulted: false,
      status: "abierto" as const,
      rounds: [],
    };
  if (prior.status !== "abierto" || prior.rounds.length >= 3)
    throw new Error(
      "La mesa de este actor ya cerró. Los acuerdos y costos se conservan.",
    );
  const next = structuredClone(prior);
  next.condition = {
    category: condition.category,
    name: condition.name,
    minimum: condition.minimum,
    evidence: condition.evidence,
  };
  let cost = 0,
    months = 0,
    support = 0,
    reputation = 0,
    detail = "";
  if (choice === "escuchar") {
    cost = s.budget * 0.001;
    months = 1;
    next.consulted = true;
    detail = `La mesa identifica una condición verificable: ${condition.name}. Escuchar no garantiza aceptación.`;
  }
  if (choice === "acuerdo") {
    cost = s.budget * 0.004;
    months = 2;
    if (prior.consulted || g.studies.includes("social")) {
      next.status = "acuerdo";
      support = 3;
      reputation = 2;
      detail = `Acuerdo condicionado a reservar ${condition.minimum} M en ${condition.name}. Se revisará al invertir.`;
    } else {
      support = -2;
      detail =
        "La oferta se rechazó por falta de diagnóstico compartido. Escucha al actor o incorpora evidencia social antes de insistir.";
    }
  }
  if (choice === "compensar") {
    cost = s.budget * 0.018;
    support = Math.round(6 + condition.actor.interest / 20);
    reputation = 1;
    next.status = "cerrado";
    detail =
      "El acompañamiento obtiene apoyo inmediato sin una obligación presupuestal posterior. Consume más caja; no elimina desacuerdos futuros.";
  }
  if (choice === "retirarse") {
    support = -Math.round(condition.actor.power / 20);
    next.status = "cerrado";
    detail =
      "La mesa cierra sin compromiso. Conservas caja y tiempo, pero disminuye el apoyo según el poder del actor.";
  }
  next.rounds.push({ choice, detail, cost, months });
  if (next.rounds.length >= 3 && next.status === "abierto") {
    next.status = "cerrado";
    detail += " Se agotaron las tres rondas.";
    next.rounds.at(-1)!.detail = detail;
  }
  return { next, cost, months, support, reputation, detail, condition };
}
export function negotiationCommitments(g: GameState) {
  return Object.entries(g.v2?.negotiations ?? {})
    .filter(([, r]) => r.status === "acuerdo")
    .map(([id]) => {
      const c = actorCommitment(g, id);
      return {
        ...c,
        id,
        funded: g.budget[c.category] >= c.minimum,
        allocated: g.budget[c.category],
      };
    });
}

export function validNegotiationSave(g: GameState) {
  const records = g.v2?.negotiations;
  if (records === undefined) return true;
  if (!records || typeof records !== "object" || Array.isArray(records))
    return false;
  const actors = scenarioById(g.scenarioId).actors;
  return Object.entries(records).every(
    ([id, r]) =>
      actors.some((a) => a.id === id) &&
      r &&
      (r.condition === undefined ||
        (r.condition &&
          [
            "operation",
            "maintenance",
            "environment",
            "social",
            "oversight",
            "contingency",
          ].includes(r.condition.category) &&
          typeof r.condition.name === "string" &&
          typeof r.condition.evidence === "string" &&
          Number.isFinite(r.condition.minimum) &&
          r.condition.minimum >= 0)) &&
      typeof r.consulted === "boolean" &&
      ["abierto", "acuerdo", "cerrado"].includes(r.status) &&
      Array.isArray(r.rounds) &&
      r.rounds.length <= 3 &&
      r.rounds.every(
        (round) =>
          round &&
          Object.hasOwn(negotiationChoices, round.choice) &&
          typeof round.detail === "string" &&
          Number.isFinite(round.cost) &&
          round.cost >= 0 &&
          Number.isFinite(round.months) &&
          round.months >= 0,
      ),
  );
}

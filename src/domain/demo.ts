import type { Budget, GameState } from "./types";
import { act, budgetFor, createGameV2, defaultActivities, projectCost, available, type Action } from "./engine";
import { scenarioById } from "../data/scenarios";
import { directSDGs } from "../data/relationships";
import { chainBank, chainLevels } from "./projectV2";
import { pendingDilemma } from "./dilemmas";
import { referenceTree } from "./problemTree";
import { impactCards, referenceValuation, generalObjectiveOptions, specificObjectiveOptions } from "./valuation";
import { missionFlowCase } from "./missionFlow";
import { referenceRows, referenceEconomic, referenceBenefits } from "./flows";
import { referenceCommittee } from "./committee";
import { puzzleKey, puzzleSlots, recommendedPolicies } from "./regulationLab";
import { questionsV2 } from "./questionsV2";
import { negotiationCommitments } from "./negotiations";
import type { BudgetLine } from "./budgetLines";

/**
 * Modo presentación: a complete game played with the engine's own reference answers (the same `act`
 * used by players), so every stage, tool and the final results can be shown solved. Nothing is invented:
 * each answer comes from the reference functions the scoring already uses. It is deterministic by seed
 * and never stored in the player's games.
 */
export const presentationSeed = "PRESENTACION";

/** Tries an optional action; the demo continues if the engine rejects it (for example, not enough cash). */
function attempt(g: GameState, a: Action) {
  try {
    return act(g, a, false);
  } catch {
    return g;
  }
}
function settle(g: GameState) {
  for (let i = 0; i < 4; i++) {
    const t = pendingDilemma(g);
    if (!t) return g;
    g = act(g, { type: "dilemma", choice: t.choices[0].id }, false);
  }
  return g;
}
const next = (g: GameState) => settle(act(g, { type: "next" }, false));
/** Answers, at the first attempt, every practice question already open. */
function practice(g: GameState) {
  for (const q of questionsV2(g).filter((q) => q.phase <= g.maxPhase && !g.v2?.assessments[q.id]?.solved)) g = attempt(g, { type: "answerV2", id: q.id, choices: q.answers });
  return g;
}

/** Reference classification of effects and impacts (all correct). */
export function referenceImpacts(g: GameState) {
  return impactCards(g).map((c) => ({ id: c.id, kind: c.kind, ...(c.group ? { group: c.group } : {}) }));
}
/** Value chain with every valid card, each level linked to the next one. */
export function referenceChain(g: GameState) {
  const valid = chainBank(g).filter((c) => c.valid),
    cards = valid.map(({ id, level }) => ({ id, level })),
    connections = chainLevels.slice(0, -1).flatMap((level, i) => {
      const to = valid.find((c) => c.level === chainLevels[i + 1]);
      return valid.filter((c) => c.level === level && to).map((c) => ({ from: c.id, to: to!.id }));
    });
  return { cards, connections };
}
/** Power and interest of each actor as the scenario defines them (threshold 60). */
export function referenceActorMap(g: GameState) {
  return Object.fromEntries(
    scenarioById(g.scenarioId).actors.map((a) => [a.id, { power: a.power >= 60 ? ("alto" as const) : ("bajo" as const), interest: a.interest >= 60 ? ("alto" as const) : ("bajo" as const) }]),
  );
}

export function presentationGame(scenarioId = "agua"): GameState {
  const s = scenarioById(scenarioId);
  let g = createGameV2(scenarioId, "guiado", presentationSeed, "aprendizaje");

  // 1 · Diagnóstico: estudios, árbol, enlaces causales, actores, negociación y focalización.
  for (const st of s.studies) g = attempt(g, { type: "study", id: st.id });
  g = act(g, { type: "nodes", ids: ["n0", "n1", "n2", "n3", "n4"] }, false);
  g = act(g, { type: "tree", placements: referenceTree(g) }, false);
  g = act(g, { type: "mga", section: "links", value: { ...g.mga!, links: [{ from: "n2", to: "n1" }, { from: "n1", to: "n0" }, { from: "n0", to: "n3" }, { from: "n3", to: "n4" }] } }, false);
  g = act(g, { type: "actorMap", value: referenceActorMap(g) }, false);
  const key = s.actors.filter((a) => a.power >= 60 && a.interest >= 60);
  for (const a of key.length ? key : s.actors.slice(0, 2)) g = attempt(g, { type: "actor", id: a.id, choice: "consultar" });
  const negotiator = (key[0] ?? s.actors[0]).id;
  g = attempt(g, { type: "negotiate", actorId: negotiator, choice: "acuerdo" } as Action);
  g = act(g, { type: "target", value: s.affected }, false);
  g = practice(g);
  g = next(g);

  // 2 · Formulación: objetivos y la alternativa que atiende más causas con mejor relación de valor.
  g = act(g, { type: "objective", id: "n0" }, false);
  const best = [...s.alternatives].sort((a, b) => b.causes.length - a.causes.length || b.social / b.capex - a.social / a.capex)[0];
  g = act(g, { type: "alternative", id: best.id }, false);
  g = act(g, { type: "compare", ids: s.alternatives.slice(0, 3).map((a) => a.id) }, false);
  if (g.v2?.v22)
    g = act(g, { type: "objectives", general: generalObjectiveOptions(g).find((o) => o.valid)!.id, specific: specificObjectiveOptions(g).filter((o) => o.valid).map((o) => o.id) }, false);
  g = practice(g);
  g = next(g);

  // 3 · Preparación: cadena de valor, presupuesto con partidas detalladas, cronograma, indicadores e impactos.
  const chain = referenceChain(g);
  g = act(g, { type: "chain", ...chain }, false);
  const budget: Budget = { ...budgetFor(g, best) };
  for (const c of negotiationCommitments(g)) budget[c.category] = Math.max(budget[c.category], c.minimum);
  const lines: BudgetLine[] = [
    { id: "op-1", category: "operation", description: "Personal y operación del servicio", unit: "año", quantity: 1, unitCost: budget.operation },
    { id: "mt-1", category: "maintenance", description: "Mantenimiento preventivo", unit: "año", quantity: 1, unitCost: budget.maintenance },
  ];
  g = act(g, { type: "budget", value: budget, lines }, false);
  g = act(g, { type: "activities", value: defaultActivities(g) }, false);
  g = act(g, {
    type: "indicators",
    value: [
      { name: "Personas con acceso efectivo al servicio", kind: "Resultado", baseline: 0, target: Math.round(g.target * best.coverage), unit: "personas", measure: "coverage", frequency: "Trimestral", source: "Registro operativo", owner: "Equipo de seguimiento" },
      { name: "Avance físico de la obra", kind: "Producto", baseline: 0, target: 100, unit: "%", measure: "progress", frequency: "Mensual", source: "Informe de interventoría", owner: "Interventoría" },
    ],
  }, false);
  if (g.v2?.v22) g = act(g, { type: "impacts", placements: referenceImpacts(g) }, false);
  if (projectCost(g) > available(g)) g = attempt(g, { type: "finance", source: "credito" });
  g = practice(g);
  g = next(g);

  // 4 · Evaluación: valoración, flujo financiero, flujo económico con RPC y revisión ex ante.
  if (g.v2?.v22) {
    g = act(g, { type: "valuation", choices: referenceValuation(g) }, false);
    const c = missionFlowCase(g)!;
    g = act(g, { type: "flow", rows: referenceRows(c) }, false);
    const c2 = missionFlowCase(g)!;
    g = act(g, { type: "economic", rows: referenceEconomic(c2), benefits: referenceBenefits(c2) }, false);
  }
  g = act(g, { type: "ack", id: "evaluation" }, false);
  g = practice(g);
  g = next(g);

  // 5 · Regulación: instrumento proporcional, cadena causal completa, ODS justificados.
  const policy = recommendedPolicies(g)[0] ?? "none";
  g = act(g, { type: "policy", id: policy, failure: policy === "none" ? "Ninguna falla suficiente" : s.failure }, false);
  const k = puzzleKey(g, policy),
    puzzle = Object.fromEntries(puzzleSlots.map((slot) => [slot, k[slot][0]])),
    tail = (prefix: string) => k[puzzleSlots.find((x) => k[x][0].startsWith(prefix + ":"))!][0].split(":")[1];
  g = act(g, { type: "regulatory", value: { evidence: tail("evidence"), incentive: tail("incentive"), adverse: tail("adverse"), reason: "El instrumento es proporcional a la severidad estimada de la falla.", chain: puzzle } }, false);
  g = act(g, { type: "alignment", sdgs: s.sdgs, policy: true }, false);
  const direct = directSDGs[scenarioId] ?? [];
  g = act(g, {
    type: "sdgReasons",
    value: Object.fromEntries(s.sdgs.map((id) => [id, direct.includes(id) ? { kind: "directa", evidence: "resultado", text: "El servicio del proyecto cambia directamente esta meta y se mide con el indicador de resultado." } : { kind: "indirecta", evidence: "impacto", text: "Contribuye a través de los impactos esperados del servicio, medidos en la evaluación ex post." }])),
  } as Action, false);
  // Mitigating risks changes the ex ante evaluation: like a careful player, revisit it and confirm it again.
  for (const r of s.risks) if (available(g) - r.cost >= projectCost(g)) g = attempt(g, { type: "mitigate", id: r.id });
  if (g.v2?.reviews[3]?.length) g = next(act(g, { type: "visit", phase: 3 }, false));
  g = practice(g);
  g = next(g);

  // 6 · Decisión: mitigaciones, comité evaluador y compromiso de la inversión.
  if (g.v2?.v22) g = act(g, { type: "committee", answers: referenceCommittee(g) }, false);
  g = practice(g);
  if (projectCost(g) > available(g)) g = attempt(g, { type: "finance", source: "credito" });
  g = act(g, { type: "commit", text: "Invertimos: el proyecto atiende las causas del problema, es viable y su riesgo está mitigado." });

  // 7 · Ejecución: se atiende cada evento mitigando; 8 · Ex post: resultados y reflexión.
  g = practice(g);
  for (let i = 0; i < 120 && !g.outcome; i++) {
    const before = g;
    g = attempt(g, g.pendingEvent ? { type: "respond", choice: "mitigar" } : { type: "advance" });
    if (g === before) g = attempt(g, g.pendingEvent ? { type: "respond", choice: "continuar" } : { type: "finance", source: "credito" });
    if (g === before) g = act(g, { type: "abandon" }, false);
  }
  g = attempt(g, { type: "reflection", text: "Lo que más cambió el resultado fue atender las causas con evidencia y proteger la operación y el mantenimiento." });
  return g;
}

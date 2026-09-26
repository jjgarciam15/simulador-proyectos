import type { GameState } from "../domain/types";
import {
  createGameV2,
  act,
  budgetFor,
  defaultActivities,
  projectCost,
  available,
} from "../domain/engine";
import { scenarioById } from "../data/scenarios";
import { chainBank, chainLevels } from "../domain/projectV2";
import { pendingDilemma } from "../domain/dilemmas";
/** Resolve any pending dilemma with the given option index (tests must decide explicitly). */
export function settleDilemma(g: GameState, choiceIndex = 0) {
  const t = pendingDilemma(g);
  if (!t) return g;
  return act(g, {
    type: "dilemma",
    choice: t.choices[Math.min(choiceIndex, t.choices.length - 1)].id,
  });
}
export function prepareV2(
  id = "agua",
  initial?: GameState,
  alternativeIndex = 1,
  dilemmaChoice = 0,
) {
  const next = (state: GameState) =>
    settleDilemma(act(state, { type: "next" }), dilemmaChoice);
  let g = initial ?? createGameV2(id, "guiado", "V2-TEST");
  g = act(g, { type: "nodes", ids: ["n0", "n1", "n2", "n3", "n4"] });
  if (g.v2) g = act(g, { type: "tree", placements: referenceTree(g) });
  g = act(g, {
    type: "mga",
    section: "links",
    value: {
      ...g.mga!,
      links: [
        { from: "n2", to: "n1" },
        { from: "n1", to: "n0" },
        { from: "n0", to: "n3" },
        { from: "n3", to: "n4" },
      ],
    },
  });
  g = next(g);
  g = act(g, { type: "objective", id: "n0" });
  g = act(g, { type: "alternative", id: "a" + alternativeIndex });
  if (g.v2?.v22) g = act(g, { type: "objectives", general: "n0", specific: ["n1", "n2"] });
  g = next(g);
  const budget = budgetFor(g, scenarioById(id).alternatives[alternativeIndex]);
  g = act(g, {
    type: "budget",
    value: budget,
    ...(g.v2
      ? {
          lines: [
            { id: "op-1", category: "operation", description: "Personal de operación", unit: "año", quantity: 1, unitCost: budget.operation },
            { id: "mt-1", category: "maintenance", description: "Mantenimiento preventivo", unit: "año", quantity: 1, unitCost: budget.maintenance },
          ],
        }
      : {}),
  });
  g = act(g, { type: "activities", value: defaultActivities(g) });
  g = act(g, {
    type: "indicators",
    value: [
      {
        name: "Acceso",
        kind: "Resultado",
        baseline: 0,
        target: g.target,
        unit: "personas",
        source: "Registro",
        owner: "Equipo",
        frequency: "Anual",
      },
    ],
  });
  const bank = chainBank(g)
    .filter((c) =>
      ["capital", "design", "service", "access", "welfare"].includes(c.id),
    )
    .sort((a, b) => chainLevels.indexOf(a.level) - chainLevels.indexOf(b.level));
  g = act(g, {
    type: "chain",
    cards: bank.map(({ id, level }) => ({ id, level })),
    connections: bank.slice(1).map((c, i) => ({ from: bank[i].id, to: c.id })),
  });
  if (g.v2?.v22) g = act(g, { type: "impacts", placements: referenceImpacts(g) });
  if (projectCost(g) > available(g))
    g = act(g, { type: "finance", source: "credito" });
  g = next(g);
  if (g.v2?.v22) g = completeEvaluationV22(g);
  g = act(g, { type: "ack", id: "evaluation" });
  g = next(g);
  g = act(g, {
    type: "policy",
    id: "none",
    failure: "Ninguna falla suficiente",
  });
  g = act(g, { type: "alignment", sdgs: scenarioById(id).sdgs, policy: false });
  g = act(g, {
    type: "sdgReasons",
    value: Object.fromEntries(
      g.sdgs.map((id) => [
        id,
        {
          kind: "directa",
          evidence: "resultado",
          text: "Servicio que mejora el acceso de la población.",
        },
      ]),
    ),
  });
  g = act(g, {
    type: "regulatory",
    value: {
      evidence: "observed",
      incentive: "baseline",
      adverse: "persistence",
      reason: "Comparar costos regulatorios con la evidencia disponible.",
    },
  });
  g = next(g);
  if (g.v2?.v22 && g.phase === 5) g = act(g, { type: "committee", answers: referenceCommittee(g) });
  return g;
}

/** Reference classification of effects and impacts (all correct). */
export function referenceImpacts(g: GameState) {
  return impactCards(g).map((c) => ({ id: c.id, kind: c.kind, ...(c.group ? { group: c.group } : {}) }));
}
/** V2.2 evaluation modules completed with reference answers (valuation, financial and economic flows). */
export function completeEvaluationV22(g: GameState) {
  if (g.phase !== 3 || !g.v2?.v22 || g.v2.v22.flow) return g;
  g = act(g, { type: "valuation", choices: referenceValuation(g) });
  const c = missionFlowCase(g)!;
  g = act(g, { type: "flow", rows: referenceRows(c) });
  const c2 = missionFlowCase(g)!;
  return act(g, { type: "economic", rows: referenceEconomic(c2), benefits: referenceBenefits(c2) });
}
/** Answer the committee with the strongest option and commit. */
export function commitV22(g: GameState, withComparison = false) {
  if (g.v2?.v22 && !g.v2.v22.committee) g = act(g, { type: "committee", answers: referenceCommittee(g) });
  return act(g, { type: "commit" }, withComparison);
}
import { impactCards, referenceValuation } from "../domain/valuation";
import { missionFlowCase } from "../domain/missionFlow";
import { referenceRows, referenceEconomic, referenceBenefits } from "../domain/flows";
import { referenceCommittee } from "../domain/committee";
import { referenceTree } from "../domain/problemTree";

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
import { chainBank } from "../domain/projectV2";
export function prepareV2(
  id = "agua",
  initial?: GameState,
  alternativeIndex = 1,
) {
  let g = initial ?? createGameV2(id, "guiado", "V2-TEST");
  g = act(g, { type: "nodes", ids: ["n0", "n1", "n2", "n3", "n4"] });
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
  g = act(g, { type: "next" });
  g = act(g, { type: "objective", id: "n0" });
  g = act(g, { type: "alternative", id: "a" + alternativeIndex });
  g = act(g, { type: "next" });
  g = act(g, {
    type: "budget",
    value: budgetFor(g, scenarioById(id).alternatives[alternativeIndex]),
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
  const bank = chainBank(g).filter((c) =>
    ["capital", "design", "service", "access", "welfare"].includes(c.id),
  );
  g = act(g, {
    type: "chain",
    cards: bank.map(({ id, level }) => ({ id, level })),
    connections: bank.slice(1).map((c, i) => ({ from: bank[i].id, to: c.id })),
  });
  if (projectCost(g) > available(g))
    g = act(g, { type: "finance", source: "credito" });
  g = act(g, { type: "next" });
  g = act(g, { type: "ack", id: "evaluation" });
  g = act(g, { type: "next" });
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
  g = act(g, { type: "next" });
  return g;
}

import type { GameState } from "./types";
import {
  chainBank,
  chainLevels,
  type ChainPlacement,
  type V2State,
} from "./projectV2";
import { scenarioById } from "../data/scenarios";
import { puzzleDeck, puzzleSlots } from "./regulationLab";
import { nodesFromTree, treeError, type TreePlacements } from "./problemTree";
export type ActionV2 =
  | { type: "resetStage" }
  | { type: "visit"; phase: number }
  | {
      type: "chain";
      cards: ChainPlacement[];
      connections: { from: string; to: string }[];
    }
  | { type: "actorMap"; value: V2State["actorMap"] }
  | { type: "sdgReasons"; value: V2State["sdgReasons"] }
  | { type: "regulatory"; value: V2State["regulatory"] }
  | { type: "planner"; value: number }
  | { type: "dilemma"; choice: string }
  | { type: "tree"; placements: TreePlacements };
export function applyV2(original: GameState, a: ActionV2) {
  if (!original.v2)
    throw new Error("Esta herramienta corresponde a una partida V2.");
  const g = structuredClone(original),
    v = g.v2!,
    s = scenarioById(g.scenarioId);
  if (a.type === "tree") {
    if (g.phase !== 0 || g.snapshot || g.outcome) throw new Error("El Árbol del problema se construye en Diagnóstico.");
    const error = treeError(g, a.placements);
    if (error) throw new Error(error);
    const placements = Object.fromEntries(
      Object.entries(a.placements as TreePlacements).map(([id, p]) => [id, p.side === "cause" || p.side === "effect" ? { side: p.side, parent: p.parent } : { side: p.side }]),
    ) as TreePlacements;
    v.tree = { placements };
    g.nodes = nodesFromTree(g, placements);
    return g;
  }
  if (a.type === "visit") {
    if (
      g.snapshot ||
      g.outcome ||
      !Number.isInteger(a.phase) ||
      a.phase < 0 ||
      a.phase > Math.min(5, g.maxPhase)
    )
      throw new Error("La etapa no está disponible para reformular.");
    if (a.phase >= 2 && !g.alternative)
      throw new Error(
        "Selecciona una alternativa en Formulación antes de revisar esta etapa.",
      );
    g.phase = a.phase;
    return g;
  }
  if (g.outcome) throw new Error("Esta misión está cerrada.");
  if (a.type === "planner") {
    if (!Number.isFinite(a.value) || a.value < 0)
      throw new Error("Planea un monto no negativo.");
    v.planner = a.value;
    return g;
  }
  if (g.snapshot)
    throw new Error(
      "Usa respuestas de ejecución para adaptar la inversión comprometida.",
    );
  if (a.type === "resetStage") {
    if (g.phase > 4)
      throw new Error(
        "Solo puedes reiniciar etapas de formulación antes de invertir.",
      );
    if (g.phase === 0) {
      g.nodes = ["n0"];
      g.target = s.affected;
      v.actorMap = {};
      if (g.mga) g.mga.links = [];
    }
    if (g.phase === 1) {
      g.objective = "";
      g.alternative = "";
      g.compared = [];
    }
    if (g.phase === 2) {
      v.budgetLines = [];
      g.budget = {
        operation: 0,
        maintenance: 0,
        environment: 0,
        social: 0,
        oversight: 0,
        contingency: 0,
      };
      g.activities = [];
      g.indicators = [];
      v.chain = [];
      v.connections = [];
    }
    if (g.phase === 3 && g.mga) {
      g.mga.prediction = "";
      g.mga.assumption = "";
    }
    if (g.phase === 4) {
      g.policy = "none";
      g.failure = "";
      g.sdgs = [];
      g.policyAligned = false;
      v.sdgReasons = {};
      v.regulatory = { evidence: "", incentive: "", adverse: "", reason: "" };
      // Money and time already spent on the territorial analysis stay; the answers are cleared.
      if (v.territory) v.territory = { alternative: v.territory.alternative, applied: v.territory.applied };
    }
    g.acknowledged = [];
    v.resetCount = (v.resetCount ?? 0) + 1;
    v.completed = v.completed.filter((p) => p !== g.phase);
    delete v.reviews[g.phase];
    return g;
  }
  if (a.type === "dilemma")
    throw new Error("Los dilemas se resuelven desde el motor principal.");
  const required = { chain: 2, actorMap: 0, sdgReasons: 4, regulatory: 4 }[
    a.type
  ];
  if (g.phase !== required)
    throw new Error("Visita la etapa correspondiente para confirmar.");
  if (a.type === "chain") {
    const bank = chainBank(g);
    if (
      new Set(a.cards.map((c) => c.id)).size !== a.cards.length ||
      a.cards.some(
        (c) =>
          !bank.some((b) => b.id === c.id) || !chainLevels.includes(c.level),
      ) ||
      a.connections.some(
        (l) =>
          l.from === l.to ||
          !a.cards.some((c) => c.id === l.from) ||
          !a.cards.some((c) => c.id === l.to),
      ) ||
      new Set(a.connections.map((l) => l.from + ">" + l.to)).size !==
        a.connections.length
    )
      throw new Error("Usa tarjetas y conexiones existentes, sin duplicados.");
    const walk = (id: string, path: string[]): boolean =>
      path.includes(id) ||
      a.connections
        .filter((l) => l.from === id)
        .some((l) => walk(l.to, [...path, id]));
    if (a.cards.some((c) => walk(c.id, [])))
      throw new Error("La cadena de valor no admite dependencias circulares.");
    v.chain = a.cards;
    v.connections = a.connections;
  }
  if (a.type === "actorMap") {
    if (
      Object.entries(a.value).some(
        ([id, p]) =>
          !s.actors.some((a) => a.id === id) ||
          !["alto", "bajo"].includes(p.power) ||
          !["alto", "bajo"].includes(p.interest),
      )
    )
      throw new Error("Ubica actores conocidos en la matriz.");
    v.actorMap = a.value;
  }
  if (a.type === "sdgReasons") {
    if (
      Object.entries(a.value).some(
        ([id, r]) =>
          !g.sdgs.includes(Number(id)) ||
          !["directa", "indirecta"].includes(r.kind) ||
          !["producto", "resultado", "impacto", "gestion"].includes(
            r.evidence,
          ) ||
          !r.text.trim() ||
          r.text.length > 200,
      )
    )
      throw new Error(
        "Cada ODS seleccionado necesita tipo de relación, evidencia y argumento de hasta 200 caracteres.",
      );
    if (g.sdgs.some((id) => !a.value[id]))
      throw new Error("Falta sustentar un ODS seleccionado.");
    v.sdgReasons = a.value;
  }
  if (a.type === "regulatory") {
    if (
      !["observed", "popularity", "spending", "sole-price", "opinion"].includes(
        a.value.evidence,
      ) ||
      !["entry", "price", "baseline", "automatic", "profit"].includes(
        a.value.incentive,
      ) ||
      !["oversight", "barriers", "persistence", "none", "guarantee"].includes(
        a.value.adverse,
      ) ||
      !a.value.reason.trim() ||
      a.value.reason.length > 200
    )
      throw new Error(
        "Completa evidencia, incentivo, efecto adverso y argumento breve.",
      );
    const chain = a.value.chain;
    if (chain) {
      const deck = new Set(puzzleDeck(g).map((c) => c.id));
      if (
        puzzleSlots.some((slot) => !chain[slot] || !deck.has(chain[slot])) ||
        Object.keys(chain).some((k) => !(puzzleSlots as readonly string[]).includes(k)) ||
        new Set(Object.values(chain)).size !== Object.values(chain).length
      )
        throw new Error(
          "Completa los ocho eslabones de la cadena regulatoria con tarjetas distintas.",
        );
    }
    v.regulatory = a.value;
  }
  return g;
}

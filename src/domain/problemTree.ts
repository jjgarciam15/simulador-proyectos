import type { GameState, LogicNode } from "./types";
import { scenarioById } from "../data/scenarios";
import { missionTreeCards } from "../data/treeCards";
import { random } from "./finance";

/**
 * Árbol del problema construido por el jugador (V2): a shuffled bank of correct cards and traps.
 * Each card is placed in a level or left out of the tree. Nothing is pre-arranged.
 */
export type TreeSlot = LogicNode["level"] | "fuera";
export const treeSlots: { id: TreeSlot; label: string }[] = [
  { id: "impact", label: "Efecto indirecto" },
  { id: "effect", label: "Efecto directo" },
  { id: "central", label: "Problema central" },
  { id: "direct", label: "Causa directa" },
  { id: "indirect", label: "Causa indirecta" },
  { id: "fuera", label: "No pertenece al árbol" },
];
export interface TreeCard {
  id: string;
  label: string;
  /** Right place for the card; traps belong outside the tree. */
  slot: TreeSlot;
  why: string;
}
const side = (slot: TreeSlot) => (slot === "direct" || slot === "indirect" ? "causa" : slot === "effect" || slot === "impact" ? "efecto" : slot);
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export function treeCards(g: GameState): TreeCard[] {
  const s = scenarioById(g.scenarioId),
    node = (id: string) => s.nodes.find((n) => n.id === id);
  const why: Record<string, string> = {
    central: "Es la situación negativa que afecta a la población y que el proyecto busca resolver.",
    direct: "Explica directamente por qué ocurre el problema central.",
    indirect: "Explica una causa directa: está un nivel más abajo en la cadena causal.",
    effect: "Es una consecuencia inmediata de que el problema exista.",
    impact: "Es una consecuencia de los efectos directos, de más largo plazo.",
  };
  const base: TreeCard[] = s.nodes.map((n) =>
    n.valid
      ? { id: n.id, label: n.label, slot: n.level, why: why[n.level] }
      : { id: n.id, label: n.label, slot: "fuera", why: "Describe la falta de una solución concreta, no una condición verificable que cause el problema." },
  );
  const m = missionTreeCards[g.scenarioId];
  const extras: TreeCard[] = m
    ? [
        { id: "x-direct", label: m.direct, slot: "direct", why: why.direct },
        { id: "x-indirect", label: m.indirect, slot: "indirect", why: why.indirect },
        { id: "x-effect", label: m.effect, slot: "effect", why: why.effect },
        { id: "t-mission", label: m.trap, slot: "fuera", why: "Puede ser cierto, pero no explica el problema central ni es una consecuencia suya." },
      ]
    : (s.treeExtras ?? []).map((x, i) => ({ id: "p-" + i, label: x.label, slot: x.level, why: why[x.level] }));
  const alt = s.alternatives[0]?.name ?? "la obra";
  const traps: TreeCard[] = [
    { id: "t-solucion", label: `Falta de ${lower(alt)}`, slot: "fuera", why: "Es una solución disfrazada de problema: «falta de X» anticipa la respuesta antes de analizar." },
    { id: "t-objetivo", label: node("n0")?.objective ?? "Mejorar la situación de la población", slot: "fuera", why: "Está redactada como objetivo (situación deseada), no como problema ni causa." },
    { id: "t-general", label: "Falta de voluntad política y de recursos en general", slot: "fuera", why: "Es demasiado general: no se puede verificar ni atender con un proyecto concreto." },
  ];
  // No two cards with the same text (an author may repeat a phrase used by a generic trap).
  const unique = [...base, ...extras, ...traps].filter((c, i, all) => all.findIndex((x) => x.label.trim().toLowerCase() === c.label.trim().toLowerCase()) === i);
  return unique.sort((a, b) => random(g.seed, "tree" + a.id) - random(g.seed, "tree" + b.id));
}
export type TreePlacements = Record<string, TreeSlot>;
/** Review: exact level = 1; right side (cause/effect) but wrong level = 0.5; traps must stay out. */
export function treeReview(g: GameState, placements: TreePlacements = g.v2?.tree?.placements ?? {}) {
  const cards = treeCards(g);
  const rows = cards.map((c) => {
    const placed = placements[c.id];
    const credit = !placed ? 0 : placed === c.slot ? 1 : c.slot !== "fuera" && placed !== "fuera" && side(placed) === side(c.slot) && side(c.slot) !== "central" ? 0.5 : 0;
    const status = !placed ? "sin ubicar" : credit === 1 ? "correcta" : credit ? "nivel incorrecto" : c.slot === "fuera" ? "trampa incluida" : placed === "fuera" ? "tarjeta válida descartada" : "incorrecta";
    return { card: c, placed, credit, status };
  });
  const central = Object.entries(placements).filter(([, slot]) => slot === "central").length;
  const score = Math.round((100 * rows.reduce((n, r) => n + r.credit, 0)) / Math.max(1, rows.length) - (central > 1 ? 10 : 0));
  return { rows, score: Math.max(0, score), centralCount: central };
}
export function referenceTree(g: GameState): TreePlacements {
  return Object.fromEntries(treeCards(g).map((c) => [c.id, c.slot]));
}
/** Nodes of the scenario (for the rest of the engine) that the player put inside the tree. */
export function nodesFromTree(g: GameState, placements: TreePlacements) {
  const s = scenarioById(g.scenarioId);
  return [...new Set(["n0", ...Object.entries(placements).filter(([id, slot]) => slot !== "fuera" && s.nodes.some((n) => n.id === id)).map(([id]) => id)])];
}

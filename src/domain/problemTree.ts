import type { GameState, LogicNode } from "./types";
import { scenarioById } from "../data/scenarios";
import { missionTreeCards } from "../data/treeCards";
import { random } from "./finance";

/**
 * Árbol del problema construido por el jugador (V2): a shuffled bank of correct cards and traps that the
 * player arranges as a real tree, only by dragging. The central problem sits in the middle; each direct
 * cause hangs from it and each indirect cause hangs from the cause it explains (any depth); effects grow
 * upwards the same way. Traps go to «No pertenece al árbol». Nothing is pre-arranged.
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
/** Where a card hangs: the side of the tree and the card (or the central problem) it hangs from. */
export type TreeSide = "central" | "cause" | "effect" | "fuera";
export interface TreePlacement {
  side: TreeSide;
  /** `CENTRAL` (hangs directly from the central problem) or the id of the card it hangs from. */
  parent?: string;
}
export type TreePlacements = Record<string, TreePlacement>;
/** Saved before 2.7: only the level of each card. Read and converted, never written. */
export type LegacyTreePlacements = Record<string, TreeSlot>;
export const CENTRAL = "@central";

export interface TreeCard {
  id: string;
  label: string;
  /** Right place for the card; traps belong outside the tree. */
  slot: TreeSlot;
  /** Card(s) it may hang from (`CENTRAL` for direct causes and direct effects). */
  parents?: string[];
  why: string;
}
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const sideOf = (slot: TreeSlot): TreeSide => (slot === "direct" || slot === "indirect" ? "cause" : slot === "effect" || slot === "impact" ? "effect" : slot === "central" ? "central" : "fuera");

export function treeCards(g: GameState): TreeCard[] {
  const s = scenarioById(g.scenarioId),
    node = (id: string) => s.nodes.find((n) => n.id === id);
  const why: Record<string, string> = {
    central: "Es la situación negativa que afecta a la población y que el proyecto busca resolver.",
    direct: "Explica directamente por qué ocurre el problema central: cuelga del problema central.",
    indirect: "Explica una causa directa: cuelga de la causa que produce.",
    effect: "Es una consecuencia inmediata de que el problema exista: cuelga del problema central.",
    impact: "Es una consecuencia de un efecto directo, de más largo plazo: cuelga del efecto que lo produce.",
  };
  const base: TreeCard[] = s.nodes.map((n) =>
    n.valid
      ? { id: n.id, label: n.label, slot: n.level, parents: n.level === "central" ? undefined : n.level === "direct" || n.level === "effect" ? [CENTRAL] : [n.parent ?? CENTRAL], why: why[n.level] }
      : { id: n.id, label: n.label, slot: "fuera", why: "Describe la falta de una solución concreta, no una condición verificable que cause el problema." },
  );
  const m = missionTreeCards[g.scenarioId];
  let extras: TreeCard[];
  if (m)
    extras = [
      { id: "x-direct", label: m.direct, slot: "direct", parents: [CENTRAL], why: why.direct },
      { id: "x-indirect", label: m.indirect, slot: "indirect", parents: m.indirectOf, why: why.indirect },
      { id: "x-effect", label: m.effect, slot: "effect", parents: [CENTRAL], why: why.effect },
      { id: "t-mission", label: m.trap, slot: "fuera", why: "Puede ser cierto, pero no explica el problema central ni es una consecuencia suya." },
    ];
  else {
    // Generated missions: the author did not say which cause each extra one explains, so any card of the level above counts.
    const more = (s.treeExtras ?? []).map((x, i) => ({ id: "p-" + i, ...x })),
      directs = ["n1", ...more.filter((x) => x.level === "direct").map((x) => x.id)],
      effects = ["n3", ...more.filter((x) => x.level === "effect").map((x) => x.id)];
    extras = more.map((x) => ({ id: x.id, label: x.label, slot: x.level, parents: x.level === "indirect" ? directs : x.level === "impact" ? effects : [CENTRAL], why: why[x.level] }));
  }
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

/** Depth of a placed card below (causes) or above (effects) the central problem: 1 = direct. */
export function treeDepth(placements: TreePlacements, id: string) {
  let depth = 0,
    current: string | undefined = id;
  const seen = new Set<string>();
  while (current && current !== CENTRAL) {
    if (seen.has(current)) return Infinity;
    seen.add(current);
    depth++;
    current = placements[current]?.parent;
  }
  return current === CENTRAL ? depth : Infinity;
}
/** Level that a placement gives a card (direct/indirect cause, direct/indirect effect…). */
export function placedLevel(placements: TreePlacements, id: string): TreeSlot | null {
  const p = placements[id];
  if (!p) return null;
  if (p.side === "central" || p.side === "fuera") return p.side;
  const depth = treeDepth(placements, id);
  if (!Number.isFinite(depth)) return null;
  return p.side === "cause" ? (depth === 1 ? "direct" : "indirect") : depth === 1 ? "effect" : "impact";
}
/** Cards that hang from a card (or from the central problem) on one side, in bank order. */
export function childrenOf(placements: TreePlacements, parent: string, side: "cause" | "effect") {
  return Object.entries(placements)
    .filter(([, p]) => p.side === side && p.parent === parent)
    .map(([id]) => id);
}
/** Every card that hangs, directly or not, from a card. */
export function descendantsOf(placements: TreePlacements, id: string): string[] {
  const direct = Object.entries(placements)
    .filter(([, p]) => p.parent === id)
    .map(([k]) => k);
  return direct.flatMap((k) => [k, ...descendantsOf(placements, k)]);
}

/** Converts a tree saved before 2.7 (level only) into the hierarchical model, guessing each parent from the reference. */
export function normalizeTree(g: GameState, raw: Record<string, TreePlacement | TreeSlot> | undefined): TreePlacements {
  const entries = Object.entries(raw ?? {});
  if (entries.every(([, v]) => typeof v === "object")) return Object.fromEntries(entries) as TreePlacements;
  const cards = treeCards(g),
    levelOf = Object.fromEntries(entries.map(([id, v]) => [id, typeof v === "string" ? v : placedLevel(raw as TreePlacements, id)]));
  const parentFor = (id: string, upper: TreeSlot) => {
    const expected = cards.find((c) => c.id === id)?.parents ?? [];
    return expected.find((p) => levelOf[p] === upper) ?? Object.keys(levelOf).find((k) => levelOf[k] === upper) ?? CENTRAL;
  };
  return Object.fromEntries(
    entries.map(([id]) => {
      const lv = levelOf[id];
      const placement: TreePlacement =
        lv === "central" || lv === "fuera" || !lv
          ? { side: lv === "central" ? "central" : "fuera" }
          : lv === "direct" || lv === "effect"
            ? { side: sideOf(lv), parent: CENTRAL }
            : { side: sideOf(lv), parent: parentFor(id, lv === "indirect" ? "direct" : "effect") };
      return [id, placement];
    }),
  );
}

/**
 * Review: right level and hanging from the right card = 1; right side (cause/effect) but wrong level
 * or wrong parent = 0.5; a trap inside the tree or a valid card discarded = 0.
 */
export function treeReview(g: GameState, raw: Record<string, TreePlacement | TreeSlot> = g.v2?.tree?.placements ?? {}) {
  const placements = normalizeTree(g, raw),
    cards = treeCards(g);
  const rows = cards.map((c) => {
    const p = placements[c.id],
      level = placedLevel(placements, c.id),
      want = sideOf(c.slot);
    let credit = 0,
      status = "sin ubicar";
    if (p) {
      if (c.slot === "fuera") [credit, status] = p.side === "fuera" ? [1, "correcta"] : [0, "trampa incluida"];
      else if (p.side === "fuera") status = "tarjeta válida descartada";
      else if (p.side !== want) status = c.slot === "central" || p.side === "central" ? "incorrecta" : want === "cause" ? "es una causa, no un efecto" : "es un efecto, no una causa";
      else if (c.slot === "central") [credit, status] = [1, "correcta"];
      else if (level !== c.slot) [credit, status] = [0.5, "nivel incorrecto"];
      else if (!c.parents?.includes(p.parent ?? "")) [credit, status] = [0.5, c.slot === "indirect" || c.slot === "impact" ? "cuelga de otra tarjeta" : "nivel incorrecto"];
      else [credit, status] = [1, "correcta"];
    }
    return { card: c, placed: level ?? undefined, parent: p?.parent, credit, status };
  });
  const central = Object.values(placements).filter((p) => p.side === "central").length;
  const score = Math.round((100 * rows.reduce((n, r) => n + r.credit, 0)) / Math.max(1, rows.length) - (central > 1 ? 10 : 0));
  return { rows, score: Math.max(0, score), centralCount: central };
}
/** Structural check used by the engine: known cards, one central problem, valid parents and no loops. */
export function treeError(g: GameState, placements: unknown): string | null {
  if (!placements || typeof placements !== "object" || Array.isArray(placements)) return "Arrastra las tarjetas al árbol.";
  const ids = new Set(treeCards(g).map((c) => c.id)),
    entries = Object.entries(placements as Record<string, unknown>);
  if (!entries.length) return "Arrastra las tarjetas al árbol.";
  if (entries.filter(([, p]) => (p as TreePlacement)?.side === "central").length !== 1) return "El árbol necesita exactamente un problema central.";
  for (const [id, raw] of entries) {
    const p = raw as TreePlacement;
    if (!ids.has(id) || !p || typeof p !== "object" || !["central", "cause", "effect", "fuera"].includes(p.side)) return "Ubica cada tarjeta en el árbol o déjala fuera.";
    if (p.side === "cause" || p.side === "effect") {
      const parent = p.parent === CENTRAL ? null : (placements as TreePlacements)[p.parent ?? ""];
      if (p.parent !== CENTRAL && (!parent || parent.side !== p.side)) return "Cada causa cuelga del problema central o de otra causa, y cada efecto del problema central o de otro efecto.";
      if (!Number.isFinite(treeDepth(placements as TreePlacements, id))) return "Una tarjeta no puede colgar de sí misma ni de las que dependen de ella.";
    }
  }
  return null;
}
export function referenceTree(g: GameState): TreePlacements {
  return Object.fromEntries(
    treeCards(g).map((c) => {
      const side = sideOf(c.slot);
      return [c.id, side === "cause" || side === "effect" ? { side, parent: c.parents?.[0] ?? CENTRAL } : { side }];
    }),
  );
}
/** Nodes of the scenario (for the rest of the engine) that the player put inside the tree. */
export function nodesFromTree(g: GameState, placements: TreePlacements) {
  const s = scenarioById(g.scenarioId);
  return [...new Set(["n0", ...Object.entries(placements).filter(([id, p]) => p.side !== "fuera" && s.nodes.some((n) => n.id === id)).map(([id]) => id)])];
}

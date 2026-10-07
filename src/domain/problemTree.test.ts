import { describe, expect, it } from "vitest";
import { scenarios } from "../data/scenarios";
import { act, createGameV2 } from "./engine";
import { CENTRAL, placedLevel, referenceTree, treeCards, treeDepth, treeReview } from "./problemTree";
import { sampleProject } from "../testSupport/projectFixture";
import { createMission, emptyStore, startGeneratedGame, upsertProject } from "./project/store";

describe("Árbol del problema construido por el jugador", () => {
  it("cada misión ofrece un banco mezclado con al menos 8 tarjetas correctas y 5 trampas", () => {
    for (const s of scenarios) {
      const cards = treeCards(createGameV2(s.id, "guiado", "T-" + s.id));
      const valid = cards.filter((c) => c.slot !== "fuera"),
        traps = cards.filter((c) => c.slot === "fuera");
      expect(valid.length, s.id).toBeGreaterThanOrEqual(8);
      expect(traps.length, s.id).toBeGreaterThanOrEqual(5);
      expect(new Set(cards.map((c) => c.label)).size, s.id + " etiquetas repetidas").toBe(cards.length);
      expect(cards.filter((c) => c.slot === "central")).toHaveLength(1);
      // Not pre-arranged: the bank is not ordered by level.
      const order = cards.map((c) => c.slot).join(",");
      expect(order).not.toBe([...cards].sort((a, b) => a.slot.localeCompare(b.slot)).map((c) => c.slot).join(","));
    }
  });
  it("puntúa la construcción jerárquica: nivel y de qué tarjeta cuelga cada causa y efecto", () => {
    const g = createGameV2("agua", "guiado", "T-1"),
      ref = referenceTree(g);
    expect(treeReview(g, ref).score).toBe(100);
    // Structure of the whiteboard: n2 hangs from n1, the extra indirect cause from the extra direct one, n4 from n3.
    expect(ref.n1).toEqual({ side: "cause", parent: CENTRAL });
    expect(ref.n2).toEqual({ side: "cause", parent: "n1" });
    expect(ref["x-indirect"]).toEqual({ side: "cause", parent: "x-direct" });
    expect(ref.n4).toEqual({ side: "effect", parent: "n3" });
    const withTrap = { ...ref, "t-solucion": { side: "cause" as const, parent: CENTRAL } };
    const wrongParent = { ...ref, n2: { side: "cause" as const, parent: "x-direct" } };
    const wrongLevel = { ...ref, n1: { side: "cause" as const, parent: "x-direct" } };
    const wrongSide = { ...ref, n3: { side: "cause" as const, parent: CENTRAL } };
    const discarded = { ...ref, "x-effect": { side: "fuera" as const } };
    for (const t of [withTrap, wrongParent, wrongLevel, wrongSide, discarded]) expect(treeReview(g, t).score).toBeLessThan(100);
    expect(treeReview(g, wrongParent).rows.find((r) => r.card.id === "n2")!.status).toBe("cuelga de otra tarjeta");
    expect(treeReview(g, wrongParent).score).toBeGreaterThan(treeReview(g, withTrap).score);
    expect(treeReview(g, withTrap).rows.find((r) => r.card.id === "t-solucion")!.status).toBe("trampa incluida");
    expect(treeReview(g, wrongSide).rows.find((r) => r.card.id === "n3")!.status).toBe("es un efecto, no una causa");
    // Deeper nesting (indirect of an indirect, as «ID 2.1.1» on the whiteboard) is allowed and counts as indirect.
    const deep = { ...ref, "x-indirect": { side: "cause" as const, parent: "n2" } };
    expect(placedLevel(deep, "x-indirect")).toBe("indirect");
    expect(treeDepth(deep, "x-indirect")).toBe(3);
  });
  it("cada causa indirecta adicional de las nueve misiones cuelga de una causa directa que existe", () => {
    for (const s of scenarios) {
      const g = createGameV2(s.id, "guiado", "T"),
        cards = treeCards(g);
      for (const c of cards.filter((c) => c.slot === "indirect" || c.slot === "impact"))
        for (const parent of c.parents!) expect(cards.find((x) => x.id === parent)?.slot, `${s.id}/${c.id}`).toBe(c.slot === "indirect" ? "direct" : "effect");
      expect(treeReview(g, referenceTree(g)).score, s.id).toBe(100);
    }
  });
  it("lee árboles guardados antes de 2.7 (solo nivel) y los convierte sin perder la nota", () => {
    const g = createGameV2("agua", "guiado", "T-legacy"),
      legacy = Object.fromEntries(treeCards(g).map((c) => [c.id, c.slot]));
    expect(treeReview(g, legacy).score).toBe(100);
  });
  it("el motor exige un solo problema central, padres válidos y sin ciclos, y actualiza los nodos", () => {
    let g = createGameV2("agua", "guiado", "T-2");
    expect(() => act(g, { type: "next" })).toThrow(/Árbol del problema/);
    const ref = referenceTree(g);
    expect(() => act(g, { type: "tree", placements: { ...ref, n1: { side: "central" } } })).toThrow(/un problema central/);
    expect(() => act(g, { type: "tree", placements: { ...ref, falsa: { side: "cause", parent: CENTRAL } } })).toThrow();
    expect(() => act(g, { type: "tree", placements: { ...ref, n2: { side: "cause", parent: "n3" } } })).toThrow(/cuelga/);
    expect(() => act(g, { type: "tree", placements: { ...ref, n1: { side: "cause", parent: "n2" } } })).toThrow(/sí misma/);
    g = act(g, { type: "tree", placements: { ...ref, d1: { side: "cause", parent: CENTRAL } } });
    expect(g.nodes).toEqual(expect.arrayContaining(["n0", "n1", "n2", "n3", "n4", "d1"]));
    expect(g.v2!.tree!.placements.d1).toEqual({ side: "cause", parent: CENTRAL });
  });
});

describe("Árbol del problema de un proyecto propio", () => {
  it("incluye como tarjetas todas las causas y efectos del autor, sin textos repetidos", () => {
    const p = sampleProject();
    p.causes.push({ id: "c-extra", text: "Mantenimiento comunitario sin recursos", level: "indirecta" });
    p.problemEffects.push({ id: "e-extra", text: "Abandono escolar en temporada seca", level: "directa" });
    const c = createMission(upsertProject(emptyStore(), p), p, { difficulty: "guiado", mode: "aprendizaje", duration: "completa" });
    if (!c.ok) throw new Error(JSON.stringify(c.errors));
    const cards = treeCards(startGeneratedGame(c.mission.id, "T"));
    for (const t of [...p.causes, ...p.problemEffects].map((x) => x.text)) expect(cards.some((k) => k.label === t)).toBe(true);
    expect(cards.find((k) => k.label === "Mantenimiento comunitario sin recursos")!.slot).toBe("indirect");
    expect(cards.find((k) => k.label === "Abandono escolar en temporada seca")!.slot).toBe("effect");
    expect(new Set(cards.map((k) => k.label.toLowerCase())).size).toBe(cards.length);
  });
});

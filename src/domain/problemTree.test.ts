import { describe, expect, it } from "vitest";
import { scenarios } from "../data/scenarios";
import { act, createGameV2 } from "./engine";
import { referenceTree, treeCards, treeReview } from "./problemTree";
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
  it("puntúa la construcción: correcto 100; trampas incluidas, nivel equivocado y tarjetas descartadas restan", () => {
    const g = createGameV2("agua", "guiado", "T-1"),
      ref = referenceTree(g);
    expect(treeReview(g, ref).score).toBe(100);
    const withTrap = { ...ref, "t-solucion": "direct" as const };
    const wrongLevel = { ...ref, n1: "indirect" as const };
    const discarded = { ...ref, "x-effect": "fuera" as const };
    expect(treeReview(g, withTrap).score).toBeLessThan(100);
    expect(treeReview(g, wrongLevel).score).toBeGreaterThan(treeReview(g, withTrap).score);
    expect(treeReview(g, discarded).score).toBeLessThan(100);
    expect(treeReview(g, withTrap).rows.find((r) => r.card.id === "t-solucion")!.status).toBe("trampa incluida");
  });
  it("el motor exige un solo problema central y actualiza los nodos del expediente", () => {
    let g = createGameV2("agua", "guiado", "T-2");
    expect(() => act(g, { type: "next" })).toThrow(/Árbol del problema/);
    const ref = referenceTree(g);
    expect(() => act(g, { type: "tree", placements: { ...ref, n1: "central" } })).toThrow(/un problema central/);
    expect(() => act(g, { type: "tree", placements: { ...ref, falsa: "direct" } })).toThrow();
    g = act(g, { type: "tree", placements: { ...ref, d1: "direct" } });
    expect(g.nodes).toEqual(expect.arrayContaining(["n0", "n1", "n2", "n3", "n4", "d1"]));
    expect(g.v2!.tree!.placements.d1).toBe("direct");
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

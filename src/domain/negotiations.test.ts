import { describe, it, expect } from "vitest";
import { act, createGameV2 } from "./engine";
import { decode } from "./storage";
import { scenarios } from "../data/scenarios";
import { negotiationProfiles } from "../data/negotiationProfiles";
import {
  negotiationQuote,
  negotiationCommitments,
  actorCommitment,
} from "./negotiations";
describe("Mesas de negociación", () => {
  it("define demandas específicas de todos los actores y congela los términos acordados", () => {
    for (const s of scenarios) {
      expect(negotiationProfiles[s.id]).toHaveLength(s.actors.length);
      for (const actor of s.actors) {
        const g = createGameV2(s.id),
          c = actorCommitment(g, actor.id);
        expect(c.evidence.length).toBeGreaterThan(20);
        expect(c.minimum).toBeGreaterThan(0);
      }
    }
    const g = act(createGameV2("salud"), {
      type: "negotiate",
      actorId: "actor0",
      choice: "escuchar",
    });
    const agreed = actorCommitment(g, "actor0");
    delete g.v2!.negotiationRules;
    expect(actorCommitment(g, "actor0")).toEqual(agreed);
    const old = createGameV2("salud");
    delete old.v2!.negotiationRules;
    expect(actorCommitment(old, "actor0").minimum).toBe(564);
  });
  it("conserva rondas al recargar y rechaza registros incompletos", () => {
    const g = act(createGameV2("agua"), {
      type: "negotiate",
      actorId: "actor0",
      choice: "escuchar",
    });
    const raw = { version: 1, active: g, history: [] };
    expect(decode(JSON.stringify(raw)).active?.v2?.negotiations).toEqual(
      g.v2!.negotiations,
    );
    const bad = JSON.parse(JSON.stringify(raw));
    bad.active.v2.negotiations.actor0.rounds = null;
    expect(() => decode(JSON.stringify(bad))).toThrow(/negociación/);
  });
  it("explorar una oferta no gasta ni cambia estado", () => {
    const g = createGameV2("agua"),
      before = structuredClone(g);
    const q = negotiationQuote(g, "actor0", "escuchar");
    expect(q.cost).toBe(38);
    expect(g).toEqual(before);
  });
  it("rechaza una propuesta sin evidencia y admite acuerdo tras escuchar", () => {
    let g = createGameV2("agua");
    g = act(g, { type: "negotiate", actorId: "actor0", choice: "acuerdo" });
    expect(g.v2!.negotiations!.actor0.status).toBe("abierto");
    expect(g.support).toBe(48);
    g = act(g, { type: "negotiate", actorId: "actor0", choice: "escuchar" });
    g = act(g, { type: "negotiate", actorId: "actor0", choice: "acuerdo" });
    expect(g.v2!.negotiations!.actor0.status).toBe("acuerdo");
    expect(g.month).toBe(5);
    expect(g.spent).toBe(342);
    expect(() =>
      act(g, { type: "negotiate", actorId: "actor0", choice: "compensar" }),
    ).toThrow(/cerró/);
  });
  it("las obligaciones dependen del presupuesto y sobreviven al reinicio", () => {
    let g = createGameV2("agua");
    g.studies = ["social"];
    g = act(g, { type: "negotiate", actorId: "actor0", choice: "acuerdo" });
    expect(negotiationCommitments(g)[0].funded).toBe(false);
    const c = actorCommitment(g, "actor0");
    g.budget[c.category] = c.minimum;
    expect(negotiationCommitments(g)[0].funded).toBe(true);
    const next = act(g, { type: "resetStage" });
    expect(next.v2!.negotiations).toEqual(g.v2!.negotiations);
    expect(next.spent).toBe(g.spent);
  });
  it("no permite gastar sin respaldo ni negociar fuera del diagnóstico", () => {
    const g = createGameV2("agua");
    g.cash = 0;
    expect(() =>
      act(g, { type: "negotiate", actorId: "actor0", choice: "compensar" }),
    ).toThrow(/Saldo insuficiente/);
    expect(g.spent).toBe(0);
    g.phase = 3;
    expect(() => negotiationQuote(g, "actor0", "escuchar")).toThrow(
      /Diagnóstico/,
    );
  });
});

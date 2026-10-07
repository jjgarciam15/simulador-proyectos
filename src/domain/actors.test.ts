import { describe, expect, it } from "vitest";
import { scenarios, scenarioById } from "../data/scenarios";
import { act, createGameV2 } from "./engine";
import { decode } from "./storage";
import { gameActors, isGovernment, leadingOpponent, opposition, rollActorProfiles } from "./actors";
import { actorMapScore } from "./projectV2";
import { referenceActorMap } from "./demo";
import { prepareV2, commitV22 } from "../testSupport/gameFixture";
import { sampleProject } from "../testSupport/projectFixture";
import { createMission, emptyStore, startGeneratedGame, upsertProject } from "./project/store";

describe("Actores con perfil sorteado en cada partida", () => {
  it("cada partida sortea poder, interés y posición; el mismo código repite el perfil", () => {
    const a = createGameV2("agua", "guiado", "A-1"),
      b = createGameV2("agua", "guiado", "A-1"),
      c = createGameV2("agua", "guiado", "OTRO-CODIGO");
    expect(a.actorProfiles).toEqual(b.actorProfiles);
    const differs = scenarios.some((s) => JSON.stringify(createGameV2(s.id, "guiado", "X1").actorProfiles) !== JSON.stringify(createGameV2(s.id, "guiado", "X2").actorProfiles));
    expect(differs).toBe(true);
    expect(JSON.stringify(a.actorProfiles)).not.toBe(JSON.stringify(c.actorProfiles));
  });
  it("en las nueve misiones y con muchos códigos: el gobierno siempre es neutral y el mapa es aprendible", () => {
    for (const s of scenarios)
      for (let i = 0; i < 40; i++) {
        const p = rollActorProfiles(s, "SEED-" + i),
          actors = s.actors.map((a) => ({ ...a, ...p[a.id] }));
        for (const a of actors) {
          expect(a.government, a.name).toBe(isGovernment(a.name));
          if (a.government) expect(a.position).toBe(0);
          else expect(Math.abs(a.position), `${s.id}/${a.name}`).toBeGreaterThanOrEqual(20);
          // Never ambiguous around the threshold of 60.
          for (const v of [a.power, a.interest]) expect(v < 55 || v >= 66, `${s.id}/${a.name} ${v}`).toBe(true);
        }
        expect(actors.some((a) => a.power >= 60 && a.interest >= 60), s.id).toBe(true);
        expect(actors.some((a) => !(a.power >= 60 && a.interest >= 60)), s.id).toBe(true);
        const civil = actors.filter((a) => !a.government);
        if (civil.length >= 2) {
          expect(civil.some((a) => a.position < 0), s.id).toBe(true);
          expect(civil.some((a) => a.position > 0), s.id).toBe(true);
        }
      }
    expect(scenarios.flatMap((s) => s.actors).filter((a) => isGovernment(a.name)).map((a) => a.name)).toEqual(
      expect.arrayContaining(["Autoridad ambiental", "Autoridad de tránsito", "Organismo de competencia", "Catastro y servicios"]),
    );
    expect(isGovernment("Hogares urbanos")).toBe(false);
    expect(isGovernment("Alcaldía de San Isidro")).toBe(true);
  });
  it("la matriz poder × interés se califica con el perfil de la partida", () => {
    const g = createGameV2("movilidad", "guiado", "MAPA-1"),
      ok = act(g, { type: "actorMap", value: referenceActorMap(g) });
    expect(actorMapScore(ok)).toBe(100);
    // The fixed reference values of the scenario no longer give the right answer in every game.
    const fixed = Object.fromEntries(scenarioById("movilidad").actors.map((a) => [a.id, { power: a.power >= 60 ? "alto" : "bajo", interest: a.interest >= 60 ? "alto" : "bajo" }])) as ReturnType<typeof referenceActorMap>;
    const scores = Array.from({ length: 12 }, (_, i) => {
      const x = createGameV2("movilidad", "guiado", "MAPA-" + i);
      return actorMapScore(act(x, { type: "actorMap", value: fixed }));
    });
    expect(scores.some((v) => v < 100)).toBe(true);
  });
  it("las decisiones mueven la posición; el gobierno no se mueve; ignorar a un opositor cuesta más apoyo", () => {
    let g = createGameV2("agua", "guiado", "POS-1");
    const gov = gameActors(g).find((a) => a.government)!,
      civil = gameActors(g).find((a) => !a.government)!;
    g = act(g, { type: "actor", id: civil.id, choice: "consultar" });
    expect(gameActors(g).find((a) => a.id === civil.id)!.stance).toBe(Math.min(100, civil.position + 15));
    g = act(g, { type: "actor", id: gov.id, choice: "ignorar" });
    expect(gameActors(g).find((a) => a.id === gov.id)!.stance).toBe(0);
    // Same actor, same power: against the project vs. in favour.
    const base = createGameV2("agua", "guiado", "POS-2"),
      id = gameActors(base).find((a) => !a.government)!.id,
      withPosition = (position: number) => {
        const x = structuredClone(base);
        x.actorProfiles![id] = { ...x.actorProfiles![id], power: 80, position };
        return act(x, { type: "actor", id, choice: "ignorar" }).support;
      };
    expect(withPosition(-60)).toBeLessThan(withPosition(40));
  });
  it("un actor muy en contra exige ser escuchado antes del acuerdo; la oposición organizada se mide y tiene líder", () => {
    const g = createGameV2("agua", "guiado", "NEG-1"),
      id = gameActors(g).find((a) => !a.government)!.id;
    g.actorProfiles![id] = { ...g.actorProfiles![id], power: 85, position: -70 };
    g.studies.push("social");
    const rejected = act(g, { type: "negotiate", actorId: id, choice: "acuerdo" });
    expect(rejected.v2!.negotiations![id].status).toBe("abierto");
    expect(rejected.journal.at(-1)!.detail).toMatch(/muy en contra/);
    let heard = act(g, { type: "negotiate", actorId: id, choice: "escuchar" });
    heard = act(heard, { type: "negotiate", actorId: id, choice: "acuerdo" });
    expect(heard.v2!.negotiations![id].status).toBe("acuerdo");
    expect(gameActors(heard).find((a) => a.id === id)!.stance).toBe(-70 + 5 + 25);
    expect(opposition(g)).toBeGreaterThan(opposition(heard));
    expect(leadingOpponent(g)!.id).toBe(id);
  });
  it("las partidas guardadas antes de 2.9 conservan los perfiles de referencia; un perfil inválido se descarta", () => {
    const g = createGameV2("agua", "guiado", "OLD");
    delete g.actorProfiles;
    expect(gameActors(g).map((a) => a.power)).toEqual(scenarioById("agua").actors.map((a) => a.power));
    expect(opposition(g)).toBe(0);
    const bad = createGameV2("agua", "guiado", "BAD");
    (bad.actorProfiles as Record<string, unknown>).actor0 = { power: "mucho" };
    const data = decode(JSON.stringify({ version: 1, active: bad, history: [] }));
    expect(data.active!.actorProfiles).toBeUndefined();
    expect(decode(JSON.stringify({ version: 1, active: createGameV2("agua"), history: [] })).active!.actorProfiles).toBeDefined();
  });
  it("los proyectos propios también sortean el perfil de sus actores", () => {
    const p = sampleProject(),
      c = createMission(upsertProject(emptyStore(), p), p, { difficulty: "guiado", mode: "aprendizaje", duration: "completa" });
    if (!c.ok) throw new Error(JSON.stringify(c.errors));
    const g = startGeneratedGame(c.mission.id, "PROPIO-1");
    expect(Object.keys(g.actorProfiles!)).toHaveLength(scenarioById(g.scenarioId).actors.length);
  });
  it("en la ejecución, los conflictos sociales los encabeza el actor poderoso en contra; los eventos positivos no", () => {
    let conflicts = 0;
    for (let i = 0; i < 14; i++) {
      let g = prepareV2("agua", createGameV2("agua", "guiado", "EV-" + i));
      g = commitV22(g);
      for (let k = 0; k < 40 && !g.outcome; k++) {
        const e = g.pendingEvent;
        if (e) {
          if (e.category === "social" && e.benefit < 0) {
            conflicts++;
            expect(e.description).toContain(leadingOpponent(g)!.name);
          } else expect(e.description).not.toMatch(/encabeza el reclamo/);
          g = act(g, { type: "respond", choice: "mitigar" });
        } else g = act(g, { type: "advance" });
      }
    }
    expect(conflicts).toBeGreaterThan(0);
  }, 30000);
});

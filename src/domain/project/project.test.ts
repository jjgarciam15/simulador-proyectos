import { afterEach, describe, expect, it } from "vitest";
import { scenarios, scenarioById, isGeneratedScenario } from "../../data/scenarios";
import { missionImpacts } from "../../data/impacts";
import { act } from "../engine";
import { validateMission } from "../missions";
import { questionsV2 } from "../questionsV2";
import { decode } from "../storage";
import { impactCards } from "../valuation";
import { missionFlowCase } from "../missionFlow";
import type { GameState } from "../types";
import { commitV22, prepareV2 } from "../../testSupport/gameFixture";
import { sampleProject } from "../../testSupport/projectFixture";
import { generateActivities, generateMission, phaseAvailability } from "./generator";
import { duplicateProject, emptyProject, fromScenario, officialProject } from "./project";
import { exportProject, importPortable, parseProject } from "./schema";
import {
  activateStore,
  createMission,
  decodeStore,
  deleteProject,
  emptyStore,
  playerDataKeys,
  resetPlayerData,
  startGeneratedGame,
  upsertProject,
  verifyZeroState,
} from "./store";
import { canGenerate, completeness, looksLikeSolution, reviewProject, validateProject } from "./validation";
import type { MissionConfig } from "./types";

const config: MissionConfig = { difficulty: "guiado", mode: "aprendizaje", duration: "completa" };
const finish = (g: GameState) => {
  g = commitV22(g);
  for (let i = 0; i < 100 && !g.outcome; i++)
    try {
      g = act(g, g.pendingEvent ? { type: "respond", choice: "mitigar" } : { type: "advance" }, false);
    } catch {
      g = act(g, !g.loans.some((l) => l.type === "credito") ? { type: "finance", source: "credito" } : { type: "abandon" }, false);
    }
  return g;
};
class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null;
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
  setItem(k: string, v: string) {
    this.data.set(k, String(v));
  }
}
afterEach(() => activateStore(emptyStore()));

describe("NormalizedProject y validación (Project Builder)", () => {
  it("un proyecto vacío no se puede generar y su completitud es 0 %", () => {
    const p = emptyProject();
    const issues = validateProject(p);
    expect(canGenerate(p)).toBe(false);
    expect(issues.filter((i) => i.level === "error").map((i) => i.path)).toEqual(expect.arrayContaining(["title", "problem", "causes", "problemEffects", "generalObjective", "alternatives"]));
    expect(completeness(p).percent).toBe(0);
    expect(reviewProject(p).ready).toBe(false);
  });
  it("un proyecto parcial distingue errores (bloquean) de advertencias (permiten continuar)", () => {
    const p = sampleProject();
    p.alternatives[1].om = null;
    p.alternatives[0].residual = null;
    const issues = validateProject(p);
    expect(issues.some((i) => i.level === "error" && i.path === "alternatives.alt2.om")).toBe(true);
    expect(issues.some((i) => i.level === "advertencia" && i.message.includes("no definiste valor residual"))).toBe(true);
    expect(canGenerate(p)).toBe(false);
    const pct = completeness(p).percent;
    expect(pct).toBeGreaterThan(50);
    expect(pct).toBeLessThan(100);
  });
  it("un proyecto completo con varias alternativas se puede generar y está listo para simular", () => {
    const p = sampleProject();
    expect(validateProject(p).filter((i) => i.level === "error")).toEqual([]);
    expect(completeness(p).percent).toBeGreaterThanOrEqual(90);
    expect(reviewProject(p).ready).toBe(true);
  });
  it("la asistencia académica advierte sin corregir: problema formulado como solución, efecto como causa y objetivo sin causa", () => {
    expect(looksLikeSolution("Comprar buses")).toBe(true);
    expect(looksLikeSolution("Falta de una planta de tratamiento")).toBe(true);
    expect(looksLikeSolution("Baja continuidad del servicio de agua")).toBe(false);
    const p = sampleProject();
    p.problem = "Comprar buses";
    p.causes[0].text = "Pérdida de productividad de los hogares";
    p.specificObjectives[1].causeId = undefined;
    const w = validateProject(p).filter((i) => i.level === "advertencia").map((i) => i.message);
    expect(w).toContain("Este problema parece formulado como una solución. Intenta expresar primero la situación negativa que quieres resolver.");
    expect(w.some((m) => m.includes("parece corresponder más a un efecto"))).toBe(true);
    expect(w).toContain("El objetivo específico 2 parece no responder a ninguna causa identificada.");
    expect(p.problem).toBe("Comprar buses");
  });
  it("detecta horizonte inválido y flujo imposible", () => {
    const p = sampleProject();
    p.horizon = 0;
    p.financial.budget = 1000;
    const errs = validateProject(p).filter((i) => i.level === "error").map((i) => i.path);
    expect(errs).toEqual(expect.arrayContaining(["horizon", "financial.budget"]));
  });
});

describe("MissionGenerator: una sola máquina para las tres fuentes", () => {
  it("genera una misión válida para el motor existente, con fases y supuestos explicados", () => {
    const res = generateMission(sampleProject(), config, "gen-test-1");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const m = res.mission;
    expect(validateMission(m.scenario)).toEqual([]);
    expect(m.scenario.nodes.filter((n) => n.valid)).toHaveLength(5);
    expect(m.scenario.alternatives.map((a) => a.capex)).toEqual([9000, 5200]);
    expect(m.scenario.alternatives[1].causes).toEqual(["n2"]);
    expect(m.phases.find((f) => f.label === "Valoración")!.status).toBe("si");
    expect(m.assumptions.some((a) => a.includes("dos causas y dos efectos"))).toBe(true);
    // double counting: only the declaring impact carries the overlap flag
    expect(m.impacts.find((c) => c.id === "i4")!.valuation!.overlap).toBeTruthy();
    expect(m.impacts.find((c) => c.id === "i3")!.valuation!.overlap).toBeUndefined();
  });
  it("no genera con errores y no inventa datos: los valores ausentes quedan como supuestos documentados", () => {
    expect(generateMission(emptyProject(), config, "gen-x").ok).toBe(false);
    const p = sampleProject();
    p.financial.budget = null;
    p.population.total = null;
    const res = generateMission(p, config, "gen-test-2");
    expect(res.ok && res.mission.assumptions.some((a) => a.startsWith("Presupuesto disponible: 1,3 × la mayor inversión"))).toBe(true);
    expect(res.ok && res.mission.scenario.budget).toBe(11700);
  });
  it("las actividades generadas son auditables y marcan su estado de respuesta", () => {
    const acts = generateActivities(sampleProject());
    expect(acts.length).toBeGreaterThanOrEqual(8);
    for (const a of acts) {
      expect(a.source.length).toBeGreaterThan(0);
      expect(a.options.length).toBe(5);
      expect(a.validAnswers.every((v) => a.options.some((o) => o.id === v))).toBe(true);
      expect(a.status).toBe("plausible"); // proyecto de estudiante: respuesta del autor, no oficial
    }
    const creator = { ...sampleProject(), metadata: { ...sampleProject().metadata, profile: "creador" as const } };
    expect(generateActivities(creator).every((a) => a.status === "esperada")).toBe(true);
    const imported = { ...sampleProject(), source: { type: "imported_pdf" as const }, evidence: { problem: { confidence: "baja" as const, ref: { page: 2 } } } };
    expect(generateActivities(imported).find((a) => a.id === "gen-problema")!.status).toBe("requiere_revision");
  });
  it("el editor de actividades del creador sobrescribe pregunta, respuestas y puntos", () => {
    const p = sampleProject();
    p.creator = { activities: { "gen-inversion": { question: "¿Cuál cuesta más?", points: 9 } } };
    const a = generateActivities(p).find((x) => x.id === "gen-inversion")!;
    expect(a.question).toBe("¿Cuál cuesta más?");
    expect(a.score).toBe(9);
    expect(a.status).toBe("esperada");
  });
  it("una misión oficial convertida a NormalizedProject también pasa por el mismo generador", () => {
    for (const s of scenarios) {
      const p = fromScenario(s);
      expect(validateProject(p).filter((i) => i.level === "error")).toEqual([]);
      const res = generateMission(p, config, "gen-official-" + s.id);
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.mission.scenario.alternatives.map((a) => a.capex)).toEqual(s.alternatives.map((a) => a.capex));
    }
    expect(officialProject("agua").source).toEqual({ type: "official", officialId: "agua" });
  });
  it("la selección de fases refleja los datos disponibles", () => {
    const p = sampleProject();
    p.impacts = [];
    p.regulation.failure = null;
    const f = phaseAvailability(p);
    expect(f.find((x) => x.label === "Valoración")!.status).toBe("no");
    expect(f.find((x) => x.label === "Regulación")!.status).toBe("parcial");
    const quick = generateMission(sampleProject(), { ...config, duration: "rapida" }, "gen-q");
    expect(quick.ok && quick.mission.profile.modules).toEqual(["valuation"]);
  });
});

describe("Partida generada con el motor de las misiones oficiales", () => {
  it("se juega completa: puzzles, flujos, puntuación y resultado", () => {
    const store = upsertProject(emptyStore(), sampleProject());
    const created = createMission(store, sampleProject(), config);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const id = created.mission.id;
    expect(isGeneratedScenario(id)).toBe(true);
    expect(scenarioById(id).title).toBe("Parque lineal del río Claro");
    const start = startGeneratedGame(id, "GEN-1");
    expect(start.assumptions.discount).toBe(0.12);
    expect(start.assumptions.life).toBe(15);
    expect(questionsV2(start).some((q) => q.id === "gen-problema")).toBe(true);
    expect(impactCards(start).some((c) => c.id === "i3")).toBe(true);
    const g = prepareV2(id, start, 0);
    expect(g.phase).toBe(5);
    expect(missionFlowCase(g)!.horizon).toBe(15);
    const done = finish(g);
    expect(done.outcome).toBeTruthy();
    expect(done.outcome!.assessment!.dimensions.length).toBe(12);
    expect(Number.isFinite(done.outcome!.score)).toBe(true);
  });
  it("el modo exploración permite reformular sin costo", () => {
    const created = createMission(emptyStore(), sampleProject(), { ...config, mode: "exploracion" });
    if (!created.ok) throw new Error("no generada");
    const g = startGeneratedGame(created.mission.id, "GEN-2");
    expect(g.v2!.v22!.exploration).toBe(true);
    expect(g.v2!.v22!.mode).toBe("aprendizaje");
  });
});

describe("Persistencia, formato portable y reset", () => {
  it("guardar borrador, cerrar y continuar conserva el proyecto; una edición posterior no cambia la misión generada", () => {
    const storage = new MemoryStorage();
    let store = upsertProject(emptyStore(), { ...sampleProject(), metadata: { ...sampleProject().metadata, status: "borrador" } });
    const created = createMission(store, sampleProject(), config);
    if (!created.ok) throw new Error("no generada");
    store = created.store;
    storage.setItem("proyecta-projects-v1", JSON.stringify(store));
    activateStore(emptyStore());
    expect(isGeneratedScenario(created.mission.id)).toBe(false);
    const reopened = decodeStore(storage.getItem("proyecta-projects-v1"));
    expect(reopened.projects[0].title).toBe("Parque lineal del río Claro");
    expect(activateStore(reopened)).toEqual([]);
    expect(scenarioById(created.mission.id).alternatives).toHaveLength(2);
    const edited = upsertProject(reopened, { ...reopened.projects[0], title: "Otro nombre" });
    activateStore(edited);
    expect(scenarioById(created.mission.id).title).toBe("Parque lineal del río Claro");
  });
  it("el formato portable solo acepta datos válidos y versionados", () => {
    const text = exportProject(sampleProject());
    expect(importPortable(text).title).toBe("Parque lineal del río Claro");
    expect(() => importPortable("{}")).toThrow(/no es un proyecto/);
    expect(() => importPortable("function(){}")).toThrow(/JSON/);
    const hostile = JSON.parse(text);
    hostile.project.title = { toString: "alert(1)" };
    hostile.project.__proto__polluted = true;
    hostile.project.alternatives[0].investment = "9000; DROP";
    const parsed = importPortable(JSON.stringify(hostile));
    expect(parsed.title).toBe("");
    expect(parsed.alternatives[0].investment).toBeNull();
    expect(() => parseProject({ ...JSON.parse(text).project, schemaVersion: 99 })).toThrow(/más nueva/);
    const v0 = { ...JSON.parse(text).project };
    delete v0.schemaVersion;
    expect(parseProject(v0).schemaVersion).toBe(1);
  });
  it("duplicar crea una variante editable sin tocar el original", () => {
    const a = sampleProject(),
      b = duplicateProject(a);
    expect(b.id).not.toBe(a.id);
    expect(b.source.duplicatedFrom).toBe(a.id);
    b.alternatives[0].investment = 1;
    expect(a.alternatives[0].investment).toBe(9000);
  });
  it("eliminar un proyecto elimina sus misiones y las partidas huérfanas se descartan al cargar", () => {
    const created = createMission(emptyStore(), sampleProject(), config);
    if (!created.ok) throw new Error("no generada");
    const g = startGeneratedGame(created.mission.id, "GEN-3");
    const save = JSON.stringify({ version: 1, active: g, history: [g] });
    const { removedMissions } = deleteProject(created.store, sampleProject().id);
    expect(removedMissions).toEqual([created.mission.id]);
    const data = decode(save);
    expect(data.active).toBeNull();
    expect(data.history).toEqual([]);
  });
  it("RESTABLECER PARTIDAS borra datos del jugador y conserva misiones oficiales y configuración", () => {
    const storage = new MemoryStorage();
    const created = createMission(emptyStore(), sampleProject(), config);
    if (!created.ok) throw new Error("no generada");
    storage.setItem("proyecta-v1", JSON.stringify({ version: 1, active: null, history: [] }));
    storage.setItem("proyecta-v1:unreadable", "x");
    storage.setItem("proyecta-projects-v1", JSON.stringify(created.store));
    storage.setItem("proyecta-exam2-v1", "[]");
    storage.setItem("proyecta-draft-abc", "{}");
    storage.setItem("proyecta-experience-v1", '{"sound":true}');
    storage.setItem("otra-app", "1");
    expect(playerDataKeys(storage).length).toBe(5);
    resetPlayerData(storage);
    expect(verifyZeroState(storage)).toEqual({ leftovers: [], generated: 0 });
    expect(storage.getItem("proyecta-experience-v1")).toBe('{"sound":true}');
    expect(storage.getItem("otra-app")).toBe("1");
    expect(isGeneratedScenario(created.mission.id)).toBe(false);
    expect(scenarios).toHaveLength(9);
    expect(missionImpacts.agua.length).toBeGreaterThan(3);
    expect(scenarioById("agua").title).toBe("Agua para todos");
  });
});

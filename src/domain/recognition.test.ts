import { describe, it, expect } from "vitest";
import { createGame } from "./engine";
import {
  campaignSummary,
  updateCampaign,
  projectMedals,
  projectReport,
  reportIndicators,
  performanceLabel,
} from "./recognition";
import { scenarios } from "../data/scenarios";
import { decode } from "./storage";
import type { GameState, Outcome } from "./types";
function closed(
  id = "agua",
  score = 70,
  status: Outcome["status"] = "completado",
): GameState {
  const g = createGame(id);
  g.phase = 7;
  g.alternative = "a1";
  g.outcome = {
    status,
    score,
    dimensions: [{ name: "Prueba", value: score, weight: 1 }],
    financial: -100,
    social: 200,
    coverage: 0.7,
    expectedFinancial: 0,
    expectedSocial: 300,
    opportunity: 100,
    expectedOpportunity: 50,
    best: "Alternativa",
    alternatives: [],
    wasted: 30,
    lessons: ["Revisar la demanda."],
  };
  return g;
}
describe("Premios e informes", () => {
  it("un cierre sin servicio no presenta las metas como resultados y conserva las unidades del modelo", () => {
    const g = closed("agua", 20, "abandonado");
    g.outcome!.coverage = 0;
    g.indicators = [
      {
        name: "Acceso",
        kind: "Resultado",
        baseline: 0,
        target: 99999,
        unit: "hogares",
        frequency: "Anual",
        source: "Registro",
        owner: "Equipo",
        measure: "coverage",
      },
      {
        name: "Beneficio",
        kind: "Resultado",
        baseline: 0,
        target: 500,
        unit: "M COP",
        frequency: "Anual",
        source: "Modelo",
        owner: "Equipo",
        measure: "benefit",
      },
    ];
    const rows = reportIndicators(g);
    expect(rows[0].observed).toBe(0);
    expect(rows[0].observedUnit).toBe("personas");
    expect(rows[0].target).toBe(99999);
    expect(rows[1].observed).toBe(0);
    expect(rows[1].observedUnit).toBe("M COP / año");
  });
  it("no entrega medallas ni informe antes del cierre", () => {
    const g = createGame("agua");
    expect(projectMedals(g)).toEqual([]);
    expect(() => projectReport(g)).toThrow();
  });
  it("las medallas exigen evidencias y no un puntaje elevado por sí solo", () => {
    const g = closed("agua", 95);
    expect(projectMedals(g).map((m) => m.id)).toEqual(["service"]);
    expect(
      projectMedals({ ...g, outcome: { ...g.outcome!, status: "abandonado" } }),
    ).toEqual([]);
  });
  it("repeticiones no completan varios distritos y preserva el mejor resultado", () => {
    const a = closed("agua", 70),
      b = closed("agua", 40);
    const c = campaignSummary([a, b]);
    expect(c.completed).toBe(1);
    expect(c.records.agua.score).toBe(70);
    expect(c.finished).toBe(false);
    expect(c.score).toBeNull();
  });
  it("el premio final exige todas las misiones y usa su promedio", () => {
    const all = scenarios.map((s, i) => closed(s.id, 60 + i));
    expect(campaignSummary(all).score).toBe(64);
    expect(campaignSummary(all).finished).toBe(true);
    all[0].outcome!.status = "insolvencia";
    expect(campaignSummary(all).finished).toBe(false);
  });
  it("conserva el premio aunque ya no esté el informe en el historial", () => {
    const g = closed(),
      campaign = updateCampaign({}, g);
    const restored = decode(
      JSON.stringify({ version: 1, active: null, history: [], campaign }),
    );
    expect(campaignSummary([], restored.campaign).records.agua.score).toBe(70);
  });
  it("exporta texto del jugador escapado sin modificar el resultado", () => {
    const g = closed();
    g.justification = '<script>alert("x")</script>';
    const original = JSON.stringify(g),
      html = projectReport(g);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("70/100");
    expect(html).toContain("VPN social");
    expect(JSON.stringify(g)).toBe(original);
  });
  it("los límites de bandas son inequívocos", () => {
    expect(performanceLabel(49)).toBe("Necesita revisión");
    expect(performanceLabel(50)).toBe("En desarrollo");
    expect(performanceLabel(70)).toBe("Desempeño sólido");
    expect(performanceLabel(85)).toBe("Desempeño destacado");
  });
});

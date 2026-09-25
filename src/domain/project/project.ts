import { scenarioById } from "../../data/scenarios";
import { missionImpacts } from "../../data/impacts";
import { directSDGs } from "../../data/relationships";
import type { Scenario } from "../types";
import {
  projectSchemaVersion,
  type FailureType,
  type NormalizedProject,
  type ProjectAlternative,
  type ProjectProfile,
  type RiskLevel,
} from "./types";

let counter = 0;
/** Local, collision-resistant id (no external service). */
export function uid(prefix: string) {
  counter = (counter + 1) % 1e6;
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}${counter.toString(36)}${rnd}`;
}
export function emptyAlternative(id = uid("alt")): ProjectAlternative {
  return {
    id,
    name: "",
    description: "",
    investment: null,
    om: null,
    revenue: null,
    socialBenefit: null,
    months: null,
    life: null,
    residual: null,
    capacity: "",
    coverage: null,
    risk: null,
    environment: null,
    tradeoff: "",
    causeIds: [],
  };
}
export function emptyProject(profile: ProjectProfile = "estudiante", now = new Date().toISOString()): NormalizedProject {
  return {
    schemaVersion: projectSchemaVersion,
    id: uid("proj"),
    metadata: { createdAt: now, updatedAt: now, profile, status: "borrador", revision: 0 },
    source: { type: "manual" },
    title: "",
    description: "",
    sector: "",
    territory: "",
    projectType: "publico",
    horizon: null,
    problem: "",
    causes: [],
    problemEffects: [],
    actors: [],
    population: { affected: null, target: null, currentSupply: null, total: null, unit: "personas", characteristics: "" },
    generalObjective: "",
    specificObjectives: [],
    ends: [],
    alternatives: [],
    valueChain: { inputs: [], activities: [], products: [], outcomes: [], impacts: [] },
    costs: [],
    benefits: [],
    impacts: [],
    financial: { rate: null, budget: null, deadline: null },
    economic: { socialRate: null, rpc: {}, adjustments: "" },
    assumptions: [],
    risks: [],
    regulation: { failure: null, externalities: "", existing: "", tariffs: "", subsidies: "", competition: "", restrictions: "", intervention: "" },
    sdgs: { suggested: [], playerIdentifies: true },
    evidence: {},
  };
}
const level = (v: number): RiskLevel => (v >= 36 ? "alta" : v >= 29 ? "media" : "baja");
/**
 * Official mission → NormalizedProject. Official missions keep playing through their own data;
 * this adapter lets them appear in «Mis proyectos» and be duplicated as an editable template.
 */
export function fromScenario(s: Scenario, now = new Date().toISOString()): NormalizedProject {
  const node = (id: string) => s.nodes.find((n) => n.id === id)!;
  const p = emptyProject("estudiante", now);
  const impacts = missionImpacts[s.id] ?? [];
  return {
    ...p,
    id: "official-" + s.id,
    metadata: { ...p.metadata, status: "listo" },
    source: { type: "official", officialId: s.id },
    title: s.title,
    description: s.brief,
    sector: s.sector,
    territory: s.territory,
    projectType: s.role,
    horizon: s.alternatives[0]?.life ?? null,
    problem: node("n0").label,
    causes: [
      { id: "c1", text: node("n1").label, level: "directa" },
      { id: "c2", text: node("n2").label, level: "indirecta" },
    ],
    problemEffects: [
      { id: "e1", text: node("n3").label, level: "directa" },
      { id: "e2", text: node("n4").label, level: "indirecta" },
    ],
    actors: s.actors.map((a) => ({ id: a.id, name: a.name, interest: a.affected, power: a.power, position: a.position, influence: a.contribution })),
    population: { affected: s.affected, target: s.affected, currentSupply: s.supply, total: s.population, unit: s.unit, characteristics: "" },
    generalObjective: node("n0").objective,
    specificObjectives: [
      { id: "o1", text: node("n1").objective, causeId: "c1" },
      { id: "o2", text: node("n2").objective, causeId: "c2" },
    ],
    ends: [
      { effectId: "e1", text: node("n3").objective },
      { effectId: "e2", text: node("n4").objective },
    ],
    alternatives: s.alternatives.map((a) => ({
      ...emptyAlternative(a.id),
      name: a.name,
      description: a.description,
      investment: a.capex,
      om: a.opex,
      revenue: a.revenue,
      socialBenefit: a.social,
      months: a.months,
      life: a.life,
      coverage: a.coverage,
      risk: level(a.risk),
      environment: a.environment,
      tradeoff: a.tradeoff,
      causeIds: a.causes.map((c) => (c === "n1" ? "c1" : "c2")),
    })),
    impacts: impacts
      .filter((c) => ["efecto", "impactoPositivo", "impactoNegativo"].includes(c.kind))
      .map((c) => ({
        id: c.id,
        text: c.text,
        kind: c.kind === "efecto" ? "efecto" : "impacto",
        direction: c.kind === "impactoNegativo" ? "negativo" : "positivo",
        group: c.group ?? "",
        magnitude: c.valuation ? `${c.valuation.perCovered} ${c.valuation.unit} por persona atendida al año` : "",
        duration: "Vida útil del proyecto",
        type: c.valuation?.type,
        data: c.valuation?.data,
        overlapWith: c.valuation?.overlap ? impacts.find((o) => o.id !== c.id && !o.valuation?.overlap && o.valuation)?.id : undefined,
      })),
    financial: { rate: null, budget: s.budget, deadline: s.deadline },
    economic: { socialRate: 0.09, rpc: {}, adjustments: "" },
    risks: s.risks.map((r) => ({ id: r.id, name: r.name, probability: level(r.probability), impact: level(r.impact * 0.45), mitigation: r.mitigation })),
    regulation: { ...p.regulation, failure: s.failure as FailureType },
    sdgs: { suggested: [...new Set([...(directSDGs[s.id] ?? []), ...s.sdgs])], playerIdentifies: true },
  };
}
export const officialProject = (id: string) => fromScenario(scenarioById(id));

/** Copy as a new editable manual project (variants of a case). */
export function duplicateProject(p: NormalizedProject, now = new Date().toISOString()): NormalizedProject {
  const copy: NormalizedProject = structuredClone(p);
  copy.id = uid("proj");
  copy.title = (p.title || "Proyecto") + " (copia)";
  copy.metadata = { ...copy.metadata, createdAt: now, updatedAt: now, status: "borrador", revision: 0 };
  copy.source = { type: "manual", duplicatedFrom: p.id };
  return copy;
}
/** Records an edit: new revision and timestamp. Pure. */
export function touch(p: NormalizedProject, now = new Date().toISOString()): NormalizedProject {
  return { ...p, metadata: { ...p.metadata, updatedAt: now, revision: p.metadata.revision + 1 } };
}
export const notIdentified = "No identificada";

import {
  projectSchemaVersion,
  type BenefitKind,
  type CostCategory,
  type Evidence,
  type FailureType,
  type ImpactTypeId,
  type NormalizedProject,
  type ProjectSourceType,
  type RiskLevel,
  type AlternativeTerritory,
} from "./types";
import { emptyProject } from "./project";

/**
 * Schema validation and migrations. Every stored or imported project passes through `parseProject`:
 * unknown keys are dropped, types are enforced and only data (never code) is accepted.
 */
type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, max = 4000) => (typeof v === "string" ? v.slice(0, max) : "");
const optStr = (v: unknown, max = 4000) => (typeof v === "string" ? v.slice(0, max) : undefined);
const nOrNull = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const arr = (v: unknown, max = 200) => (Array.isArray(v) ? v.slice(0, max) : []);
const oneOf = <T extends string>(v: unknown, list: readonly T[], fallback: T): T => (list.includes(v as T) ? (v as T) : fallback);
const oneOfOrNull = <T extends string>(v: unknown, list: readonly T[]): T | null => (list.includes(v as T) ? (v as T) : null);
const ids = (v: unknown) => arr(v).filter((x): x is string => typeof x === "string").map((x) => x.slice(0, 80));
const texts = (v: unknown) => arr(v).filter((x): x is string => typeof x === "string").map((x) => x.slice(0, 300));
const risk = ["baja", "media", "alta"] as const;
const sourceTypes: readonly ProjectSourceType[] = ["official", "imported_pdf", "imported_excel", "manual"];
const failures: readonly FailureType[] = ["Externalidades", "Monopolio natural", "Poder de mercado", "Información asimétrica", "Bienes públicos", "Ninguna falla suficiente"];
const impactTypes: readonly ImpactTypeId[] = ["salud", "tiempo", "productividad", "propiedad", "recreacion", "ahorro", "ambiente", "emisiones", "variedad"];
const costCats: readonly CostCategory[] = ["inversion", "operacion", "mantenimiento", "otros"];
const benefitKinds: readonly BenefitKind[] = ["ingreso", "ahorro", "beneficioEconomico", "impactoValorado"];

/** Migrations by schema version. v0 (no schemaVersion) = early drafts without metadata. */
const migrations: Record<number, (raw: Raw) => Raw> = {
  0: (raw) => ({ ...raw, schemaVersion: 1, metadata: isObj(raw.metadata) ? raw.metadata : {}, evidence: isObj(raw.evidence) ? raw.evidence : {} }),
};
export function migrateProject(raw: Raw): Raw {
  let current = raw;
  let version = typeof current.schemaVersion === "number" ? current.schemaVersion : 0;
  if (version > projectSchemaVersion) throw new Error("El proyecto fue creado con una versión más nueva del simulador.");
  while (version < projectSchemaVersion) {
    const step = migrations[version];
    if (!step) throw new Error("No existe migración para la versión " + version + ".");
    current = step(current);
    version = current.schemaVersion as number;
  }
  return current;
}

export function parseProject(input: unknown): NormalizedProject {
  if (!isObj(input)) throw new Error("El proyecto no tiene el formato esperado.");
  const raw = migrateProject(input);
  const base = emptyProject();
  const meta = isObj(raw.metadata) ? raw.metadata : {},
    source = isObj(raw.source) ? raw.source : {},
    pop = isObj(raw.population) ? raw.population : {},
    fin = isObj(raw.financial) ? raw.financial : {},
    eco = isObj(raw.economic) ? raw.economic : {},
    reg = isObj(raw.regulation) ? raw.regulation : {},
    sdgs = isObj(raw.sdgs) ? raw.sdgs : {},
    chain = isObj(raw.valueChain) ? raw.valueChain : {};
  const id = str(raw.id, 120);
  if (!id) throw new Error("El proyecto no tiene identificador.");
  const tree = (v: unknown) =>
    arr(v)
      .filter(isObj)
      .map((x) => ({ id: str(x.id, 80), text: str(x.text, 600), level: oneOf(x.level, ["directa", "indirecta"] as const, "directa") }))
      .filter((x) => x.id);
  const evidence: Record<string, Evidence> = {};
  if (isObj(raw.evidence))
    for (const [k, v] of Object.entries(raw.evidence).slice(0, 2000)) {
      if (!isObj(v)) continue;
      const ref = isObj(v.ref) ? v.ref : undefined;
      evidence[k.slice(0, 200)] = {
        confidence: oneOf(v.confidence, ["alta", "media", "baja"] as const, "baja"),
        reviewed: v.reviewed === true,
        ref: ref
          ? { page: nOrNull(ref.page) ?? undefined, sheet: optStr(ref.sheet, 120), cell: optStr(ref.cell, 40), section: optStr(ref.section, 200), excerpt: optStr(ref.excerpt, 400) }
          : undefined,
      };
    }
  const creator = isObj(raw.creator) ? raw.creator : undefined;
  const project: NormalizedProject = {
    schemaVersion: projectSchemaVersion,
    id,
    metadata: {
      createdAt: str(meta.createdAt, 40) || base.metadata.createdAt,
      updatedAt: str(meta.updatedAt, 40) || base.metadata.updatedAt,
      profile: oneOf(meta.profile, ["estudiante", "creador"] as const, "estudiante"),
      status: oneOf(meta.status, ["borrador", "listo"] as const, "borrador"),
      revision: Math.max(0, Math.round(nOrNull(meta.revision) ?? 0)),
      importReviewed: meta.importReviewed === true,
    },
    source: {
      type: oneOf(source.type, sourceTypes, "manual"),
      fileName: optStr(source.fileName, 260),
      officialId: optStr(source.officialId, 80),
      importedAt: optStr(source.importedAt, 40),
      duplicatedFrom: optStr(source.duplicatedFrom, 120),
    },
    title: str(raw.title, 200),
    description: str(raw.description, 3000),
    sector: str(raw.sector, 200),
    territory: str(raw.territory, 200),
    projectType: oneOf(raw.projectType, ["publico", "privado"] as const, "publico"),
    horizon: nOrNull(raw.horizon),
    problem: str(raw.problem, 600),
    causes: tree(raw.causes),
    problemEffects: tree(raw.problemEffects),
    actors: arr(raw.actors)
      .filter(isObj)
      .map((a) => ({ id: str(a.id, 80), name: str(a.name, 200), interest: optStr(a.interest, 400), power: nOrNull(a.power), position: nOrNull(a.position), influence: optStr(a.influence, 400) }))
      .filter((a) => a.id),
    population: {
      affected: nOrNull(pop.affected),
      target: nOrNull(pop.target),
      currentSupply: nOrNull(pop.currentSupply),
      total: nOrNull(pop.total),
      unit: str(pop.unit, 80) || "personas",
      characteristics: str(pop.characteristics, 1000),
    },
    generalObjective: str(raw.generalObjective, 600),
    specificObjectives: arr(raw.specificObjectives)
      .filter(isObj)
      .map((o) => ({ id: str(o.id, 80), text: str(o.text, 600), causeId: optStr(o.causeId, 80) }))
      .filter((o) => o.id),
    ends: arr(raw.ends)
      .filter(isObj)
      .map((e) => ({ effectId: str(e.effectId, 80), text: str(e.text, 600) }))
      .filter((e) => e.effectId),
    alternatives: arr(raw.alternatives, 8)
      .filter(isObj)
      .map((a) => ({
        id: str(a.id, 80),
        name: str(a.name, 200),
        description: str(a.description, 1000),
        investment: nOrNull(a.investment),
        om: nOrNull(a.om),
        revenue: nOrNull(a.revenue),
        socialBenefit: nOrNull(a.socialBenefit),
        months: nOrNull(a.months),
        life: nOrNull(a.life),
        residual: nOrNull(a.residual),
        capacity: str(a.capacity, 200),
        coverage: nOrNull(a.coverage),
        risk: oneOfOrNull(a.risk, risk) as RiskLevel | null,
        environment: nOrNull(a.environment),
        tradeoff: str(a.tradeoff, 600),
        causeIds: ids(a.causeIds),
        ...(isObj(a.territory)
          ? {
              territory: {
                soil: oneOfOrNull(a.territory.soil, ["urbano", "expansion", "rural", "suburbano", "proteccion"]) as AlternativeTerritory["soil"],
                plots: nOrNull(a.territory.plots) === null ? null : Math.max(0, Math.min(500, Math.round(nOrNull(a.territory.plots)!))),
                generator: oneOfOrNull(a.territory.generator, ["ninguno", "expansion", "uso", "aprovechamiento", "obra"]) as AlternativeTerritory["generator"],
                site: str(a.territory.site, 400),
              },
            }
          : {}),
      }))
      .filter((a) => a.id),
    valueChain: {
      inputs: texts(chain.inputs),
      activities: texts(chain.activities),
      products: texts(chain.products),
      outcomes: texts(chain.outcomes),
      impacts: texts(chain.impacts),
    },
    costs: arr(raw.costs)
      .filter(isObj)
      .map((c) => ({ id: str(c.id, 80), label: str(c.label, 300), category: oneOf(c.category, costCats, "otros"), amount: nOrNull(c.amount), alternativeId: optStr(c.alternativeId, 80) }))
      .filter((c) => c.id),
    benefits: arr(raw.benefits)
      .filter(isObj)
      .map((b) => ({ id: str(b.id, 80), label: str(b.label, 300), kind: oneOf(b.kind, benefitKinds, "ingreso"), amount: nOrNull(b.amount) }))
      .filter((b) => b.id),
    impacts: arr(raw.impacts)
      .filter(isObj)
      .map((i) => ({
        id: str(i.id, 80),
        text: str(i.text, 600),
        kind: oneOf(i.kind, ["efecto", "impacto"] as const, "impacto"),
        direction: oneOf(i.direction, ["positivo", "negativo"] as const, "positivo"),
        group: str(i.group, 120),
        magnitude: str(i.magnitude, 300),
        duration: str(i.duration, 200),
        type: oneOfOrNull(i.type, impactTypes) ?? undefined,
        method: optStr(i.method, 40),
        annualValue: nOrNull(i.annualValue),
        data: optStr(i.data, 600),
        unit: optStr(i.unit, 80),
        perPerson: nOrNull(i.perPerson),
        overlapWith: optStr(i.overlapWith, 80),
      }))
      .filter((i) => i.id),
    financial: { rate: nOrNull(fin.rate), budget: nOrNull(fin.budget), deadline: nOrNull(fin.deadline) },
    economic: {
      socialRate: nOrNull(eco.socialRate),
      rpc: Object.fromEntries(Object.entries(isObj(eco.rpc) ? eco.rpc : {}).filter(([, v]) => typeof v === "number" && Number.isFinite(v)).slice(0, 40)) as Record<string, number>,
      adjustments: str(eco.adjustments, 1000),
    },
    assumptions: arr(raw.assumptions)
      .filter(isObj)
      .map((a) => ({ id: str(a.id, 80), label: str(a.label, 200), value: str(a.value, 300) }))
      .filter((a) => a.id),
    risks: arr(raw.risks)
      .filter(isObj)
      .map((r) => ({ id: str(r.id, 80), name: str(r.name, 300), probability: oneOfOrNull(r.probability, risk), impact: oneOfOrNull(r.impact, risk), mitigation: str(r.mitigation, 600) }))
      .filter((r) => r.id),
    regulation: {
      failure: oneOfOrNull(reg.failure, failures),
      ...(reg.determinant !== undefined ? { determinant: oneOfOrNull(reg.determinant, ["ambiental", "alimentos", "patrimonio", "infraestructura"] as const) } : {}),
      externalities: str(reg.externalities, 600),
      existing: str(reg.existing, 600),
      tariffs: str(reg.tariffs, 600),
      subsidies: str(reg.subsidies, 600),
      competition: str(reg.competition, 600),
      restrictions: str(reg.restrictions, 600),
      intervention: str(reg.intervention, 600),
    },
    sdgs: {
      suggested: arr(sdgs.suggested, 17).filter((x): x is number => Number.isInteger(x) && (x as number) >= 1 && (x as number) <= 17),
      playerIdentifies: sdgs.playerIdentifies !== false,
    },
    creator: creator
      ? {
          difficulty: oneOfOrNull(creator.difficulty, ["guiado", "profesional", "experto"] as const) ?? undefined,
          hints: creator.hints !== false,
          hiddenData: ids(creator.hiddenData),
          distractors: arr(creator.distractors, 2).filter((x): x is string => typeof x === "string").map((x) => x.slice(0, 300)),
          activities: Object.fromEntries(
            Object.entries(isObj(creator.activities) ? creator.activities : {})
              .slice(0, 100)
              .filter(([, v]) => isObj(v))
              .map(([k, v]) => {
                const o = v as Raw;
                return [
                  k.slice(0, 80),
                  {
                    question: optStr(o.question, 600),
                    options: Array.isArray(o.options) ? arr(o.options, 5).filter(isObj).map((x) => ({ id: str(x.id, 40), text: str(x.text, 300) })) : undefined,
                    answers: Array.isArray(o.answers) ? ids(o.answers) : undefined,
                    explanation: optStr(o.explanation, 1000),
                    points: nOrNull(o.points) ?? undefined,
                    difficulty: optStr(o.difficulty, 40),
                    disabled: o.disabled === true,
                  },
                ];
              }),
          ),
        }
      : undefined,
    evidence,
  };
  return project;
}

/** Portable format (.proyecta.json): data only, versioned. */
export const portableFormat = "proyecta-project";
export function exportProject(p: NormalizedProject) {
  return JSON.stringify({ format: portableFormat, schemaVersion: projectSchemaVersion, exportedAt: new Date().toISOString(), project: p }, null, 2);
}
export function importPortable(text: string, maxBytes = 2_000_000): NormalizedProject {
  if (text.length > maxBytes) throw new Error("El archivo es demasiado grande para un proyecto.");
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("El archivo no es un JSON válido.");
  }
  if (!isObj(data) || data.format !== portableFormat) throw new Error("El archivo no es un proyecto de PROYECTA.");
  return parseProject(data.project);
}

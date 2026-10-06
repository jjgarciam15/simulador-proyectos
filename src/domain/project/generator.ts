import { build, type Spec } from "../../data/scenarios";
import type { Beneficiary, ImpactCardData, ImpactKind } from "../../data/impacts";
import { methodFit } from "../../data/impacts";
import type { MissionProfile, Module } from "../../data/missionProfiles";
import { valuationMethods } from "../../data/valuationMethods";
import { sdgs as sdgList } from "../../data/sdgs";
import { validateMission } from "../missions";
import type { Scenario } from "../types";
import type { MissionConfig, NormalizedProject, ProjectImpact, RiskLevel } from "./types";
import { errorsOf, validateProject, type Issue } from "./validation";

/**
 * MissionGenerator: NormalizedProject + configuration → mission data for the SAME engine (act) used by the
 * official missions. It is rule based: every value and every activity cites the project field it came from.
 * Documented defaults (simulator assumptions) are listed in `assumptions` so nothing is silently invented.
 */
export type AnswerStatus = "esperada" | "plausible" | "requiere_revision";
export interface GeneratedActivity {
  id: string;
  phase: number;
  concept: string;
  difficulty: string;
  question: string;
  options: { id: string; text: string }[];
  validAnswers: string[];
  feedback: string;
  /** Project field(s) the activity was built from (auditable). */
  source: string[];
  score: number;
  status: AnswerStatus;
  disabled?: boolean;
}
export interface PhaseAvailability {
  label: string;
  status: "si" | "parcial" | "no";
  reason: string;
}
export interface MissionMeta {
  chapter: string;
  district: string;
  hook: string;
  stakes: string;
  position: [number, number];
  character: "mara" | "ivo";
}
export interface GeneratedMission {
  id: string;
  projectId: string;
  scenario: Scenario;
  impacts: ImpactCardData[];
  profile: MissionProfile;
  directSdgs: number[];
  meta: MissionMeta;
  activities: GeneratedActivity[];
  phases: PhaseAvailability[];
  /** Simulator assumptions used because the project did not provide the value. */
  assumptions: string[];
  config: MissionConfig;
}
export type GenerateResult = { ok: true; mission: GeneratedMission } | { ok: false; errors: Issue[] | string[] };

const num = (v: number | null | undefined): v is number => typeof v === "number" && Number.isFinite(v);
const riskValue: Record<RiskLevel, number> = { baja: 25, media: 32, alta: 38 };
const probValue: Record<RiskLevel, number> = { baja: 20, media: 35, alta: 50 };
const beneficiaries: Beneficiary[] = ["Usuarios", "Consumidores", "Productores", "Gobierno", "Comunidad", "Trabajadores", "Población objetivo", "Terceros"];
export const asBeneficiary = (g: string): Beneficiary => beneficiaries.find((b) => b.toLowerCase() === g.trim().toLowerCase()) ?? "Población objetivo";
/** Deterministic pseudo random in [0,1) from a text (used to shuffle options reproducibly). */
function hash(text: string) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return ((h >>> 0) % 100000) / 100000;
}
const shuffle = <T extends { id: string }>(seed: string, list: T[]) => [...list].sort((a, b) => hash(seed + a.id) - hash(seed + b.id));
const lower = (s: string) => (s ? s[0].toLowerCase() + s.slice(1) : s);

function answerStatus(p: NormalizedProject, paths: string[]): AnswerStatus {
  if (p.source.type === "imported_pdf" || p.source.type === "imported_excel") {
    const reviewed = paths.every((path) => {
      const e = Object.entries(p.evidence).filter(([k]) => k === path || k.startsWith(path + "."));
      return !e.length || e.every(([, v]) => v.reviewed || v.confidence === "alta");
    });
    if (!reviewed) return "requiere_revision";
  }
  return p.metadata.profile === "creador" || p.source.type === "official" ? "esperada" : "plausible";
}

/** Activities (puzzles) generated from the project data, only where data exists. */
export function generateActivities(p: NormalizedProject): GeneratedActivity[] {
  const acts: GeneratedActivity[] = [];
  const causes = p.causes.filter((c) => c.text.trim()),
    effects = p.problemEffects.filter((e) => e.text.trim()),
    alts = p.alternatives.filter((a) => a.name.trim());
  const add = (a: Omit<GeneratedActivity, "status" | "options"> & { options: { id: string; text: string }[] }) => {
    const status = answerStatus(p, a.source);
    const unique = a.options.filter((o, i, all) => o.text.trim() && all.findIndex((x) => x.text.trim().toLowerCase() === o.text.trim().toLowerCase()) === i);
    // Exactly 5 options: the valid answers always stay, then the first distractors.
    const options = [...unique.filter((o) => a.validAnswers.includes(o.id)), ...unique.filter((o) => !a.validAnswers.includes(o.id))].slice(0, 5);
    if (options.length < 5 || !options.some((o) => a.validAnswers.includes(o.id))) return;
    acts.push({ ...a, options: shuffle(a.id, options), status, score: status === "esperada" ? a.score : status === "plausible" ? Math.round(a.score / 2) : 0 });
  };
  if (p.problem.trim() && causes.length && effects.length && alts.length)
    add({
      id: "gen-problema",
      phase: 0,
      concept: "Árbol del problema",
      difficulty: "Básica",
      question: "¿Cuál de estas frases expresa el problema central del proyecto?",
      options: [
        { id: "ok", text: p.problem },
        { id: "causa", text: causes[0].text },
        { id: "efecto", text: effects[0].text },
        { id: "solucion", text: `Falta de ${lower(alts[0].name)}` },
        { id: "objetivo", text: p.generalObjective || `Construir ${lower(alts[0].name)}` },
        ...(effects[1] ? [{ id: "efecto2", text: effects[1].text }] : []),
      ],
      validAnswers: ["ok"],
      feedback: "El problema central es la situación negativa que se quiere resolver; la causa la explica, el efecto es su consecuencia y la «falta de» una obra es una solución disfrazada.",
      source: ["problem", "causes", "problemEffects", "alternatives"],
      score: 10,
    });
  if (causes.length >= 1 && effects.length >= 2)
    add({
      id: "gen-causa",
      phase: 0,
      concept: "Causa y efecto",
      difficulty: "Básica",
      question: "¿Cuál de estos elementos es una causa del problema y no un efecto?",
      options: [
        { id: "ok", text: causes[causes.length > 1 ? 1 : 0].text },
        { id: "e1", text: effects[0].text },
        { id: "e2", text: effects[1].text },
        ...(p.generalObjective.trim() ? [{ id: "obj", text: p.generalObjective }] : []),
        { id: "problema", text: p.problem || "El problema central" },
        ...(alts[0] ? [{ id: "solucion", text: `Falta de ${lower(alts[0].name)}` }] : []),
      ],
      validAnswers: ["ok"],
      feedback: "Las causas explican por qué existe el problema; los efectos son sus consecuencias. Un objetivo es la situación deseada, no una causa.",
      source: ["causes", "problemEffects"],
      score: 8,
    });
  if (p.generalObjective.trim() && alts.length && p.specificObjectives.some((o) => o.text.trim()))
    add({
      id: "gen-objetivo",
      phase: 1,
      concept: "Objetivo general",
      difficulty: "Intermedia",
      question: "¿Cuál es el objetivo general del proyecto?",
      options: [
        { id: "ok", text: p.generalObjective },
        { id: "producto", text: `Construir ${lower(alts[0].name)}` },
        { id: "especifico", text: p.specificObjectives.find((o) => o.text.trim())!.text },
        ...(p.ends[0]?.text ? [{ id: "fin", text: p.ends[0].text }] : []),
        { id: "problema", text: p.problem },
        { id: "financiar", text: `Conseguir financiación para ${lower(alts[0].name)}` },
      ],
      validAnswers: ["ok"],
      feedback: "El objetivo general transforma el problema central en situación deseada. Un producto es parte de una alternativa, un objetivo específico atiende una causa y un fin atiende un efecto.",
      source: ["generalObjective", "specificObjectives", "alternatives"],
      score: 10,
    });
  const withInv = alts.filter((a) => num(a.investment));
  if (withInv.length >= 2) {
    const max = withInv.reduce((m, a) => (a.investment! > m.investment! ? a : m));
    if (withInv.filter((a) => a.investment === max.investment).length === 1)
      add({
        id: "gen-inversion",
        phase: 1,
        concept: "Costo de oportunidad",
        difficulty: "Básica",
        question: "¿Qué alternativa exige la mayor inversión inicial?",
        options: [...withInv.map((a) => ({ id: a.id, text: a.name })), { id: "iguales", text: "Todas requieren una inversión similar" }, { id: "vpn", text: "No se puede saber sin calcular el VPN" }, { id: "cobertura", text: "La que tiene mayor cobertura, porque siempre cuesta más" }],
        validAnswers: [max.id],
        feedback: `${max.name} requiere ${Math.round(max.investment!).toLocaleString("es-CO")} M. Mayor inversión significa renunciar a otros usos de esos recursos: compárala con su cobertura y beneficios.`,
        source: withInv.map((a) => `alternatives.${a.id}.investment`),
        score: 6,
      });
  }
  const withCov = alts.filter((a) => num(a.coverage));
  if (withCov.length >= 2) {
    const best = withCov.reduce((m, a) => (a.coverage! > m.coverage! ? a : m));
    if (withCov.filter((a) => a.coverage === best.coverage).length === 1)
      add({
        id: "gen-cobertura",
        phase: 1,
        concept: "Alternativas de solución",
        difficulty: "Básica",
        question: "¿Qué alternativa llega a una mayor parte de la población objetivo?",
        options: [...withCov.map((a) => ({ id: a.id, text: a.name })), { id: "iguales", text: "Todas llegan a la misma población" }, { id: "inversion", text: "La de mayor inversión, porque siempre llega a más personas" }, { id: "total", text: "Ninguna: la cobertura se mide sobre la población total" }],
        validAnswers: [best.id],
        feedback: `${best.name} cubre ${Math.round(best.coverage! * 100)} %. Mayor cobertura no la hace automáticamente mejor: revisa su costo y riesgo.`,
        source: withCov.map((a) => `alternatives.${a.id}.coverage`),
        score: 6,
      });
  }
  const costLabels = { inversion: "Inversión", operacion: "Operación", mantenimiento: "Mantenimiento", otros: "Otros costos" } as const;
  p.costs
    .filter((c) => c.label.trim() && c.category !== "otros")
    .slice(0, 3)
    .forEach((c) =>
      add({
        id: "gen-costo-" + c.id,
        phase: 2,
        concept: "Presupuesto",
        difficulty: "Básica",
        question: `¿Cómo se clasifica el costo «${c.label}»?`,
        options: [...(Object.keys(costLabels) as (keyof typeof costLabels)[]).map((k) => ({ id: k, text: costLabels[k] })), { id: "hundido", text: "Costo hundido (no entra al flujo)" }],
        validAnswers: [c.category],
        feedback: "La inversión ocurre antes de operar; la operación se repite cada año para prestar el servicio; el mantenimiento conserva la capacidad del activo.",
        source: [`costs.${c.id}`],
        score: 4,
      }),
    );
  const benefitLabels = { ingreso: "Ingreso financiero", ahorro: "Ahorro de costos", beneficioEconomico: "Beneficio económico para la sociedad", impactoValorado: "Impacto valorado en dinero" } as const;
  p.benefits
    .filter((b) => b.label.trim())
    .slice(0, 2)
    .forEach((b) =>
      add({
        id: "gen-beneficio-" + b.id,
        phase: 3,
        concept: "Evaluación financiera vs económica",
        difficulty: "Intermedia",
        question: `En este proyecto, «${b.label}» es…`,
        options: [...(Object.keys(benefitLabels) as (keyof typeof benefitLabels)[]).map((k) => ({ id: k, text: benefitLabels[k] })), { id: "transferencia", text: "Una transferencia sin efecto en el bienestar" }],
        validAnswers: [b.kind],
        feedback: "Un ingreso entra a la caja del ejecutor; un beneficio económico es un aumento de bienestar para la sociedad, aunque nadie lo cobre.",
        source: [`benefits.${b.id}`],
        score: 4,
      }),
    );
  p.impacts
    .filter((i) => i.text.trim())
    .slice(0, 3)
    .forEach((i) =>
      add({
        id: "gen-impacto-" + i.id,
        phase: 2,
        concept: "Producto, efecto e impacto",
        difficulty: "Intermedia",
        question: `«${i.text}» es…`,
        options: [
          { id: "efecto", text: "Un efecto del proyecto (cambio directo, medible en unidades físicas)" },
          { id: "impacto", text: "Un impacto (cambio en el bienestar)" },
          { id: "producto", text: "Un producto (bien o servicio entregado)" },
          { id: "problema", text: "Un efecto del problema (situación actual)" },
          { id: "insumo", text: "Un insumo del proyecto (recurso que se usa)" },
        ],
        validAnswers: [i.kind],
        feedback: "Los productos se entregan, los efectos son cambios directos que producen y los impactos son cambios en el bienestar de un grupo.",
        source: [`impacts.${i.id}`],
        score: 5,
      }),
    );
  p.impacts
    .filter((i) => i.type && i.kind === "impacto")
    .slice(0, 2)
    .forEach((i) => {
      const fits = methodFit[i.type!],
        best = valuationMethods.filter((m) => fits[m.id] === "optima"),
        wrong = valuationMethods.filter((m) => !fits[m.id] && m.id !== "transferencia").slice(0, 4);
      if (!best.length || wrong.length < 2) return;
      add({
        id: "gen-metodo-" + i.id,
        phase: 3,
        concept: "Valoración económica",
        difficulty: "Avanzada",
        question: `¿Qué método se ajusta mejor para valorar «${i.text}»?`,
        options: [best[0], ...wrong].map((m) => ({ id: m.id, text: m.name })),
        validAnswers: best.map((m) => m.id),
        feedback: `Según el tipo de cambio en bienestar (${i.type}), el método más idóneo es ${best.map((m) => m.name.toLowerCase()).join(" o ")}.`,
        source: [`impacts.${i.id}.type`],
        score: 6,
      });
    });
  if (alts.some((a) => (a.revenue ?? 0) > 0))
    add({
      id: "gen-rpc-tarifa",
      phase: 3,
      concept: "Razón precio cuenta (RPC)",
      difficulty: "Avanzada",
      question: "En el flujo económico, ¿qué RPC corresponde a los ingresos por tarifas o ventas del proyecto?",
      options: [
        { id: "cero", text: "0: es una transferencia entre usuarios y ejecutor" },
        { id: "uno", text: "1: el precio de mercado refleja su valor" },
        { id: "divisa", text: "La RPC de la divisa" },
        { id: "mo", text: "La RPC de mano de obra no calificada" },
        { id: "obras", text: "La RPC de obras civiles (0,903)" },
      ],
      validAnswers: ["cero"],
      feedback: "La tarifa redistribuye recursos; el beneficio económico ya está medido en los impactos valorados. Sumarla sería doble conteo.",
      source: ["alternatives"],
      score: 6,
    });
  if (p.regulation.failure) {
    const failures = ["Externalidades", "Monopolio natural", "Poder de mercado", "Información asimétrica", "Bienes públicos", "Ninguna falla suficiente"];
    add({
      id: "gen-falla",
      phase: 4,
      concept: "Falla de mercado",
      difficulty: "Intermedia",
      question: "Según la evidencia del proyecto, ¿qué falla de mercado justifica revisar la regulación?",
      options: failures.filter((f) => f === p.regulation.failure || f !== "Bienes públicos").slice(0, 5).map((f) => ({ id: f, text: f })),
      validAnswers: [p.regulation.failure],
      feedback: `El proyecto registra ${lower(p.regulation.failure)}${p.regulation.externalities ? `: ${p.regulation.externalities}` : ""}. Intervenir se justifica solo si el beneficio supera su costo.`,
      source: ["regulation.failure"],
      score: 6,
    });
  }
  if (p.sdgs.suggested.length) {
    const right = p.sdgs.suggested[0],
      near = [16, 17, 4, 14, 5, 1].filter((id) => !p.sdgs.suggested.includes(id)).slice(0, 4);
    add({
      id: "gen-ods",
      phase: 4,
      concept: "ODS",
      difficulty: "Básica",
      question: "¿Con qué ODS se relaciona directamente el producto del proyecto?",
      options: [right, ...near].map((id) => ({ id: String(id), text: `ODS ${id} · ${sdgList[id - 1].name}` })),
      validAnswers: [String(right)],
      feedback: "Un ODS se sustenta con una relación causal: producto → resultado → meta del ODS, con un indicador medible.",
      source: ["sdgs.suggested"],
      score: 5,
    });
  }
  const overrides = p.creator?.activities ?? {};
  return acts.map((a) => {
    const o = overrides[a.id];
    if (!o) return a;
    return {
      ...a,
      question: o.question ?? a.question,
      options: o.options ?? a.options,
      validAnswers: o.answers ?? a.validAnswers,
      feedback: o.explanation ?? a.feedback,
      score: o.points ?? a.score,
      difficulty: o.difficulty ?? a.difficulty,
      disabled: o.disabled,
      // A person reviewed the activity: its answer is now the expected one.
      status: o.answers || o.question || o.options ? "esperada" : a.status,
    };
  });
}

/** Which phases/modules the project data supports (shown before playing). */
export function phaseAvailability(p: NormalizedProject): PhaseAvailability[] {
  const valued = p.impacts.filter((i) => i.kind === "impacto" && i.type),
    withValue = valued.filter((i) => num(i.annualValue));
  return [
    { label: "Problema", status: p.problem && p.causes.length >= 2 && p.problemEffects.length >= 2 ? "si" : "no", reason: "Árbol del problema con causas y efectos del proyecto." },
    { label: "Actores", status: p.actors.length >= 2 ? (p.actors.some((a) => num(a.power)) ? "si" : "parcial") : "no", reason: p.actors.some((a) => num(a.power)) ? "Poder y posición registrados." : "Sin poder ni posición: se usan valores de referencia." },
    { label: "Alternativas", status: p.alternatives.length >= 2 ? "si" : "no", reason: `${p.alternatives.length} alternativa(s).` },
    { label: "Impactos", status: p.impacts.length ? "si" : "parcial", reason: p.impacts.length ? `${p.impacts.length} efecto(s) e impacto(s).` : "Solo producto y efecto del problema." },
    { label: "Presupuesto", status: "si", reason: "Planificador presupuestal con la inversión de la alternativa." },
    { label: "Flujo", status: p.alternatives.every((a) => num(a.investment) && num(a.om)) ? "si" : "no", reason: "Hoja de flujo financiero con inversión, O&M, ingresos y residual." },
    { label: "Valoración", status: withValue.length ? "si" : valued.length ? "parcial" : "no", reason: withValue.length ? "Impactos con valor anual." : valued.length ? "Impactos con tipo pero sin valor: se reparte el beneficio social." : "Sin impactos valorables." },
    { label: "RPC", status: num(p.economic.socialRate) || Object.keys(p.economic.rpc).length ? "si" : "parcial", reason: "Flujo económico con RPC del DNP; tasa social del proyecto o 9 %." },
    { label: "Regulación", status: p.regulation.failure ? "si" : "parcial", reason: p.regulation.failure ? `Falla: ${p.regulation.failure}.` : "Sin falla registrada: «No intervenir» es la referencia." },
    { label: "ODS", status: p.sdgs.suggested.length ? "si" : "parcial", reason: p.sdgs.suggested.length ? `ODS esperados: ${p.sdgs.suggested.join(", ")}.` : "Sin ODS esperados." },
  ];
}

function modulesFor(p: NormalizedProject, config: MissionConfig): Module[] {
  const valued = p.impacts.some((i) => i.kind === "impacto" && i.type),
    groups = new Set(p.impacts.filter((i) => i.kind === "impacto").map((i) => i.group)).size > 1;
  const compatible: Module[] = [
    ...(valued ? (["valuation"] as Module[]) : []),
    "economicFlow",
    ...(groups ? (["distributive"] as Module[]) : []),
    "stress",
    "switching",
    "committee",
  ];
  if (config.duration === "rapida") return compatible.filter((m) => m === "valuation");
  if (config.duration === "normal") return compatible.filter((m) => m !== "switching" && m !== "distributive");
  return compatible;
}

export function generateMission(p: NormalizedProject, config: MissionConfig, missionId: string): GenerateResult {
  const issues = validateProject(p);
  if (errorsOf(issues).length) return { ok: false, errors: errorsOf(issues) };
  const assumptions: string[] = [];
  const causes = p.causes.filter((c) => c.text.trim()),
    effects = p.problemEffects.filter((e) => e.text.trim());
  // Problem tree (5 valid nodes): central, direct cause, second cause (indirect first), direct effect, second effect.
  const c1 = causes.find((c) => c.level === "directa") ?? causes[0],
    c2 = causes.find((c) => c !== c1 && c.level === "indirecta") ?? causes.find((c) => c !== c1)!,
    e1 = effects.find((e) => e.level === "directa") ?? effects[0],
    e2 = effects.find((e) => e !== e1)!;
  if (causes.length > 2 || effects.length > 2) assumptions.push(`Objetivos, alternativas y cadena de valor se construyen con dos causas y dos efectos; el Árbol del problema del juego incluye además ${Math.min(6, causes.length + effects.length - 4)} causa(s) y efecto(s) más del proyecto como tarjetas.`);
  const objectiveFor = (causeId: string, i: number) =>
    p.specificObjectives.find((o) => o.causeId === causeId)?.text || p.specificObjectives.filter((o) => o.text.trim())[i]?.text || `Superar: ${lower(causes.find((c) => c.id === causeId)!.text)}`;
  const endFor = (effectId: string) => p.ends.find((e) => e.effectId === effectId)?.text || `Reducir: ${lower(effects.find((e) => e.id === effectId)!.text)}`;
  const alts = p.alternatives.slice(0, 4);
  const valuedPositive = p.impacts.filter((i) => i.kind === "impacto" && i.direction === "positivo" && num(i.annualValue)).reduce((n, i) => n + i.annualValue!, 0);
  const social = (a: (typeof alts)[number]) => {
    if (num(a.socialBenefit)) return a.socialBenefit;
    if (valuedPositive > 0) {
      assumptions.push(`Beneficio social anual de «${a.name}»: suma de impactos valorados (${Math.round(valuedPositive)} M).`);
      return valuedPositive;
    }
    assumptions.push(`«${a.name}» no tiene beneficio social registrado: se usa 0.`);
    return 0;
  };
  const target = p.population.target!,
    affected = p.population.affected!,
    total = num(p.population.total) ? Math.max(p.population.total, affected) : affected;
  if (!num(p.population.total)) assumptions.push("Población total: se usa la población afectada.");
  const maxInv = Math.max(...alts.map((a) => a.investment!));
  const budget = num(p.financial.budget) ? p.financial.budget : Math.round(maxInv * 1.3);
  if (!num(p.financial.budget)) assumptions.push(`Presupuesto disponible: 1,3 × la mayor inversión = ${budget.toLocaleString("es-CO")} M.`);
  const deadline = num(p.financial.deadline) ? p.financial.deadline : Math.max(...alts.map((a) => a.months!)) + 12;
  if (!num(p.financial.deadline)) assumptions.push(`Plazo: duración de la obra más larga + 12 meses = ${deadline} meses.`);
  const supply = num(p.population.currentSupply) ? p.population.currentSupply : Math.max(0, affected - target);
  if (!num(p.population.currentSupply)) assumptions.push("Oferta actual: población afectada menos población objetivo.");
  const actors = p.actors.filter((a) => a.name.trim()).slice(0, 6);
  const products = p.valueChain.products.filter((x) => x.trim());
  const spec: Spec = {
    id: missionId,
    title: p.title,
    sector: p.sector || "Proyecto propio",
    role: p.projectType,
    regulator: false,
    territory: p.territory || "Territorio no identificado",
    brief: p.description || p.problem,
    population: total,
    affected,
    budget,
    deadline,
    demand: affected,
    supply,
    unit: p.population.unit || "personas",
    failure: p.regulation.failure ?? "Ninguna falla suficiente",
    causes: [p.problem, c1.text, c2.text, e1.text, e2.text],
    objectives: [p.generalObjective, objectiveFor(c1.id, 0), objectiveFor(c2.id, 1), endFor(e1.id), endFor(e2.id)],
    alternatives: alts.map((a) => [a.name, a.description || a.name, a.investment!, a.om!, a.revenue ?? 0, social(a), a.coverage!, a.months!, a.tradeoff || "Trade-off no descrito por el autor."]),
    sdgs: [...new Set([...p.sdgs.suggested, ...[8, 9, 11].filter(() => p.sdgs.suggested.length < 2)])].slice(0, Math.max(2, p.sdgs.suggested.length)),
    policy: p.projectType === "privado" ? 3 : 0,
    actors: actors.map((a) => a.name),
    events: [p.risks[0]?.name || "Sobrecosto en la ejecución", p.risks[0]?.mitigation ? `Se materializa el riesgo registrado. Mitigación prevista: ${p.risks[0].mitigation}.` : "Los precios de los insumos suben durante la obra.", "Condiciones favorables de demanda"],
    market: [60, 25, 15],
    extras: {
      generated: true,
      alternatives: alts.map((a) => ({
        risk: a.risk ? riskValue[a.risk] : undefined,
        environment: num(a.environment) ? a.environment : 0,
        life: num(a.life) ? (num(p.horizon) ? Math.min(a.life, p.horizon) : a.life) : undefined,
        causes: (() => {
          const ids = a.causeIds.flatMap((id) => (id === c1.id ? ["n1"] : id === c2.id ? ["n2"] : []));
          return ids.length ? ids : ["n1", "n2"];
        })(),
        product: products[0] ? `${products[0]} (${a.name})` : undefined,
      })),
      actors: actors.map((a) => ({ power: num(a.power) ? a.power : undefined, position: num(a.position) ? a.position : undefined, affected: a.interest || undefined, contribution: a.influence || undefined })),
      risks: p.risks.slice(0, 3).map((r) => ({ name: r.name, probability: r.probability ? probValue[r.probability] : 30, impact: r.impact ? riskValue[r.impact] * 2 : 70, mitigation: r.mitigation || "Mitigación no descrita" })),
      decoys: p.creator?.distractors?.length === 2 ? [p.creator.distractors[0], p.creator.distractors[1]] : undefined,
    },
  };
  if (p.sdgs.suggested.length < 2) assumptions.push("Menos de dos ODS del autor: se completan candidatos con los ODS 8, 9 u 11, sin respuesta directa.");
  if (!num(p.horizon)) assumptions.push("Horizonte: vida útil de cada alternativa.");
  if (!p.regulation.failure) assumptions.push("Falla de mercado: «Ninguna falla suficiente».");
  const scenario = build(spec);
  // Every cause and effect the author wrote becomes a card of the problem tree (up to 6 more than the core ones).
  scenario.treeExtras = [
    ...causes.filter((c) => c !== c1 && c !== c2).map((c) => ({ label: c.text.trim(), level: c.level === "indirecta" ? ("indirect" as const) : ("direct" as const) })),
    ...effects.filter((e) => e !== e1 && e !== e2).map((e) => ({ label: e.text.trim(), level: e.level === "indirecta" ? ("impact" as const) : ("effect" as const) })),
  ].slice(0, 6);
  if (num(p.financial.rate) || num(p.economic.socialRate))
    scenario.constraints = [...scenario.constraints, `Tasas del proyecto: financiera ${num(p.financial.rate) ? (p.financial.rate * 100).toFixed(1) : "12,0"} %, social ${num(p.economic.socialRate) ? (p.economic.socialRate * 100).toFixed(1) : "9,0"} %`];
  const missionErrors = validateMission(scenario);
  if (missionErrors.length) return { ok: false, errors: missionErrors };

  // Impact cards (same structure as the official missions).
  const valued = p.impacts.filter((i) => i.kind === "impacto" && i.type),
    positives = valued.filter((i) => i.direction === "positivo"),
    socialRef = Math.max(1, ...alts.map((a) => social(a)));
  const share = (i: ProjectImpact) => {
    if (i.direction === "negativo") return num(i.annualValue) ? Math.min(1, Math.abs(i.annualValue) / socialRef) : 0.05;
    if (valuedPositive > 0 && num(i.annualValue)) return i.annualValue / valuedPositive;
    return 1 / Math.max(1, positives.length);
  };
  const impacts: ImpactCardData[] = [
    ...p.impacts
      .filter((i) => i.text.trim())
      .map((i): ImpactCardData => {
        const kind: ImpactKind = i.kind === "efecto" ? "efecto" : i.direction === "negativo" ? "impactoNegativo" : "impactoPositivo";
        const overlap = i.overlapWith ? [i.id, i.overlapWith].sort().join("+") : undefined;
        return {
          id: i.id,
          text: i.text,
          kind,
          group: asBeneficiary(i.group),
          why: kind === "efecto" ? "Cambio directo que produce el proyecto; todavía no es un cambio en bienestar." : `Cambio en el bienestar de ${i.group || "la población"}${i.magnitude ? ` (${i.magnitude})` : ""}.`,
          valuation:
            kind !== "efecto" && i.type
              ? { type: i.type, share: share(i), unit: i.unit || "personas beneficiadas", perCovered: num(i.perPerson) ? i.perPerson : 1, data: i.data || "Información registrada por el autor del proyecto.", overlap, sdg: p.sdgs.suggested }
              : undefined,
        };
      }),
    { id: "empleo", text: "Empleos temporales durante la construcción", kind: "efecto", group: "Trabajadores", why: "Es un efecto real, pero en la evaluación económica el trabajo es un costo que se ajusta con RPC; sumarlo como beneficio sería doble conteo." },
    { id: "placa", text: "Evento de inauguración del proyecto", kind: "irrelevante", why: "No cambia el bienestar ni el servicio." },
  ];
  // Only the second card of an overlapping pair keeps the overlap flag (the first one is the reference benefit).
  for (const i of p.impacts.filter((x) => x.overlapWith)) {
    const other = impacts.find((c) => c.id === i.overlapWith);
    if (other?.valuation) other.valuation = { ...other.valuation, overlap: undefined };
  }
  const profile: MissionProfile = {
    level: config.difficulty === "guiado" ? "Introductorio" : config.difficulty === "experto" ? "Avanzado" : "Intermedio",
    duration: config.duration === "rapida" ? "15–25 min" : config.duration === "normal" ? "40–60 min" : "60–90 min",
    concepts: ["Árbol del problema", "Objetivos", "Alternativas", ...(valued.length ? ["Valoración económica"] : []), "VPN"],
    modules: modulesFor(p, config),
  };
  const meta: MissionMeta = {
    chapter: p.title,
    district: p.territory || "Territorio no identificado",
    hook: p.description || p.problem,
    stakes: alts.map((a) => a.tradeoff).filter(Boolean)[0] ?? "Compara costos, cobertura y riesgo antes de decidir.",
    position: [20 + Math.round(hash(missionId) * 60), 20 + Math.round(hash(missionId + "y") * 60)],
    character: hash(missionId + "c") > 0.5 ? "mara" : "ivo",
  };
  return {
    ok: true,
    mission: {
      id: missionId,
      projectId: p.id,
      scenario,
      impacts,
      profile,
      directSdgs: p.sdgs.suggested.slice(0, 2),
      meta,
      activities: generateActivities(p),
      phases: phaseAvailability(p),
      assumptions: [...new Set(assumptions)],
      config,
    },
  };
}

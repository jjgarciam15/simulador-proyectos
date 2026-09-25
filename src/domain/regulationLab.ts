import type { GameState } from "./types";
import { scenarioById } from "../data/scenarios";
import { regulationBalance as B } from "../data/balance";
import { clamp, random } from "./finance";

/**
 * Laboratorio regulatorio.
 * The seed fixes how severe the market failure really is. Studies narrow the estimate but never change it.
 * The defensible instrument therefore depends on evidence: sometimes not intervening is the best answer.
 */
export function failureSeverity(g: GameState) {
  return B.severity.min + random(g.seed, "regulation-severity") * B.severity.range;
}
/** The severity band the player can see. A demand/market study narrows it around the true value. */
export function severityEstimate(g: GameState) {
  const truth = failureSeverity(g),
    studied = g.studies.includes("demanda"),
    half = studied ? B.uncertainty.studied : B.uncertainty.unstudied[g.difficulty],
    // Unstudied estimates are centred on a noisy reading, not on the truth.
    centre = studied
      ? truth
      : truth + (random(g.seed, "regulation-noise") - 0.5) * half,
    low = Math.max(0, centre - half),
    high = centre + half;
  return { low, high, mid: (low + high) / 2, studied };
}
export function severityLabel(v: number) {
  return v < 0.6 ? "baja" : v < 1 ? "moderada" : "alta";
}
/** Net value of an instrument given a severity (educational index; 100 = harm of a typical failure). */
export function instrumentNet(g: GameState, policyId: string, severity = failureSeverity(g)) {
  const cfg = B.instruments[policyId] ?? B.instruments.none,
    harm = B.harmScale * severity,
    // Weak administrative capacity makes capture and barriers more likely under strict rules.
    side = cfg.side * (policyId === "strict" ? 1.5 - g.capacity / 100 : 1);
  return {
    benefit: cfg.correction * harm,
    cost: cfg.cost,
    side,
    residualHarm: harm * (1 - cfg.correction),
    net: cfg.correction * harm - cfg.cost - side,
  };
}
export function recommendedPolicies(g: GameState, severity = failureSeverity(g)) {
  const s = scenarioById(g.scenarioId),
    values = s.instruments.map((p) => ({ id: p.id, net: instrumentNet(g, p.id, severity).net })),
    best = Math.max(...values.map((v) => v.net));
  return values.filter((v) => v.net >= best - B.tolerance).map((v) => v.id);
}
export function regulatoryDiagnosis(g: GameState) {
  const s = scenarioById(g.scenarioId),
    est = severityEstimate(g);
  const evidence = est.studied
    ? `Con el estudio de demanda, la severidad estimada de la falla (${s.failure.toLowerCase()}) es ${severityLabel(est.mid)}: ${est.low.toFixed(2)}–${est.high.toFixed(2)}.`
    : `Sin estudio de demanda, la severidad de la posible falla es incierta: ${est.low.toFixed(2)}–${est.high.toFixed(2)}.`;
  return { estimate: est, evidence };
}

/* ---------------- Puzzle causal regulatorio ---------------- */
export const puzzleSlots = [
  "Problema",
  "Evidencia",
  "Falla",
  "Instrumento",
  "Incentivo",
  "Comportamiento",
  "Resultado",
  "Efecto adverso",
] as const;
export type PuzzleSlot = (typeof puzzleSlots)[number];
export interface PuzzleCard {
  id: string;
  text: string;
}
/** Every card, correct or distractor. Ids of evidence/incentive/adverse keep the legacy argument values. */
export function puzzleDeck(g: GameState): PuzzleCard[] {
  const s = scenarioById(g.scenarioId),
    name = (id: string) => s.instruments.find((p) => p.id === id)?.name ?? id,
    otherFailure = s.failure === "Externalidades" ? "Bienes públicos" : "Externalidades";
  const cards: PuzzleCard[] = [
    { id: "problem:central", text: s.nodes[0].label },
    { id: "problem:symptom", text: "Quejas aisladas de usuarios en redes sociales" },
    { id: "problem:emblem", text: s.nodes.find((n) => n.id === "d1")?.label ?? "Falta una obra emblemática" },
    { id: "evidence:observed", text: "Brecha de acceso, concentración del mercado y severidad estimada de la falla" },
    { id: "evidence:popularity", text: "Popularidad de una intervención semejante en otra ciudad" },
    { id: "evidence:sole-price", text: "Un precio aislado, sin costos ni condiciones de entrada" },
    { id: "failure:real", text: s.failure },
    { id: "failure:none", text: "Ninguna falla suficiente para intervenir" },
    { id: "failure:other", text: otherFailure },
    { id: "instrument:none", text: name("none") },
    { id: "instrument:targeted", text: name("targeted") },
    { id: "instrument:strict", text: name("strict") },
    { id: "incentive:entry", text: "Información y acceso reducen barreras para competir" },
    { id: "incentive:price", text: "El control de precio cambia ingresos e incentivos de inversión" },
    { id: "incentive:baseline", text: "Se conservan los incentivos actuales y no se crean costos nuevos" },
    { id: "incentive:automatic", text: "Regular garantiza calidad sin fiscalización" },
    { id: "incentive:profit", text: "Toda ganancia privada implica una pérdida social equivalente" },
    { id: "behavior:compete", text: "Nuevos oferentes entran y reportan información verificable" },
    { id: "behavior:invest", text: "El operador ajusta su inversión a la tarifa regulada" },
    { id: "behavior:same", text: "Operadores y usuarios mantienen su conducta actual" },
    { id: "behavior:comply", text: "Todos cumplen voluntariamente sin vigilancia" },
    { id: "result:access", text: "Más acceso con costos de vigilancia proporcionales" },
    { id: "result:price", text: "Menor precio para usuarios con riesgo de menor oferta" },
    { id: "result:savings", text: "Se evitan costos regulatorios; la brecha puede continuar" },
    { id: "result:guarantee", text: "Bienestar garantizado para todos los grupos" },
    { id: "adverse:oversight", text: "Costos y capacidad insuficiente de fiscalización" },
    { id: "adverse:barriers", text: "Licencias que protegen al incumbente y frenan la inversión" },
    { id: "adverse:persistence", text: "La falla persiste al no intervenir" },
    { id: "adverse:none", text: "Ninguno: el instrumento elimina todos los riesgos" },
  ];
  return cards.sort((a, b) => random(g.seed, "puzzle" + a.id) - random(g.seed, "puzzle" + b.id));
}
const mechanism: Record<string, [string, string, string, string]> = {
  none: ["incentive:baseline", "behavior:same", "result:savings", "adverse:persistence"],
  targeted: ["incentive:entry", "behavior:compete", "result:access", "adverse:oversight"],
  strict: ["incentive:price", "behavior:invest", "result:price", "adverse:barriers"],
};
/** Expected card per slot. The chain must be consistent with the instrument the player actually chose. */
export function puzzleKey(g: GameState, policy = g.policy): Record<PuzzleSlot, string[]> {
  const m = mechanism[policy] ?? mechanism.none,
    noneDefensible = recommendedPolicies(g).includes("none");
  return {
    Problema: ["problem:central"],
    Evidencia: ["evidence:observed"],
    Falla: policy === "none" && noneDefensible ? ["failure:real", "failure:none"] : ["failure:real"],
    Instrumento: ["instrument:" + policy],
    Incentivo: [m[0]],
    Comportamiento: [m[1]],
    Resultado: [m[2]],
    "Efecto adverso": [m[3]],
  };
}
export function puzzleResult(g: GameState, chain = g.v2?.regulatory.chain) {
  const key = puzzleKey(g),
    rows = puzzleSlots.map((slot) => ({
      slot,
      chosen: chain?.[slot] ?? "",
      correct: !!chain?.[slot] && key[slot].includes(chain[slot]),
    }));
  // Causality is judged as a chain: after the first broken link, later links only earn half credit.
  let broken = false,
    points = 0;
  for (const r of rows) {
    if (r.correct) points += broken ? 0.5 : 1;
    else broken = true;
  }
  return { rows, score: Math.round((100 * points) / puzzleSlots.length) };
}
/** 60 % causal chain, 40 % instrument appropriateness given the hidden severity. */
export function regulatoryLabScore(g: GameState) {
  const s = scenarioById(g.scenarioId),
    fit = recommendedPolicies(g).includes(g.policy) ? 100 : 30,
    diagnosis =
      g.failure === s.failure || (g.policy === "none" && g.failure === "Ninguna falla suficiente" && recommendedPolicies(g).includes("none"))
        ? 1
        : 0.6;
  return clamp((0.6 * puzzleResult(g).score + 0.4 * fit) * diagnosis);
}

export interface Consequence {
  kind: "inmediata" | "diferida" | "sistémica";
  title: string;
  detail: string;
  month: number;
  phase: number;
}
/** Regulatory failure: a poorly matched instrument changes performance, legitimacy and future event exposure. */
export function applyRegulatoryConsequences(g: GameState) {
  if (!g.v2) return [];
  const s = scenarioById(g.scenarioId),
    rec = recommendedPolicies(g),
    C = B.consequences,
    out: Consequence[] = [];
  const add = (title: string, detail: string, e: { performance?: number; sustainability?: number; reputation?: number; eventRisk?: number }) => {
    g.performance = clamp(g.performance + (e.performance ?? 0), 0, 1.3);
    g.sustainability = clamp(g.sustainability + (e.sustainability ?? 0));
    g.reputation = clamp(g.reputation + (e.reputation ?? 0));
    g.v2!.eventRisk = (g.v2!.eventRisk ?? 0) + (e.eventRisk ?? 0);
    out.push({ kind: "sistémica", title, detail, month: g.month, phase: g.phase });
  };
  if (!rec.includes(g.policy)) {
    if (g.policy === "strict")
      add(
        "Fallo regulatorio: sobrerregulación",
        "El estándar estricto supera la severidad real de la falla. Aparecen barreras de entrada y el operador reduce inversión: desempeño −5 %, sostenibilidad −3, legitimidad −2.",
        C.overRegulation,
      );
    else if (g.policy === "targeted")
      add(
        "Costos regulatorios sin beneficio suficiente",
        "La falla era leve: la vigilancia cuesta más de lo que corrige. Legitimidad −3 y desempeño −1 %.",
        C.needlessCost,
      );
    else
      add(
        "La falla de mercado persiste",
        "No intervenir dejó sin corregir una falla severa. Desempeño −4 % y mayor exposición a eventos durante la ejecución (+15 %).",
        C.persistentFailure,
      );
  }
  const defensibleNone = g.policy === "none" && g.failure === "Ninguna falla suficiente" && rec.includes("none");
  if (g.policy !== "none" && g.failure !== s.failure)
    add(
      "Incentivo perverso por diagnóstico equivocado",
      `El instrumento se diseñó para «${g.failure}», pero la falla observada es «${s.failure}». Los agentes se adaptan a la regla sin corregir el problema: desempeño −3 %, legitimidad −2.`,
      C.wrongDiagnosis,
    );
  else if (rec.includes(g.policy) && (g.failure === s.failure || defensibleNone))
    out.push({
      kind: "sistémica",
      title: "Regulación proporcional",
      detail: "El instrumento es coherente con la evidencia disponible. No se generan distorsiones adicionales.",
      month: g.month,
      phase: g.phase,
    });
  return out;
}

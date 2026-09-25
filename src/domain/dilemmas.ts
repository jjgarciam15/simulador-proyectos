import type { GameState } from "./types";
import { scenarioById } from "../data/scenarios";
import { difficultyRules } from "../data/balance";
import {
  dilemmaTemplates,
  type DilemmaCondition,
  type DilemmaEffects,
  type DilemmaTemplate,
} from "../data/dilemmas";
import { clamp, random } from "./finance";

export interface DilemmaRecord {
  id: string;
  phase: number;
  month: number;
  choice?: string;
}
export interface DelayedEffect {
  source: string;
  note: string;
  effects: DilemmaEffects;
}

function technicalReference(g: GameState) {
  const s = scenarioById(g.scenarioId),
    a = s.alternatives.find((a) => a.id === g.alternative);
  return a ? (a.capex * g.target) / s.affected : s.budget;
}
export function matches(g: GameState, c: DilemmaCondition) {
  const s = scenarioById(g.scenarioId),
    a = s.alternatives.find((a) => a.id === g.alternative);
  if (c.missingStudy && g.studies.includes(c.missingStudy)) return false;
  if (c.hasStudy && !g.studies.includes(c.hasStudy)) return false;
  if (c.supportBelow !== undefined && g.support >= c.supportBelow) return false;
  if (c.supportAtLeast !== undefined && g.support < c.supportAtLeast) return false;
  if (c.role && s.role !== c.role) return false;
  if (c.policy && g.policy !== c.policy) return false;
  if (c.environmentalPressure && !(a && a.environment < 0)) return false;
  if (
    c.contingencyBelow !== undefined &&
    g.budget.contingency >= c.contingencyBelow * technicalReference(g)
  )
    return false;
  return true;
}
/** Probability after decision-dependent modifiers and difficulty, capped at 1. */
export function dilemmaProbability(g: GameState, t: DilemmaTemplate) {
  const p =
    t.probability.base *
    t.probability.modifiers.reduce((n, m) => n * (matches(g, m.when) ? m.factor : 1), 1) *
    difficultyRules[g.difficulty].event;
  return Math.min(1, p);
}
export function fillText(g: GameState, text: string) {
  const s = scenarioById(g.scenarioId),
    a = s.alternatives.find((a) => a.id === g.alternative),
    p = s.instruments.find((p) => p.id === g.policy);
  return text
    .replaceAll("{mission}", s.title)
    .replaceAll("{alternative}", a?.name ?? "la alternativa")
    .replaceAll("{actor0}", s.actors[0]?.name ?? "Un actor")
    .replaceAll("{actor1}", s.actors[1]?.name ?? "Un actor")
    .replaceAll("{actor2}", s.actors[2]?.name ?? "Un actor")
    .replaceAll("{failure}", s.failure.toLowerCase())
    .replaceAll("{policy}", p?.name ?? "la regulación");
}
export const dilemmaById = (id: string) => dilemmaTemplates.find((t) => t.id === id);

/** Seeded draw: the same seed and decisions always produce the same dilemma. Only first completion of a stage triggers. */
export function drawDilemma(g: GameState, completedPhase: number) {
  if (!g.v2) return null;
  const seen = new Set((g.v2.dilemmas ?? []).map((d) => d.id));
  return (
    dilemmaTemplates.find(
      (t) =>
        t.stage === completedPhase &&
        !seen.has(t.id) &&
        matches(g, t.conditions) &&
        random(g.seed, "dilemma:" + t.id) < dilemmaProbability(g, t),
    ) ?? null
  );
}
/** Money in effects is expressed as a share of the mission budget and scaled by difficulty. */
export function effectCash(g: GameState, e: DilemmaEffects) {
  const s = scenarioById(g.scenarioId),
    v = (e.cash ?? 0) * s.budget;
  return v < 0 ? v * difficultyRules[g.difficulty].dilemmaCost : v;
}
export function describeEffects(g: GameState, e: DilemmaEffects) {
  const parts: string[] = [],
    cash = effectCash(g, e),
    sign = (v: number) => (v > 0 ? "+" : "−") + Math.abs(v);
  if (cash) parts.push((cash > 0 ? "+" : "−") + "$ " + Math.round(Math.abs(cash)).toLocaleString("es-CO") + " M");
  if (e.months) parts.push("+" + e.months + (e.months === 1 ? " mes" : " meses"));
  if (e.support) parts.push("apoyo " + sign(e.support));
  if (e.reputation) parts.push("legitimidad " + sign(e.reputation));
  if (e.quality) parts.push("información " + sign(e.quality));
  if (e.capacity) parts.push("capacidad " + sign(e.capacity));
  if (e.sustainability) parts.push("sostenibilidad " + sign(e.sustainability));
  if (e.performance) parts.push("desempeño " + sign(Math.round(e.performance * 100)) + " %");
  if (e.eventRisk) parts.push("exposición a eventos " + sign(Math.round(e.eventRisk * 100)) + " %");
  return parts.length ? parts.join(" · ") : "sin efecto inmediato";
}
export function pendingDilemma(g: GameState) {
  const id = g.v2?.pendingDilemma;
  return id ? dilemmaById(id) ?? null : null;
}
/** Non-monetary effects on the live variables of the project. */
export function applyStateEffects(g: GameState, e: DilemmaEffects) {
  g.support = clamp(g.support + (e.support ?? 0));
  g.reputation = clamp(g.reputation + (e.reputation ?? 0));
  g.quality = clamp(g.quality + (e.quality ?? 0));
  g.capacity = clamp(g.capacity + (e.capacity ?? 0));
  g.sustainability = clamp(g.sustainability + (e.sustainability ?? 0));
  g.performance = clamp(g.performance + (e.performance ?? 0), 0, 1.3);
  if (g.v2 && e.eventRisk) g.v2.eventRisk = Math.max(-0.5, (g.v2.eventRisk ?? 0) + e.eventRisk);
}

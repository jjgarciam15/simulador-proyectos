import type { Scenario } from "./types";
export function validateMission(s: Scenario) {
  const errors: string[] = [];
  const finite = (v: number) => Number.isFinite(v) && v >= 0;
  if (
    !s.id ||
    !s.title ||
    !finite(s.budget) ||
    s.budget === 0 ||
    !finite(s.deadline) ||
    s.deadline === 0
  )
    errors.push("Identificación, presupuesto o plazo inválido");
  if (s.affected > s.population || !finite(s.affected))
    errors.push("Población inconsistente");
  if (
    s.alternatives.length < 2 ||
    new Set(s.alternatives.map((a) => a.id)).size !== s.alternatives.length
  )
    errors.push("Alternativas insuficientes o duplicadas");
  for (const a of s.alternatives) {
    if (
      !a.product ||
      !a.causes.length ||
      a.causes.some((id) => !s.nodes.some((n) => n.id === id)) ||
      ![a.capex, a.opex, a.months, a.life, a.coverage].every(finite) ||
      a.coverage > 1
    )
      errors.push("Alternativa incompleta: " + a.id);
  }
  if (!s.alternatives.some((a) => a.capex < s.budget * 1.35))
    errors.push("No existe inversión de referencia financiable");
  for (const n of s.nodes) {
    const seen = new Set<string>();
    let current: typeof n | undefined = n;
    while (current?.parent) {
      if (seen.has(current.id)) {
        errors.push("Dependencia circular del Árbol del problema");
        break;
      }
      seen.add(current.id);
      current = s.nodes.find((x) => x.id === current!.parent);
      if (!current) {
        errors.push("Referencia causal inexistente");
        break;
      }
    }
  }
  for (const e of s.events)
    if (
      !e.description ||
      !finite(e.probability) ||
      e.probability > 1 ||
      ![e.cost, e.delay, e.benefit].every(Number.isFinite) ||
      (e.cost === 0 && e.delay === 0 && e.benefit === 0)
    )
      errors.push("Evento sin consecuencia válida: " + e.id);
  if (
    s.sdgs.length < 2 ||
    s.sdgs.some(
      (id) =>
        id < 1 ||
        id > 17 ||
        s.alternatives.some((a) => !Number.isFinite(a.sdg[id])),
    )
  )
    errors.push("ODS sin criterio de impacto");
  if (
    !s.instruments.some((p) => p.id === "none") ||
    s.instruments.some((p) => ![p.admin, p.compliance].every(finite))
  )
    errors.push("Instrumentos regulatorios inválidos");
  if (s.studies.some((st) => !finite(st.cost) || !finite(st.months)))
    errors.push("Estudio con recursos negativos");
  return errors;
}

import { dilemmaTemplates } from "../data/dilemmas";
import { regulationBalance } from "../data/balance";
/** Development checks for configurable content added in iteration 2 (dilemmas and regulatory lab). */
export function validateDilemmas() {
  const errors: string[] = [];
  const ids = dilemmaTemplates.map((t) => t.id);
  if (new Set(ids).size !== ids.length) errors.push("Dilemas con identificador duplicado");
  for (const t of dilemmaTemplates) {
    if (!Number.isInteger(t.stage) || t.stage < 0 || t.stage > 4) errors.push("Dilema en etapa inválida: " + t.id);
    if (!(t.probability.base > 0 && t.probability.base <= 1)) errors.push("Probabilidad inválida: " + t.id);
    if (t.probability.modifiers.some((m) => !(m.factor > 0))) errors.push("Modificador de probabilidad inválido: " + t.id);
    if (t.choices.length < 2 || new Set(t.choices.map((c) => c.id)).size !== t.choices.length)
      errors.push("Dilema sin opciones reales: " + t.id);
    for (const c of t.choices) {
      const effects = [c.effects, c.delayed?.effects ?? {}];
      if (effects.some((e) => Object.values(e).some((v) => !Number.isFinite(v))))
        errors.push("Efecto no numérico: " + t.id + "/" + c.id);
      if (Math.abs(c.effects.cash ?? 0) > 0.05) errors.push("Efecto monetario desproporcionado: " + t.id + "/" + c.id);
      if ((c.effects.months ?? 0) < 0) errors.push("Tiempo negativo: " + t.id + "/" + c.id);
      if (c.delayed && !c.delayed.note) errors.push("Consecuencia diferida sin explicación: " + t.id + "/" + c.id);
      if (!c.lesson) errors.push("Opción sin aprendizaje: " + t.id + "/" + c.id);
    }
    if (!t.explanation || !t.context) errors.push("Dilema sin contexto o explicación: " + t.id);
  }
  // Every choice set must contain a real trade-off: at least two options with different effects.
  for (const t of dilemmaTemplates)
    if (new Set(t.choices.map((c) => JSON.stringify([c.effects, c.delayed?.effects]))).size < 2)
      errors.push("Dilema sin trade-off: " + t.id);
  return errors;
}
export function validateRegulationLab(s: Scenario) {
  const errors: string[] = [];
  for (const p of s.instruments)
    if (!regulationBalance.instruments[p.id]) errors.push("Instrumento sin configuración en el laboratorio: " + p.id);
  return errors;
}

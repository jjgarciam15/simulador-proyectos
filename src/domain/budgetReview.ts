import type { GameState } from "./types";
import { scenarioById } from "../data/scenarios";
import { budgetRules } from "../data/balance";
import { clamp } from "./finance";
import { available, projectCost, selected, technicalBudget } from "./engine";
import { negotiationCommitments } from "./negotiations";

export interface BudgetFinding {
  topic: string;
  level: "ok" | "alerta" | "grave";
  text: string;
  /** Tag used by scoring and achievements. */
  tag?: "subestimacion" | "desperdicio" | "inviable" | "incoherencia" | "contingencia";
}
/**
 * Explainable review of the budget the player built. Goes beyond total ≤ available: sufficiency,
 * efficiency, contingency range, commitments with actors, and coherence with the value chain.
 */
export function budgetReview(g: GameState, budget = g.budget) {
  const s = scenarioById(g.scenarioId),
    a = selected(g),
    R = budgetRules;
  if (!a) return { findings: [] as BudgetFinding[], score: 0 };
  const state = { ...g, budget },
    scale = g.target / s.affected,
    technical = technicalBudget(state),
    findings: BudgetFinding[] = [];
  const ratio = (value: number, reference: number) => value / Math.max(1, reference);
  const add = (f: BudgetFinding) => findings.push(f);

  const activities = g.activities.reduce((n, x) => n + x.cost, 0),
    delivery = ratio(activities, technical);
  if (!g.activities.length || activities === 0)
    add({ topic: "Inversión técnica", level: "grave", tag: "subestimacion", text: "El cronograma no asigna costos: la inversión técnica no está presupuestada." });
  else if (delivery < R.underestimate.grave)
    add({ topic: "Inversión técnica", level: "grave", tag: "subestimacion", text: `Las actividades cubren ${(delivery * 100).toFixed(0)} % de la inversión técnica de referencia: el proyecto no alcanza a construir lo que promete.` });
  else if (delivery < R.underestimate.alert)
    add({ topic: "Inversión técnica", level: "alerta", tag: "subestimacion", text: `Las actividades cubren ${(delivery * 100).toFixed(0)} % de la referencia técnica: hay riesgo de subestimación.` });
  else add({ topic: "Inversión técnica", level: "ok", text: `Las actividades cubren ${(delivery * 100).toFixed(0)} % de la referencia técnica.` });

  const operation = ratio(budget.operation, a.opex * scale * g.assumptions.opex);
  if (operation < R.operation.min)
    add({ topic: "Operación", level: operation < 0.4 ? "grave" : "alerta", tag: "subestimacion", text: `La operación financia ${(operation * 100).toFixed(0)} % del costo anual de referencia: el servicio perderá confiabilidad.` });
  else if (operation > R.operation.max)
    add({ topic: "Operación", level: "alerta", tag: "desperdicio", text: `La operación supera en ${((operation - 1) * 100).toFixed(0)} % la referencia: recursos inmovilizados que podrían financiar impacto.` });
  else add({ topic: "Operación", level: "ok", text: "La reserva de operación es coherente con el costo anual." });

  const maintenance = ratio(budget.maintenance, a.capex * scale * 0.025);
  if (maintenance < R.maintenance.min)
    add({ topic: "Mantenimiento", level: maintenance < 0.4 ? "grave" : "alerta", tag: "subestimacion", text: `El mantenimiento cubre ${(maintenance * 100).toFixed(0)} % de lo recomendado: la infraestructura se deteriorará antes de tiempo.` });
  else if (maintenance > R.maintenance.max)
    add({ topic: "Mantenimiento", level: "alerta", tag: "desperdicio", text: "El mantenimiento supera ampliamente lo necesario." });
  else add({ topic: "Mantenimiento", level: "ok", text: "El mantenimiento protege la vida útil prevista." });

  const contingency = ratio(budget.contingency, technical);
  if (contingency < R.contingency.min)
    add({ topic: "Contingencia", level: "alerta", tag: "contingencia", text: `La reserva es ${(contingency * 100).toFixed(1)} % de la inversión técnica: cualquier imprevisto consumirá caja libre.` });
  else if (contingency > R.contingency.max)
    add({ topic: "Contingencia", level: "alerta", tag: "desperdicio", text: `La reserva es ${(contingency * 100).toFixed(0)} % de la inversión técnica: protege, pero inmoviliza recursos que podrían ampliar el impacto.` });
  else add({ topic: "Contingencia", level: "ok", text: `Reserva de ${(contingency * 100).toFixed(0)} %: dentro del rango prudente.` });

  if (budget.oversight <= 0)
    add({ topic: "Supervisión", level: "alerta", tag: "subestimacion", text: "No hay recursos de supervisión o interventoría: nadie verificará calidad ni avances." });
  if (a.environment < 0 && budget.environment < a.capex * scale * 0.02 * 0.8)
    add({ topic: "Gestión ambiental", level: "alerta", tag: "incoherencia", text: "La alternativa tiene presión ambiental negativa y la gestión ambiental está por debajo de lo necesario." });
  for (const c of negotiationCommitments({ ...g, budget }))
    if (!c.funded)
      add({ topic: "Acuerdos con actores", level: "grave", tag: "incoherencia", text: `El acuerdo con ${c.actor.name} exige ${Math.round(c.minimum)} M en ${c.name}; hay ${Math.round(c.allocated)} M.` });

  const chainIds = new Set((g.v2?.chain ?? []).map((c) => c.id));
  if (chainIds.has("operators") && budget.operation <= 0)
    add({ topic: "Coherencia con la cadena", level: "alerta", tag: "incoherencia", text: "La cadena promete operadores capacitados, pero la operación no tiene presupuesto." });
  if (chainIds.has("knowledge") && !g.studies.length)
    add({ topic: "Coherencia con la cadena", level: "alerta", tag: "incoherencia", text: "La cadena usa estudios como insumo, pero no se contrató ninguno." });

  const cost = projectCost(state),
    free = available(g);
  if (cost > free)
    add({ topic: "Viabilidad financiera", level: "grave", tag: "inviable", text: `La propuesta cuesta ${Math.round(cost)} M y el saldo libre es ${Math.round(free)} M: no se puede comprometer sin financiación.` });
  else if (free - cost < s.budget * 0.02)
    add({ topic: "Viabilidad financiera", level: "alerta", text: "El saldo después de comprometer es mínimo: no quedará margen para imprevistos fuera de la contingencia." });
  else add({ topic: "Viabilidad financiera", level: "ok", text: `Saldo libre después de comprometer: ${Math.round(free - cost)} M.` });

  const graves = findings.filter((f) => f.level === "grave").length,
    alerts = findings.filter((f) => f.level === "alerta").length;
  return { findings, score: clamp(100 - graves * R.penalty.grave - alerts * R.penalty.alert) };
}
/**
 * Reference ranges per budget category for the selected alternative. They guide the player without
 * filling any value: the player still decides quantities, amounts and priorities.
 */
export function budgetGuide(g: GameState) {
  const s = scenarioById(g.scenarioId),
    a = selected(g),
    R = budgetRules;
  if (!a) return [];
  const scale = g.target / s.affected,
    capex = technicalBudget(g),
    opex = a.opex * scale * g.assumptions.opex,
    base = a.capex * scale;
  return [
    { key: "operation", label: "Operación (primer año)", low: opex * R.operation.min, high: opex * R.operation.max, note: "Costo anual de operar el servicio. Por debajo, cae la confiabilidad." },
    { key: "maintenance", label: "Mantenimiento", low: base * 0.025 * R.maintenance.min, high: base * 0.025 * R.maintenance.max, note: "Cerca de 2,5 % de la inversión física por año." },
    { key: "environment", label: "Gestión ambiental", low: base * 0.01, high: base * 0.03, note: a.environment < 0 ? "La alternativa tiene presión ambiental: no conviene quedar abajo del rango." : "Permisos y medidas de manejo." },
    { key: "social", label: "Gestión social", low: base * 0.005, high: base * 0.025, note: "Acompañamiento a actores. Los acuerdos negociados fijan mínimos." },
    { key: "oversight", label: "Supervisión e interventoría", low: base * 0.015, high: base * 0.035, note: "Sin supervisión nadie verifica calidad ni avance." },
    { key: "contingency", label: "Contingencia", low: capex * R.contingency.min, high: capex * R.contingency.max, note: "Rango prudente: 5–12 %. Más reserva protege, pero inmoviliza recursos." },
  ] as { key: keyof GameState["budget"]; label: string; low: number; high: number; note: string }[];
}

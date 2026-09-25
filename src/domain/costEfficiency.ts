import type { GameState } from "./types";
import { npv } from "./finance";
import {
  available,
  model,
  projectCost,
  schedule,
  selected,
  technicalBudget,
} from "./engine";
import { scenarioById } from "../data/scenarios";

/** Constant-price costs / discounted physical service. No tariffs or financing benefits. */
export function costPerResult(
  costs: number[],
  results: number[],
  rate: number,
) {
  if (
    costs.length !== results.length ||
    !Number.isFinite(rate) ||
    rate < 0 ||
    costs.some((v) => !Number.isFinite(v) || v < 0) ||
    results.some((v) => !Number.isFinite(v) || v < 0)
  )
    throw new Error("Flujos de costo y resultado incompatibles.");
  const denominator = npv(results, rate);
  return denominator > 0 ? npv(costs, rate) / denominator : null;
}
export function efficiencyComparison(g: GameState) {
  const s = scenarioById(g.scenarioId),
    current = selected(g);
  if (!current) return [];
  return s.alternatives.map((a) => {
    const candidate = {
      ...g,
      alternative: a.id,
      assumptions: { ...g.assumptions, nominal: false },
      activities: g.activities.map((v) => ({
        ...v,
        cost:
          (v.cost * technicalBudget(g, a)) /
          Math.max(1, technicalBudget(g, current)),
        months: Math.max(1, Math.round((v.months * a.months) / current.months)),
      })),
    };
    const m = model(candidate),
      delay = Math.ceil(g.assumptions.delay / 12),
      people = m.coverage * s.affected;
    const results = m.financial.costs.map((_, year) =>
      year > delay ? people : 0,
    );
    return {
      id: a.id,
      name: a.name,
      people,
      coverage: m.coverage,
      annualCost: m.financial.caue,
      unitCost: costPerResult(
        m.financial.costs,
        results,
        g.assumptions.discount,
      ),
      commitment: projectCost(candidate),
      feasible:
        projectCost(candidate) <= available(g) &&
        g.month +
          Math.max(a.months, schedule(candidate.activities).duration) +
          g.assumptions.delay <=
          s.deadline,
    };
  });
}

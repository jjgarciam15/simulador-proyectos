import type { Budget, GameState } from "./types";

export interface BudgetLine {
  id: string;
  category: keyof Budget;
  description: string;
  unit: string;
  quantity: number;
  unitCost: number;
}
export const budgetCategories: (keyof Budget)[] = [
  "operation",
  "maintenance",
  "environment",
  "social",
  "oversight",
  "contingency",
];
export function lineTotal(line: BudgetLine) {
  return line.quantity * line.unitCost;
}
export function detailedTotals(lines: BudgetLine[]): Budget {
  const totals: Budget = {
    operation: 0,
    maintenance: 0,
    environment: 0,
    social: 0,
    oversight: 0,
    contingency: 0,
  };
  for (const line of lines) totals[line.category] += lineTotal(line);
  return totals;
}
export function validBudgetLines(
  lines: unknown,
  budget: Budget,
): lines is BudgetLine[] {
  if (!Array.isArray(lines) || lines.length > 200) return false;
  const ids = new Set<string>();
  for (const line of lines) {
    if (
      !line ||
      typeof line.id !== "string" ||
      !line.id ||
      ids.has(line.id) ||
      !budgetCategories.includes(line.category) ||
      typeof line.description !== "string" ||
      !line.description.trim() ||
      line.description.length > 160 ||
      typeof line.unit !== "string" ||
      !line.unit.trim() ||
      line.unit.length > 40 ||
      ![line.quantity, line.unitCost, lineTotal(line)].every(
        (n) => Number.isFinite(n) && n > 0,
      )
    )
      return false;
    ids.add(line.id);
  }
  const totals = detailedTotals(lines);
  return budgetCategories.every(
    (key) =>
      Number.isFinite(budget[key]) &&
      budget[key] >= 0 &&
      totals[key] <= budget[key] + 0.000001,
  );
}
export function validSavedBudgetLines(g: GameState) {
  if (g.v2?.budgetLines === undefined) return true;
  // Execution consumes contingency; compare the original detail with the budget approved at investment.
  return validBudgetLines(g.v2.budgetLines, g.snapshot?.budget ?? g.budget);
}

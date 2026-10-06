/**
 * Structural check of an action before the engine applies it.
 * The interface always sends well formed actions; this guard turns a malformed one
 * (a corrupted save, an extension, a future bug) into a clear error instead of a crash
 * or an impossible state such as stage NaN. Content rules stay in each action handler.
 */
const arrays: Record<string, string[]> = {
  nodes: ["ids"],
  compare: ["ids"],
  alignment: ["sdgs"],
  indicators: ["value"],
  activities: ["value"],
  answerV2: ["choices"],
  objectives: ["specific"],
  chain: ["cards", "connections"],
  impacts: ["placements"],
  valuation: ["choices"],
  flow: ["rows"],
  economic: ["rows", "benefits"],
};
const objects: Record<string, string[]> = {
  budget: ["value"],
  assumptions: ["value"],
  mga: ["value"],
  actorMap: ["value"],
  sdgReasons: ["value"],
  regulatory: ["value"],
  tree: ["placements"],
  committee: ["answers"],
};
const integers: Record<string, string[]> = { reopen: ["phase"], visit: ["phase"], stageTime: ["phase"] };
const numbers: Record<string, string[]> = { target: ["value"], planner: ["value"], stageTime: ["seconds"] };
const texts: Record<string, string[]> = { reflection: ["text"], justify: ["text"] };

export function actionShapeError(action: unknown): string | null {
  if (!action || typeof action !== "object" || typeof (action as { type?: unknown }).type !== "string") return "Acción sin tipo.";
  const a = action as Record<string, unknown>,
    t = a.type as string;
  for (const k of arrays[t] ?? []) if (!Array.isArray(a[k])) return `La acción «${t}» necesita una lista en «${k}».`;
  for (const k of objects[t] ?? []) if (!a[k] || typeof a[k] !== "object" || Array.isArray(a[k])) return `La acción «${t}» necesita datos en «${k}».`;
  for (const k of integers[t] ?? []) if (!Number.isInteger(a[k])) return `La acción «${t}» necesita una etapa válida.`;
  for (const k of numbers[t] ?? []) if (typeof a[k] !== "number" || !Number.isFinite(a[k])) return `La acción «${t}» necesita un número válido en «${k}».`;
  for (const k of texts[t] ?? []) if (typeof a[k] !== "string") return `La acción «${t}» necesita un texto.`;
  if (t === "budget" && a.lines !== undefined && !Array.isArray(a.lines)) return "El presupuesto detallado debe ser una lista de partidas.";
  return null;
}

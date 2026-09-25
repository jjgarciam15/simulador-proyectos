import type { GameState } from "../../domain/types";
import type { Action } from "../../domain/engine";
import { moduleEnabled } from "../../data/missionProfiles";
import ValuationLab from "./ValuationLab";
import EconomicFlow from "./EconomicFlow";

/** Modules shown only when the mission profile enables them (enabledStages). */
export function ValuationLabGate({ g, send }: { g: GameState; send: (a: Action) => void }) {
  return moduleEnabled(g.scenarioId, "valuation") ? <ValuationLab g={g} send={send} /> : null;
}
export function EconomicGate({ g, send }: { g: GameState; send: (a: Action) => void }) {
  return moduleEnabled(g.scenarioId, "economicFlow") ? <EconomicFlow key={g.v2?.v22?.flow ? "on" : "off"} g={g} send={send} /> : null;
}

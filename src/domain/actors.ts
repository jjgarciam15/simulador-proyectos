import type { GameState, Scenario, Stakeholder } from "./types";
import { scenarioById } from "../data/scenarios";
import { random } from "./finance";

/**
 * Actores con perfil sorteado: every new game draws each actor's power, interest and position from its
 * code (the same code always gives the same profiles), so the power × interest map has to be read again
 * in every game. Government institutions always keep a neutral position. The position then moves with
 * the player's decisions (consult, negotiate, ignore…) and an opposed, powerful actor raises the risk of
 * social conflict during execution.
 */
export interface ActorProfile {
  power: number;
  interest: number;
  /** −100 (opposes) … 100 (supports); always 0 for government. */
  position: number;
  government: boolean;
}
export type GameActor = Stakeholder & { government: boolean; /** Current position, moved by the player's decisions. */ stance: number };

const GOVERNMENT =
  /\b(gobierno|alcald[ií]a|ministerio|secretar[ií]a|gobernaci[oó]n|superintendencia|concejo|municipalidad|autoridad|organismo|catastro|contralor[ií]a|procuradur[ií]a|regulador|agencia nacional|entidad p[uú]blica|corporaci[oó]n aut[oó]noma|instituto nacional|departamento nacional|defensor[ií]a)/i;
/** Government institutions (authorities, agencies, ministries, regulators…) keep a neutral position. */
export const isGovernment = (name: string) => GOVERNMENT.test(name);

/** Clearly high (66–95) or clearly low (15–52): the threshold of 60 is never ambiguous. */
const level = (seed: string, key: string) => (random(seed, key + ":alto") < 0.5 ? 66 + Math.round(random(seed, key) * 29) : 15 + Math.round(random(seed, key) * 37));

export function rollActorProfiles(s: Scenario, seed: string): Record<string, ActorProfile> {
  const out: Record<string, ActorProfile> = {};
  for (const a of s.actors) {
    const government = isGovernment(a.name),
      sign = random(seed, "actor-sign:" + a.id) < 0.5 ? -1 : 1,
      magnitude = 20 + Math.round(random(seed, "actor-position:" + a.id) * 50);
    out[a.id] = { power: level(seed, "actor-power:" + a.id), interest: level(seed, "actor-interest:" + a.id), position: government ? 0 : sign * magnitude, government };
  }
  const ids = s.actors.map((a) => a.id),
    pick = (key: string, from: string[]) => from[Math.floor(random(seed, key) * from.length)];
  const key = (id: string) => out[id].power >= 60 && out[id].interest >= 60;
  // A learnable map: at least one key actor (high power and interest) and, with two or more, one that is not.
  if (ids.length && !ids.some(key)) {
    const id = pick("actor-key", ids);
    out[id].power = Math.max(out[id].power, 72);
    out[id].interest = Math.max(out[id].interest, 72);
  }
  if (ids.length > 1 && ids.every(key)) out[pick("actor-minor", ids)].interest = 30;
  // Something to manage: at least one non-government actor against the project and one in favour.
  const civil = ids.filter((id) => !out[id].government);
  if (civil.length >= 2) {
    if (!civil.some((id) => out[id].position < 0)) out[pick("actor-against", civil)].position *= -1;
    if (!civil.some((id) => out[id].position > 0)) out[pick("actor-favour", civil.filter((id) => out[id].position < 0))].position *= -1;
  }
  return out;
}

/** Actors of the game: the scenario data with this game's profile and current position. */
export function gameActors(g: GameState): GameActor[] {
  return scenarioById(g.scenarioId).actors.map((a) => {
    const p = g.actorProfiles?.[a.id];
    if (!p) return { ...a, government: isGovernment(a.name), stance: a.position };
    return { ...a, power: p.power, interest: p.interest, position: p.position, government: p.government, stance: g.actorStance?.[a.id] ?? p.position };
  });
}
export const gameActor = (g: GameState, id: string) => gameActors(g).find((a) => a.id === id);

export type StanceLabel = "en contra" | "neutral" | "a favor";
export const stanceLabel = (n: number): StanceLabel => (n < -10 ? "en contra" : n > 10 ? "a favor" : "neutral");

/** How each decision moves an actor's position (government stays neutral). */
export const stanceShift: Record<string, number> = {
  consultar: 15,
  negociar: 20,
  involucrar: 25,
  informar: 8,
  monitorear: 0,
  ignorar: -20,
  escuchar: 5,
  acuerdo: 25,
  "acuerdo rechazado": -5,
  compensar: 15,
  retirarse: -20,
};
/** Applies a decision to an actor's position (only in games with drawn profiles). Returns the change. */
export function moveStance(g: GameState, id: string, decision: string) {
  const p = g.actorProfiles?.[id];
  if (!p || p.government) return 0;
  const before = g.actorStance?.[id] ?? p.position,
    after = Math.max(-100, Math.min(100, before + (stanceShift[decision] ?? 0)));
  g.actorStance = { ...g.actorStance, [id]: after };
  return after - before;
}
/**
 * Organised opposition: powerful actors against the project weigh on the risk of social conflict.
 * 0 when nobody opposes; about 1 when a very powerful actor strongly opposes.
 */
export function opposition(g: GameState) {
  if (!g.actorProfiles) return 0;
  return gameActors(g)
    .filter((a) => !a.government && stanceLabel(a.stance) === "en contra")
    .reduce((n, a) => n + (a.power / 100) * (-a.stance / 100), 0);
}
/** The actor that leads a social conflict: the most powerful one against the project. */
export function leadingOpponent(g: GameState) {
  return gameActors(g)
    .filter((a) => !a.government && stanceLabel(a.stance) === "en contra")
    .sort((a, b) => b.power * -b.stance - a.power * -a.stance)[0];
}

/** Saved profiles must cover the scenario's actors with finite values; otherwise the game keeps the reference profiles. */
export function validActorSave(g: GameState) {
  const ids = scenarioById(g.scenarioId).actors.map((a) => a.id),
    n = (x: unknown, lo: number, hi: number) => typeof x === "number" && Number.isFinite(x) && x >= lo && x <= hi;
  if (g.actorProfiles !== undefined) {
    const p = g.actorProfiles;
    if (!p || typeof p !== "object" || Array.isArray(p)) return false;
    if (!ids.every((id) => p[id] && n(p[id].power, 0, 100) && n(p[id].interest, 0, 100) && n(p[id].position, -100, 100) && typeof p[id].government === "boolean")) return false;
  }
  if (g.actorStance !== undefined) {
    const st = g.actorStance;
    if (!st || typeof st !== "object" || Array.isArray(st)) return false;
    if (!Object.entries(st).every(([id, v]) => ids.includes(id) && n(v, -100, 100))) return false;
  }
  return true;
}

import { resourceChanges } from "./resources";
import type { GameState } from "./types";
import { phases } from "./types";
export type Cue =
  | "gain"
  | "spend"
  | "strain"
  | "funding"
  | "click"
  | "confirm"
  | "chapter"
  | "event"
  | "progress"
  | "finish"
  | "error";
export interface ExperienceMoment {
  cue: Cue;
  title: string;
  detail: string;
  phase?: number;
}
export function decisionMoment(
  before: GameState,
  after: GameState,
): ExperienceMoment | null {
  if (!before.outcome && after.outcome)
    return {
      cue: "finish",
      title: "Una huella en Aurora",
      detail:
        after.outcome.status === "completado"
          ? "La ejecución ha terminado. Es momento de comprender el resultado."
          : "La estrategia se cierra. Sus lecciones también construyen el futuro.",
      phase: 7,
    };
  if (before.phase !== after.phase)
    return {
      cue: "chapter",
      title: phases[after.phase],
      detail:
        after.phase === 6
          ? "El plan llega al terreno. Cada periodo abre nuevas decisiones."
          : "Una nueva etapa para reconstruir el distrito.",
      phase: after.phase,
    };
  if (after.pendingEvent?.id !== before.pendingEvent?.id && after.pendingEvent)
    return {
      cue: "event",
      title: "Transmisión desde el terreno",
      detail: after.pendingEvent.name,
    };
  if (after.elapsed > before.elapsed)
    return {
      cue: "progress",
      title: `Mes ${after.elapsed} de ejecución`,
      detail:
        "El equipo avanza. Consulta los recursos y el progreso actualizado.",
    };
  const changes = resourceChanges(before, after);
  if (
    after.loans.length > before.loans.length ||
    (after.grantReceived && !before.grantReceived)
  )
    return { cue: "funding", title: "Financiación incorporada", detail: "" };
  if (changes.some((c) => c.favorable === false))
    return { cue: "strain", title: "Recursos bajo presión", detail: "" };
  if (after.spent > before.spent)
    return { cue: "spend", title: "Recursos ejecutados", detail: "" };
  if (changes.some((c) => c.favorable === true))
    return { cue: "gain", title: "Capacidades fortalecidas", detail: "" };
  if (after.journal.length > before.journal.length)
    return { cue: "confirm", title: "Decisión registrada", detail: "" };
  return null;
}
export function announceExperience(moment: ExperienceMoment | null) {
  if (moment && typeof window !== "undefined")
    window.dispatchEvent(
      new CustomEvent("aurora:experience", { detail: moment }),
    );
}

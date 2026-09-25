import type { GeneratedActivity } from "./generator";
import type { QuestionV2 } from "../questionsV2";

/** Activities generated for each generated mission (kept apart from the store to avoid import cycles). */
const activities = new Map<string, GeneratedActivity[]>();
export const setActivities = (missionId: string, list: GeneratedActivity[]) => activities.set(missionId, list);
export const dropActivities = (missionId: string) => activities.delete(missionId);
export const clearActivities = () => activities.clear();
export const generatedActivitiesFor = (missionId: string) => (activities.get(missionId) ?? []).filter((a) => !a.disabled && a.status !== "requiere_revision");
const statusNote = { esperada: "", plausible: " Respuesta esperada según el autor del proyecto (plausible, no oficial).", requiere_revision: "" } as const;
/** Generated activities as practice questions of the same question engine. */
export function generatedQuestions(missionId: string): QuestionV2[] {
  return generatedActivitiesFor(missionId).map((a) => ({
    id: a.id,
    phase: a.phase,
    context: "Actividad generada desde los datos del proyecto (" + a.source.join(", ") + ").",
    concept: a.concept,
    difficulty: a.difficulty,
    question: a.question,
    options: a.options,
    answers: a.validAnswers,
    explanation: a.feedback + statusNote[a.status],
    hints: ["Relee la sección del proyecto indicada en el contexto.", "Descarta primero las opciones que describen soluciones o consecuencias."],
    points: a.score,
    penalty: Math.round(a.score / 4),
    tags: ["generada", a.status],
  }));
}

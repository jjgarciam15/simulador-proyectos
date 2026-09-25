import { describe, expect, it } from "vitest";
import { scenarios } from "../data/scenarios";
import { concepts } from "../data/concepts";
import { exam2 } from "../data/exam2";
import { questionsV2 } from "./questionsV2";
import { committeeQuestions } from "./committee";
import { createGameV2 } from "./engine";
import { decisionReasons, sensitivityOptions } from "./exam2";
import { stableShuffle } from "./shuffle";
import { generateActivities } from "./project/generator";
import { prepareV2 } from "../testSupport/gameFixture";
import { sampleProject } from "../testSupport/projectFixture";
import { tutorial } from "../features/v22/HowToPlay";

const inRange = (n: number) => n >= 5 && n <= 7;
describe("Regla de preguntas: entre 5 y 7 opciones, con trampas", () => {
  it("práctica, casos aplicados y comité de las nueve misiones", () => {
    for (const s of scenarios) {
      for (const q of questionsV2(createGameV2(s.id))) expect(inRange(q.options.length), `${s.id}/${q.id}`).toBe(true);
      for (const q of committeeQuestions(prepareV2(s.id))) expect(inRange(q.options.length), `${s.id}/comité ${q.id}`).toBe(true);
    }
  });
  it("Centro de aprendizaje, Examen 2, tutorial y actividades generadas", () => {
    for (const c of concepts) expect(inRange(c.exercise.options.length), c.id).toBe(true);
    for (const list of [exam2.objectives, exam2.tradeoff.options, exam2.sunkQuestion.options, sensitivityOptions(), decisionReasons]) expect(inRange(list.length)).toBe(true);
    for (const t of tutorial) expect(inRange(t.o.length), t.q).toBe(true);
    for (const a of generateActivities(sampleProject())) expect(inRange(a.options.length), a.id).toBe(true);
  });
  it("la respuesta correcta no aparece siempre en la primera posición", () => {
    const firstCorrect = concepts.filter((c) => stableShuffle(c.id, c.exercise.options)[0].correct).length;
    expect(firstCorrect).toBeLessThan(concepts.length / 2);
    const lists: { id: string; correct: boolean }[][] = [exam2.objectives.map((o) => ({ id: o.id, correct: o.valid })), exam2.tradeoff.options, exam2.sunkQuestion.options];
    const examFirst = lists.filter((l, i) => stableShuffle(["obj", "tr", "sunk"][i], l)[0].correct).length;
    expect(examFirst).toBeLessThan(3);
  });
});

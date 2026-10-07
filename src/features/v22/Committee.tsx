import { useState } from "react";
import { Users } from "lucide-react";
import type { GameState } from "../../domain/types";
import type { Action } from "../../domain/engine";
import { committeeQuestions, committeeScore } from "../../domain/committee";
import { helpPolicy } from "../../domain/help";
import { Panel, Button } from "../../components/ui";
import { useDraftGuard, different } from "../../components/workbench";
import { ConceptLinks, Deferred, Status } from "./common";
import { fb, FeedbackLegend, type FeedbackLevel } from "../../components/feedback";

/** Comité evaluador: defend the project with evidence. Questions are derived from the game. */
export default function Committee({ g, send }: { g: GameState; send: (a: Action) => void }) {
  const qs = committeeQuestions(g),
    saved = g.v2!.v22!.committee?.answers ?? {},
    [answers, setAnswers] = useState<Record<string, string>>(saved),
    help = helpPolicy(g);
  useDraftGuard(different(answers, saved));
  if (!qs.length) return null;
  const confirmed = Object.keys(saved).length === qs.length,
    marks = confirmed && help.immediate;
  const levelOf = (credit: number): FeedbackLevel => (credit === 1 ? "ok" : credit > 0 ? "alerta" : "grave");
  const chosen = qs.map((q) => q.options.find((o) => o.id === saved[q.id])).filter((o) => !!o),
    count = (k: FeedbackLevel) => chosen.filter((o) => levelOf(o.credit) === k).length;
  return (
    <Panel title="Defiende tu proyecto ante el comité evaluador" kicker="COMITÉ EVALUADOR"><ConceptLinks ids={["evaluacion-exante", "costo-hundido"]} />
      <p className="v22-committee-lead">
        <Users size={18} aria-hidden /> El comité revisó tu expediente. Sus preguntas salen de tus decisiones: alternativa, flujos, valoración y ODS. La defensa
        aporta una parte pequeña de la nota.
      </p>
      {qs.map((q, i) => (
        <fieldset key={q.id} className="v22-choice">
          <legend>
            {i + 1}. {q.question} <small className="badge">{q.concept}</small>
          </legend>
          {q.options.map((o) => (
            <label
              key={o.id}
              className={answers[q.id] === o.id ? "chosen" : ""}
              {...(marks && saved[q.id] === o.id && answers[q.id] === o.id ? fb(levelOf(o.credit), o.feedback) : {})}
            >
              <input type="radio" name={"c" + q.id} checked={answers[q.id] === o.id} disabled={!!g.snapshot} onChange={() => setAnswers({ ...answers, [q.id]: o.id })} />
              {o.text}
            </label>
          ))}
        </fieldset>
      ))}
      <Button disabled={!!g.snapshot || qs.some((q) => !answers[q.id])} onClick={() => send({ type: "committee", answers })}>
        Presentar respuestas al comité
      </Button>
      {confirmed &&
        (help.immediate ? (
          <>
            <p role="status">Defensa: {committeeScore(g)}/100.</p>
            <FeedbackLegend counts={{ ok: count("ok"), alerta: count("alerta"), grave: count("grave") }} />
            <details className="fb-details">
              <summary>Ver la retroalimentación en lista</summary>
              <ul className="findings">
                {qs.map((q, i) =>
                  q.options
                    .filter((o) => o.id === saved[q.id])
                    .map((o) => (
                      <Status key={q.id} level={levelOf(o.credit)}>
                        Pregunta {i + 1}: {o.feedback}
                      </Status>
                    )),
                )}
              </ul>
            </details>
          </>
        ) : (
          <Deferred />
        ))}
    </Panel>
  );
}

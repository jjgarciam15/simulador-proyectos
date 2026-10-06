import { useState } from "react";
import { Users } from "lucide-react";
import type { GameState } from "../../domain/types";
import type { Action } from "../../domain/engine";
import { committeeQuestions, committeeScore } from "../../domain/committee";
import { helpPolicy } from "../../domain/help";
import { Panel, Button } from "../../components/ui";
import { useDraftGuard, different } from "../../components/workbench";
import { ConceptLinks, Deferred, Status } from "./common";

/** Comité evaluador: defend the project with evidence. Questions are derived from the game. */
export default function Committee({ g, send }: { g: GameState; send: (a: Action) => void }) {
  const qs = committeeQuestions(g),
    saved = g.v2!.v22!.committee?.answers ?? {},
    [answers, setAnswers] = useState<Record<string, string>>(saved),
    help = helpPolicy(g);
  useDraftGuard(different(answers, saved));
  if (!qs.length) return null;
  const confirmed = Object.keys(saved).length === qs.length;
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
            <label key={o.id} className={answers[q.id] === o.id ? "chosen" : ""}>
              <input type="radio" name={"c" + q.id} checked={answers[q.id] === o.id} disabled={!!g.snapshot} onChange={() => setAnswers({ ...answers, [q.id]: o.id })} />
              {o.text}
            </label>
          ))}
          {confirmed && help.immediate && (
            <ul className="findings">
              {q.options
                .filter((o) => o.id === saved[q.id])
                .map((o) => (
                  <Status key={o.id} level={o.credit === 1 ? "ok" : o.credit > 0 ? "alerta" : "grave"}>
                    {o.feedback}
                  </Status>
                ))}
            </ul>
          )}
        </fieldset>
      ))}
      <Button disabled={!!g.snapshot || qs.some((q) => !answers[q.id])} onClick={() => send({ type: "committee", answers })}>
        Presentar respuestas al comité
      </Button>
      {confirmed && (help.immediate ? <p role="status">Defensa: {committeeScore(g)}/100.</p> : <Deferred />)}
    </Panel>
  );
}

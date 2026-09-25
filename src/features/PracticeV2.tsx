import { useState } from "react";
import type { GameState } from "../domain/types";
import type { Action } from "../domain/engine";
import {
  questionsV2,
  practiceFeedback,
  practiceAnalytics,
} from "../domain/questionsV2";
import { Panel, Button } from "../components/ui";
export default function PracticeV2({
  g,
  send,
}: {
  g: GameState;
  send: (a: Action) => void;
}) {
  const qs = questionsV2(g).filter((q) => q.phase === g.phase),
    [index, setIndex] = useState(0),
    [choices, setChoices] = useState<string[]>([]),
    q = qs[index],
    attempt = g.v2!.assessments[q.id],
    closed = !!attempt?.solved || (attempt?.choices.length ?? 0) >= 3;
  const analytics = practiceAnalytics(g);
  return (
    <Panel
      title="Entrena tu criterio"
      kicker="PRÁCTICA · NO SUSTITUYE DECISIONES"
    >
      <p>
        Hasta tres intentos: 100 %, 80 % y 60 % del ejercicio. Cada pista reduce{" "}
        {q.penalty} puntos del ejercicio. En la nota final, pistas cuestan{" "}
        {q.penalty * 0.1} puntos e intentos extra 0,2, con tope conjunto de 8.
        Se conserva cada intento.
      </p>
      {g.outcome && (
        <p>
          La misión ya cerró: el repaso posterior queda registrado y no modifica
          su nota ni sus premios.
        </p>
      )}
      <details>
        <summary>Mi recorrido de aprendizaje · solo en este navegador</summary>
        <p>
          {analytics.cases} casos respondidos; {analytics.solved} resueltos;{" "}
          {analytics.attempts} respuestas; {analytics.hints} pistas;{" "}
          {analytics.retries} reintentos. No equivale a una medición validada de
          dominio.
        </p>
      </details>
      {!closed && (attempt?.choices.length ?? 0) >= 2 && (
        <p className="review-notice">
          Pausa de apoyo: revisa el concepto en las herramientas de esta etapa y
          prueba una relación a la vez. La tercera pista está disponible si la
          necesitas; abrir este consejo no descuenta puntos ni cambia tus
          recursos.
        </p>
      )}
      <div className="actions">
        {qs.map((v, i) => (
          <Button
            secondary
            key={v.id}
            disabled={i === index}
            onClick={() => {
              setIndex(i);
              setChoices([]);
            }}
          >
            {i === 0 ? "Caso inicial" : i===1 ? "Aplicar en otra situación" : v.concept}
          </Button>
        ))}
      </div>
      <fieldset className="learning-choices" disabled={closed}>
        <legend>
          {q.question} ·{" "}
          {q.answers.length === 1
            ? "Elige una respuesta"
            : "Selecciona todas las correctas"}
        </legend>
        {q.options.map((o) => (
          <label key={o.id}>
            <input
              type={q.answers.length === 1 ? "radio" : "checkbox"}
              name="v2-question"
              checked={choices.includes(o.id)}
              onChange={() =>
                setChoices(
                  q.answers.length === 1
                    ? [o.id]
                    : choices.includes(o.id)
                      ? choices.filter((id) => id !== o.id)
                      : [...choices, o.id],
                )
              }
            />
            {o.text}
          </label>
        ))}
      </fieldset>
      {!closed && (
        <div className="actions">
          <Button
            disabled={!choices.length}
            onClick={() => send({ type: "answerV2", id: q.id, choices })}
          >
            Confirmar intento
          </Button>
          <Button
            secondary
            disabled={(attempt?.hints ?? 0) >= 3}
            onClick={() => send({ type: "hintV2", id: q.id })}
          >
            Pista {(attempt?.hints ?? 0) + 1}
          </Button>
        </div>
      )}
      {(attempt?.hints ?? 0) > 0 && (
        <p role="status">{q.hints[attempt!.hints - 1]}</p>
      )}
      {attempt && (
        <div role="status" className="learning-feedback">
          <strong>
            {closed
              ? `${attempt.score.toFixed(0)}/100 en esta práctica`
              : `Intento ${attempt.choices.length}/3: revisa el alcance de tu conclusión`}
          </strong>
          <p>{practiceFeedback(g, q.id)}</p>
          <details>
            <summary>Ver mis intentos</summary>
            {attempt.choices.map((row, i) => (
              <p key={i}>
                {i + 1}:{" "}
                {row
                  .map((id) => q.options.find((o) => o.id === id)?.text)
                  .join("; ")}
              </p>
            ))}
          </details>
        </div>
      )}
    </Panel>
  );
}

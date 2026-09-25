import { useState } from "react";
import { AlertTriangle, Scale } from "lucide-react";
import type { GameState } from "../domain/types";
import type { Action } from "../domain/engine";
import { available } from "../domain/engine";
import {
  describeEffects,
  effectCash,
  fillText,
  pendingDilemma,
  dilemmaById,
} from "../domain/dilemmas";
import { Button } from "../components/ui";

/** Pending dilemma: no option is perfect; immediate effects are visible, delayed ones are not revealed. */
export function DilemmaPanel({
  g,
  send,
}: {
  g: GameState;
  send: (a: Action) => void;
}) {
  const t = pendingDilemma(g),
    [choice, setChoice] = useState("");
  if (!t) return null;
  const selected = t.choices.find((c) => c.id === choice);
  return (
    <section className="dilemma" role="region" aria-label="Dilema pendiente">
      <div className="eyebrow">
        <Scale size={15} /> DILEMA · {t.concept.toUpperCase()}
      </div>
      <h3>{fillText(g, t.title)}</h3>
      <p>{fillText(g, t.context)}</p>
      <div className="dilemma-choices" role="radiogroup" aria-label="Opciones">
        {t.choices.map((c) => {
          const cost = -effectCash(g, c.effects);
          return (
            <button
              key={c.id}
              role="radio"
              aria-checked={choice === c.id}
              className={choice === c.id ? "chosen" : ""}
              onClick={() => setChoice(c.id)}
            >
              <strong>{c.label}</strong>
              <small>Efecto inmediato: {describeEffects(g, c.effects)}</small>
              {g.difficulty === "guiado" && c.delayed && (
                <small className="muted">
                  Puede tener consecuencias posteriores.
                </small>
              )}
              {cost > available(g) && (
                <small className="warning">
                  <AlertTriangle size={13} /> Saldo libre insuficiente.
                </small>
              )}
            </button>
          );
        })}
      </div>
      {selected && (
        <p className="muted">
          Al confirmar se registrará en la bitácora. Los efectos diferidos, si
          existen, aparecerán al comprometer la inversión.
        </p>
      )}
      <Button
        disabled={!selected}
        onClick={() => {
          send({ type: "dilemma", choice });
          setChoice("");
        }}
      >
        Confirmar decisión
      </Button>
    </section>
  );
}

/** Resolved dilemmas and the consequences they produced. */
export function ConsequenceLog({ g }: { g: GameState }) {
  const list = g.v2?.consequences ?? [],
    decided = (g.v2?.dilemmas ?? []).filter((d) => d.choice);
  if (!list.length && !decided.length) return null;
  return (
    <section className="consequence-log">
      <h3>Consecuencias</h3>
      {list.map((c, i) => (
        <article key={i} className={"consequence " + c.kind.replace("é", "e")}>
          <span className="badge">{c.kind}</span>
          <strong>{c.title}</strong>
          <p>{c.detail}</p>
          <small>Mes {c.month}</small>
        </article>
      ))}
      {!!(g.v2?.delayed ?? []).length && (
        <p className="muted">
          {g.v2!.delayed!.length} decisión(es) pueden tener consecuencias
          diferidas cuando se comprometa la inversión.
        </p>
      )}
      {decided.length > 0 && (
        <p className="muted">
          Dilemas resueltos:{" "}
          {decided
            .map((d) => {
              const t = dilemmaById(d.id);
              return t ? fillText(g, t.title) : d.id;
            })
            .join(" · ")}
        </p>
      )}
    </section>
  );
}

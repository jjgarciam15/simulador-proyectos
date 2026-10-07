import { useState } from "react";
import type { GameState } from "../domain/types";
import { available, type Action } from "../domain/engine";
import {
  actorCommitment,
  negotiationChoices,
  negotiationQuote,
  negotiationCommitments,
  type NegotiationChoice,
} from "../domain/negotiations";
import { Panel, Field, Button } from "../components/ui";
import { money } from "../domain/finance";
import { gameActors } from "../domain/actors";
import { StanceBadge } from "./ActorPanel";

export function NegotiationCommitments({ g }: { g: GameState }) {
  const rows = negotiationCommitments(g);
  if (!rows.length) return null;
  return (
    <div className="review-notice">
      <h4>Acuerdos que llevas a la inversión</h4>
      {rows.map((c) => (
        <p key={c.id}>
          <strong>{c.actor.name}</strong>: {money(c.allocated)} /{" "}
          {money(c.minimum)} en {c.name}.{" "}
          {c.funded
            ? "Respaldado: apoyo +8 y legitimidad +3 al invertir."
            : "Sin respaldo: apoyo −10 y legitimidad −12 al invertir; aumenta la exposición a oposición."}
        </p>
      ))}
      <p>
        La reserva comprometida pertenece al presupuesto del proyecto; no es
        dinero adicional. Puedes revisarla en Preparación antes de invertir.
      </p>
    </div>
  );
}
export default function NegotiationDesk({
  g,
  send,
}: {
  g: GameState;
  send: (a: Action) => void;
}) {
  const actors = gameActors(g),
    [actorId, setActorId] = useState(actors[0].id),
    [choice, setChoice] = useState<NegotiationChoice | null>(null),
    record = g.v2?.negotiations?.[actorId],
    condition = actorCommitment(g, actorId),
    closed = record?.status === "acuerdo" || record?.status === "cerrado",
    quote = choice && !closed ? negotiationQuote(g, actorId, choice) : null;
  return (
    <Panel
      title="La mesa de acuerdos"
      kicker="NEGOCIACIÓN · HASTA TRES RONDAS POR ACTOR"
    >
      <p>
        Escuchar requiere tiempo. Una oferta sin diagnóstico compartido puede
        ser rechazada. Un acuerdo mejora el apoyo si después reservas los
        recursos prometidos; también puedes financiar acompañamiento inmediato o
        cerrar sin acuerdo.
      </p>
      <Field label="Actor en la mesa">
        <select
          value={actorId}
          onChange={(e) => {
            setActorId(e.target.value);
            setChoice(null);
          }}
        >
          {actors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </Field>
      <p>
        <strong>{condition.actor.name}</strong> · {condition.actor.affected}.
        Aporta {condition.actor.contribution.toLowerCase()}. Rondas usadas:{" "}
        {record?.rounds.length ?? 0}/3.
      </p>
      {g.actorProfiles && (
        <p>
          Posición actual: <StanceBadge actor={condition.actor} />
          {!condition.actor.government && condition.actor.stance <= -50 && " Está muy en contra: solo acepta un acuerdo si antes lo escuchas en esta mesa."}
          {!condition.actor.government && " Un acuerdo mejora su posición; cerrar sin acuerdo la empeora y cuesta más apoyo si ya está en contra."}
        </p>
      )}
      {(record?.consulted || g.studies.includes("social") || closed) && (
        <p>
          Condición identificada: reservar al menos {money(condition.minimum)}{" "}
          en {condition.name}. Esta exigencia es un supuesto educativo de la
          misión. Evidencia de seguimiento: {condition.evidence}
        </p>
      )}
      {closed ? (
        <p role="status">
          {record?.status === "acuerdo"
            ? "Mesa cerrada con acuerdo condicionado."
            : "Mesa cerrada. Conservas el registro de lo negociado."}
        </p>
      ) : (
        <>
          <div className="actions">
            {Object.entries(negotiationChoices).map(([id, label]) => (
              <button
                className="chip"
                aria-pressed={choice === id}
                key={id}
                onClick={() => setChoice(id as NegotiationChoice)}
              >
                {label}
              </button>
            ))}
          </div>
          {quote && (
            <div className="review-notice">
              <h4>Propuesta antes de confirmar</h4>
              <p>
                {money(quote.cost)} · {quote.months} meses · apoyo{" "}
                {quote.support > 0 ? "+" : ""}
                {quote.support} · legitimidad {quote.reputation > 0 ? "+" : ""}
                {quote.reputation}.
              </p>
              <p>{quote.detail}</p>
              <Button
                disabled={quote.cost > available(g)}
                onClick={() => {
                  send({ type: "negotiate", actorId, choice: choice! });
                  setChoice(null);
                }}
              >
                Confirmar ronda
              </Button>
              {quote.cost > available(g) && (
                <p>
                  No hay caja libre suficiente. Selecciona otra respuesta o
                  consigue financiación.
                </p>
              )}
            </div>
          )}
        </>
      )}
      <details>
        <summary>Registro de esta negociación</summary>
        {record?.rounds.map((r, i) => (
          <p key={i}>
            <strong>
              Ronda {i + 1}: {negotiationChoices[r.choice]}.
            </strong>{" "}
            {r.detail} Costo {money(r.cost)}; {r.months} meses.
          </p>
        ))}
      </details>
      <NegotiationCommitments g={g} />
    </Panel>
  );
}

import { Landmark, ThumbsDown, ThumbsUp, Minus } from "lucide-react";
import type { GameState } from "../domain/types";
import type { Action } from "../domain/engine";
import { scenarioById } from "../data/scenarios";
import { gameActors, opposition, stanceLabel, stanceShift, type GameActor } from "../domain/actors";
import { Panel } from "../components/ui";

/** Position of an actor: icon + word + value (never color alone). Government is always neutral. */
export function StanceBadge({ actor, initial = false }: { actor: GameActor; initial?: boolean }) {
  if (actor.government)
    return (
      <span className="stance neutral">
        <Landmark size={13} aria-hidden /> Gobierno · posición neutral
      </span>
    );
  const value = initial ? actor.position : actor.stance,
    label = stanceLabel(value),
    Icon = label === "en contra" ? ThumbsDown : label === "a favor" ? ThumbsUp : Minus,
    cls = label === "en contra" ? "against" : label === "a favor" ? "favour" : "neutral";
  return (
    <span className={"stance " + cls}>
      <Icon size={13} aria-hidden /> {label.charAt(0).toUpperCase() + label.slice(1)} ({value > 0 ? "+" : ""}
      {value})
    </span>
  );
}

const actions: [string, string, number][] = [
  ["consultar", "Consultar · 1 mes", 0.003],
  ["negociar", "Negociar · 2 meses", 0.008],
  ["informar", "Informar", 0.001],
  ["involucrar", "Involucrar · 3 meses", 0.012],
  ["monitorear", "Monitorear", 0.0005],
  ["ignorar", "Ignorar", 0],
];

/** «Nadie ejecuta un proyecto a solas»: power × interest matrix, each actor's sheet and position, and the relation strategy. */
export default function ActorPanel({ g, send }: { g: GameState; send: (a: Action) => void }) {
  const s = scenarioById(g.scenarioId),
    actors = gameActors(g),
    drawn = !!g.actorProfiles,
    risk = opposition(g),
    riskLabel = risk >= 0.6 ? "alta" : risk >= 0.25 ? "media" : risk > 0 ? "baja" : "nula";
  return (
    <Panel title="Nadie ejecuta un proyecto a solas" kicker="04 / ACTORES">
      {drawn && (
        <p className="muted">
          Los perfiles de los actores se sortean en cada partida (código {g.seed}): poder, interés y posición cambian de una partida a otra, así que lee sus fichas
          antes de ubicarlos. Las instituciones de gobierno mantienen siempre una posición neutral. Tus decisiones mueven la posición de los demás.
        </p>
      )}
      <div className="stakeholder-matrix">
        <span className="axis-y">PODER →</span>
        <span className="axis-x">INTERÉS →</span>
        <span className="quadrant q1">Mantener satisfechos</span>
        <span className="quadrant q2">Gestionar de cerca</span>
        <span className="quadrant q3">Monitorear</span>
        <span className="quadrant q4">Mantener informados</span>
        {actors.map(
          (a, i) =>
            (!g.v2 || g.v2.actorMap[a.id]) && (
              <span
                className={"actor-dot " + (a.government ? "neutral" : stanceLabel(a.stance) === "en contra" ? "against" : stanceLabel(a.stance) === "a favor" ? "favour" : "neutral")}
                key={a.id}
                style={{
                  left: (g.v2 ? (g.v2.actorMap[a.id]?.interest === "alto" ? 72 : 25) : 10 + a.interest * 0.75) + "%",
                  bottom: (g.v2 ? (g.v2.actorMap[a.id]?.power === "alto" ? 72 : 25) : 10 + a.power * 0.7) + "%",
                }}
                title={`${a.name} · ${a.government ? "gobierno, neutral" : stanceLabel(a.stance)}`}
              >
                {i + 1}
              </span>
            ),
        )}
      </div>
      {drawn && (
        <p className="actor-legend muted">
          Color del punto: <span className="stance favour">a favor</span> <span className="stance neutral">neutral</span> <span className="stance against">en contra</span> ·
          <span>
            Oposición organizada: <strong>{riskLabel}</strong>.
          </span>{" "}
          Los actores poderosos en contra aumentan la probabilidad de conflictos sociales durante la ejecución y
          encabezan el reclamo.
        </p>
      )}
      <div className="actors-list">
        {actors.map((a, i) => (
          <article key={a.id}>
            <div className="actor-heading">
              <span className="avatar">{i + 1}</span>
              <div>
                <h4>{a.name}</h4>
                <p>
                  {drawn ? (
                    <>
                      <StanceBadge actor={a} />
                      {!a.government && a.stance !== a.position && <> · al inicio: {stanceLabel(a.position)} ({a.position > 0 ? "+" : ""}{a.position})</>}
                    </>
                  ) : a.position < 0 ? (
                    "Posición inicial: cautelosa"
                  ) : (
                    "Posición inicial: favorable"
                  )}{" "}
                  · Poder {a.power}/100 · Interés {a.interest}/100
                </p>
              </div>
            </div>
            <p className="muted">
              Afectación: {a.affected}. Aporta: {a.contribution}. Recursos: {a.resources}/100; bloqueo potencial: {a.power >= 80 ? "alto" : a.power >= 60 ? "medio" : "bajo"}.
              {drawn && !a.government && stanceLabel(a.stance) === "en contra" && a.power >= 60 && " Actor poderoso en contra: ignorarlo cuesta más apoyo y conviene escucharlo antes de negociar."}
            </p>
            {g.actorActions[a.id] ? (
              <span className="badge">Decisión: {g.actorActions[a.id]}</span>
            ) : (
              <div className="actor-actions">
                {actions.map(([key, name, cost]) => (
                  <button className="chip" key={key} onClick={() => send({ type: "actor", id: a.id, choice: key })}>
                    {name}
                    <small>
                      {cost * s.budget} M{drawn && !a.government && stanceShift[key] ? ` · posición ${stanceShift[key] > 0 ? "+" : ""}${stanceShift[key]}` : ""}
                    </small>
                  </button>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </Panel>
  );
}

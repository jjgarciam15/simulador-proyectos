import { useState } from "react";
import type { GameState } from "../domain/types";
import type { Action } from "../domain/engine";
import {
  chainBank,
  chainLevels,
  chainV2Score,
  chainReview,
  sdgReview,
  sdgReasonScore,
  type ChainLevel,
} from "../domain/projectV2";
import { Panel, Button, Field } from "../components/ui";
import { useDraftGuard, different } from "../components/workbench";
import { scenarioById } from "../data/scenarios";
import { difficultyRules } from "../data/balance";

export function ChainBuilder({
  g,
  send,
}: {
  g: GameState;
  send: (a: Action) => void;
}) {
  const [cards, setCards] = useState(g.v2!.chain),
    [links, setLinks] = useState(g.v2!.connections),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [over, setOver] = useState("");
  const bank = chainBank(g),
    label = (id: string) => bank.find((b) => b.id === id)?.label ?? id,
    detail = difficultyRules[g.difficulty].feedback,
    review = chainReview(g);
  useDraftGuard(
    different(cards, g.v2!.chain) || different(links, g.v2!.connections),
  );
  function choose(id: string, level: string) {
    setCards([
      ...cards.filter((c) => c.id !== id),
      ...(level ? [{ id, level: level as ChainLevel }] : []),
    ]);
    if (!level) setLinks(links.filter((l) => l.from !== id && l.to !== id));
  }
  return (
    <Panel
      title="Construye la cadena de valor"
      kicker="SELECCIONA · CLASIFICA · CONECTA"
    >
      <p>
        El banco mezcla tarjetas correctas, parcialmente relacionadas y
        distractores. Arrastra cada tarjeta útil a su nivel (o usa el selector),
        deja fuera las que no explican tu intervención y conecta cómo cada
        elemento permite el siguiente.
      </p>
      <div className="chain-bank">
        {bank.map((c) => {
          const placed = cards.find((p) => p.id === c.id);
          return (
            <article
              key={c.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/plain", c.id)}
              className={placed ? "placed" : ""}
            >
              <strong>{c.label}</strong>
              <Field label={"Ubicar: " + c.label}>
                <select
                  value={placed?.level ?? ""}
                  onChange={(e) => choose(c.id, e.target.value)}
                >
                  <option value="">No utilizar</option>
                  {chainLevels.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </Field>
            </article>
          );
        })}
      </div>
      <div className="chain-route">
        {chainLevels.map((level) => (
          <div
            key={level}
            className={over === level ? "drop-over" : ""}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(level);
            }}
            onDragLeave={() => setOver("")}
            onDrop={(e) => {
              e.preventDefault();
              setOver("");
              const id = e.dataTransfer.getData("text/plain");
              if (bank.some((b) => b.id === id)) choose(id, level);
            }}
            aria-label={"Nivel " + level}
          >
            <strong>{level}</strong>
            {cards
              .filter((c) => c.level === level)
              .map((c) => (
                <p key={c.id}>
                  {label(c.id)}{" "}
                  <button
                    className="text-btn"
                    aria-label={"Quitar " + label(c.id)}
                    onClick={() => choose(c.id, "")}
                  >
                    ×
                  </button>
                </p>
              ))}
            {!cards.some((c) => c.level === level) && (
              <small className="muted">Suelta aquí una tarjeta</small>
            )}
          </div>
        ))}
      </div>
      <div className="two-col">
        <Field label="Desde">
          <select value={from} onChange={(e) => setFrom(e.target.value)}>
            <option value="">Seleccionar origen</option>
            {cards.map((c) => (
              <option value={c.id} key={c.id}>
                {c.level} · {label(c.id)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Contribuye a">
          <select value={to} onChange={(e) => setTo(e.target.value)}>
            <option value="">Seleccionar destino</option>
            {cards.map((c) => (
              <option value={c.id} key={c.id}>
                {c.level} · {label(c.id)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Button
        secondary
        disabled={
          !from ||
          !to ||
          from === to ||
          links.some((l) => l.from === from && l.to === to)
        }
        onClick={() => setLinks([...links, { from, to }])}
      >
        Conectar tarjetas
      </Button>
      {links.map((l, i) => (
        <p key={l.from + l.to}>
          {label(l.from)} → {label(l.to)}{" "}
          <button
            className="text-btn"
            onClick={() => setLinks(links.filter((_, j) => j !== i))}
          >
            Quitar conexión {i + 1}
          </button>
        </p>
      ))}
      <Button
        onClick={() => send({ type: "chain", cards, connections: links })}
      >
        Confirmar cadena construida
      </Button>
      {g.v2!.chain.length > 0 && (
        <div role="status" className="chain-feedback">
          <p>
            <strong>Coherencia confirmada: {chainV2Score(g)}/100.</strong> Se
            evalúan niveles cubiertos, clasificación de cada tarjeta y
            relaciones entre niveles consecutivos.
          </p>
          {detail === "score" ? (
            <p className="muted">
              En modo difícil no se indica qué tarjetas fallan.
            </p>
          ) : (
            <ul className="findings">
              {review
                .filter((r) => r.status !== "correcta")
                .map((r) => (
                  <li
                    key={r.id}
                    className={
                      "finding " + (r.status === "parcial" ? "alerta" : "grave")
                    }
                  >
                    <strong>{r.label}</strong> ({r.status})
                    {detail === "full" && <>: {r.why}</>}
                  </li>
                ))}
              {review.every((r) => r.status === "correcta") && (
                <li className="finding ok">
                  Todas las tarjetas usadas están bien clasificadas.
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </Panel>
  );
}
export function ActorBuilder({
  g,
  send,
}: {
  g: GameState;
  send: (a: Action) => void;
}) {
  const s = scenarioById(g.scenarioId),
    [positions, setPositions] = useState(g.v2!.actorMap);
  useDraftGuard(different(positions, g.v2!.actorMap));
  return (
    <Panel title="Ubica poder e interés" kicker="MAPA DE ACTORES">
      <p>
        Usa las fichas de actores para decidir qué significa cada posición. Alto
        corresponde a 60 o más en la escala de referencia. Después elige una
        estrategia de relación: ubicar un actor no sustituye consultarlo.
      </p>
      {s.actors.map((a) => (
        <div className="v2-row" key={a.id}>
          <h4>{a.name}</h4>
          <p>
            {a.affected}. Capacidad de presión: {a.resources}. Aporte:{" "}
            {a.contribution}.
          </p>
          <div className="two-col">
            {(["power", "interest"] as const).map((key) => (
              <Field
                key={key}
                label={(key === "power" ? "Poder" : "Interés") + " · " + a.name}
              >
                <select
                  value={positions[a.id]?.[key] ?? ""}
                  onChange={(e) =>
                    setPositions({
                      ...positions,
                      [a.id]: {
                        ...positions[a.id],
                        [key]: e.target.value,
                      } as (typeof positions)[string],
                    })
                  }
                >
                  <option value="">Ubicar</option>
                  <option value="alto">Alto</option>
                  <option value="bajo">Bajo</option>
                </select>
              </Field>
            ))}
          </div>
        </div>
      ))}
      <Button onClick={() => send({ type: "actorMap", value: positions })}>
        Confirmar matriz de actores
      </Button>
    </Panel>
  );
}
export function SDGBuilder({
  g,
  send,
}: {
  g: GameState;
  send: (a: Action) => void;
}) {
  const [reasons, setReasons] = useState(g.v2!.sdgReasons);
  useDraftGuard(different(reasons, g.v2!.sdgReasons));
  return (
    <Panel title="Sustenta los ODS elegidos">
      <p>
        Primero confirma la selección en ODS y alineación. Después relaciona
        cada objetivo con una evidencia y reconoce las tensiones; escoger más no
        garantiza una mejor nota.
      </p>
      {g.sdgs.map((id) => {
        const r = reasons[id] ?? {
          kind: "directa" as const,
          evidence: "",
          text: "",
        };
        return (
          <div key={id} className="v2-row">
            <h4>ODS {id}</h4>
            <Field label={"Relación del ODS " + id}>
              <select
                value={r.kind}
                onChange={(e) =>
                  setReasons({
                    ...reasons,
                    [id]: {
                      ...r,
                      kind: e.target.value as "directa" | "indirecta",
                    },
                  })
                }
              >
                <option value="directa">Directa</option>
                <option value="indirecta">Indirecta</option>
              </select>
            </Field>
            <Field label={"Evidencia ODS " + id}>
              <select
                value={r.evidence}
                onChange={(e) =>
                  setReasons({
                    ...reasons,
                    [id]: { ...r, evidence: e.target.value },
                  })
                }
              >
                <option value="">Seleccionar</option>
                <option value="producto">Producto verificable</option>
                <option value="resultado">Resultado en la población</option>
                <option value="impacto">Impacto o externalidad esperada</option>
                <option value="gestion">Solo ejecución del presupuesto</option>
              </select>
            </Field>
            <Field label={"Argumento ODS " + id}>
              <textarea
                maxLength={200}
                value={r.text}
                onChange={(e) =>
                  setReasons({
                    ...reasons,
                    [id]: { ...r, text: e.target.value },
                  })
                }
              />
            </Field>
          </div>
        );
      })}
      <Button
        disabled={!g.sdgs.length}
        onClick={() =>
          (() => {
            const value = Object.fromEntries(
              g.sdgs.filter((id) => reasons[id]).map((id) => [id, reasons[id]]),
            );
            setReasons(value);
            send({ type: "sdgReasons", value });
          })()
        }
      >
        Confirmar justificaciones ODS
      </Button>
      {Object.keys(g.v2!.sdgReasons).length > 0 && (() => {
        const r = sdgReview(g),
          detail = difficultyRules[g.difficulty].feedback;
        return (
          <div role="status" className="chain-feedback">
            <p>
              <strong>Valoración de tu selección: {sdgReasonScore(g).toFixed(0)}/100.</strong>{" "}
              {r.excess > 0 && `${r.excess} ODS sin relación con el proyecto restan puntos. `}
              {r.omitted.length > 0 && `Hay ${r.omitted.length} ODS relacionados que no seleccionaste.`}
            </p>
            {detail !== "score" && (
              <ul className="findings">
                {r.rows.map((row) => (
                  <li key={row.id} className={"finding " + (row.status === "bien sustentado" ? "ok" : row.status === "sin relación" ? "grave" : "alerta")}>
                    <strong>ODS {row.id}</strong> · {row.status}
                    {detail === "full" && <>: {row.why}</>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })()}
    </Panel>
  );
}

import { useState } from "react";
import type { GameState } from "../domain/types";
import type { Action } from "../domain/engine";
import {
  chainBank,
  chainLevels,
  chainV2Score,
  type ChainPlacement,
  type ChainLevel,
} from "../domain/projectV2";
import { Panel, Button, Field } from "../components/ui";
import { useDraftGuard, different } from "../components/workbench";
import { scenarioById } from "../data/scenarios";

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
    [to, setTo] = useState("");
  const bank = chainBank(g);
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
        No necesitas usar todas las tarjetas. Selecciona las que explican tu
        intervención, ubícalas y conecta cómo una permite la siguiente. Las
        tarjetas describen propuestas, no verdades garantizadas.
      </p>
      <div className="chain-bank">
        {bank.map((c) => (
          <article key={c.id}>
            <strong>{c.label}</strong>
            <Field label={"Ubicar: " + c.label}>
              <select
                value={cards.find((p) => p.id === c.id)?.level ?? ""}
                onChange={(e) => choose(c.id, e.target.value)}
              >
                <option value="">No utilizar</option>
                {chainLevels.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </Field>
          </article>
        ))}
      </div>
      <div className="chain-route">
        {chainLevels.map((level) => (
          <div key={level}>
            <strong>{level}</strong>
            {cards
              .filter((c) => c.level === level)
              .map((c) => (
                <p key={c.id}>{bank.find((b) => b.id === c.id)?.label}</p>
              ))}
          </div>
        ))}
      </div>
      <div className="two-col">
        <Field label="Desde">
          <select value={from} onChange={(e) => setFrom(e.target.value)}>
            <option value="">Seleccionar origen</option>
            {cards.map((c) => (
              <option value={c.id} key={c.id}>
                {bank.find((b) => b.id === c.id)?.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Contribuye a">
          <select value={to} onChange={(e) => setTo(e.target.value)}>
            <option value="">Seleccionar destino</option>
            {cards.map((c) => (
              <option value={c.id} key={c.id}>
                {bank.find((b) => b.id === c.id)?.label}
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
          {bank.find((b) => b.id === l.from)?.label} →{" "}
          {bank.find((b) => b.id === l.to)?.label}{" "}
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
        <p role="status">
          Coherencia confirmada: {chainV2Score(g)}/100. Se consideran cobertura
          de niveles, clasificación y relaciones. Revisa si las actividades
          producen el servicio y si este puede generar el resultado.
        </p>
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
export const regulatoryEvidence = [
  [
    "observed",
    "Brecha de acceso, estructura del mercado y externalidades del caso",
  ],
  ["popularity", "Popularidad de una intervención semejante"],
  ["spending", "Disponibilidad de presupuesto para regular"],
  ["sole-price", "Un precio aislado, sin costos ni condiciones de entrada"],
  ["opinion", "Solicitud del operador sin contraste independiente"],
];
export function RegulatoryBuilder({
  g,
  send,
}: {
  g: GameState;
  send: (a: Action) => void;
}) {
  const [r, setR] = useState(g.v2!.regulatory);
  useDraftGuard(different(r, g.v2!.regulatory));
  return (
    <Panel
      title="Explica la cadena de incentivos"
      kicker="LABORATORIO REGULATORIO"
    >
      <p>
        Después de comparar instrumentos y no intervención, conecta la evidencia
        con el comportamiento que esperas. Un beneficio requiere un mecanismo, y
        ese mecanismo puede producir un efecto adverso.
      </p>
      <Field label="Evidencia del diagnóstico">
        <select
          value={r.evidence}
          onChange={(e) => setR({ ...r, evidence: e.target.value })}
        >
          <option value="">Seleccionar evidencia</option>
          {regulatoryEvidence.map(([id, t]) => (
            <option key={id} value={id}>
              {t}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Incentivo y comportamiento esperado">
        <select
          value={r.incentive}
          onChange={(e) => setR({ ...r, incentive: e.target.value })}
        >
          <option value="">Elegir mecanismo</option>
          <option value="entry">
            Información y acceso reducen barreras para competir
          </option>
          <option value="price">
            El control de precio cambia ingresos e incentivos de inversión
          </option>
          <option value="baseline">
            No intervenir conserva incentivos y evita costos nuevos
          </option>
          <option value="automatic">
            Regular garantiza calidad sin fiscalización
          </option>
          <option value="profit">
            Toda ganancia privada implica pérdida social equivalente
          </option>
        </select>
      </Field>
      <Field label="Efecto adverso que vigilarás">
        <select
          value={r.adverse}
          onChange={(e) => setR({ ...r, adverse: e.target.value })}
        >
          <option value="">Elegir tensión</option>
          <option value="oversight">
            Costos y capacidad insuficiente de fiscalización
          </option>
          <option value="barriers">
            Licencias pueden proteger al incumbente y limitar inversión
          </option>
          <option value="persistence">
            La falla puede persistir al no intervenir
          </option>
          <option value="none">
            Ninguno: el instrumento elegido elimina todos los riesgos
          </option>
          <option value="guarantee">
            Mayor gasto regulatorio garantiza mayor bienestar
          </option>
        </select>
      </Field>
      <Field label="Justificación breve · hasta 200 caracteres">
        <textarea
          maxLength={200}
          value={r.reason}
          onChange={(e) => setR({ ...r, reason: e.target.value })}
        />
      </Field>
      <Button onClick={() => send({ type: "regulatory", value: r })}>
        Confirmar argumento regulatorio
      </Button>
      <p className="muted">
        Se evalúan los vínculos estructurados; el texto queda para discusión,
        sin calificación automática de su calidad.
      </p>
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
    </Panel>
  );
}

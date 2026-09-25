import { useState } from "react";
import type { GameState } from "../domain/types";
import { scenarioById } from "../data/scenarios";
import { type Action, model, selected } from "../domain/engine";
import {
  emptyDossier,
  mgaChecks,
  causalQuality,
  chainQuality,
  indicatorReview,
} from "../domain/mga";
import { Panel, Field, Button, Tip } from "../components/ui";
import { useDraftGuard, different } from "../components/workbench";

export default function MgaLab({
  g,
  send,
}: {
  g: GameState;
  send: (a: Action) => void;
}) {
  const s = scenarioById(g.scenarioId),
    [draft, setDraft] = useState(g.mga ?? emptyDossier()),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [reviewed, setReviewed] = useState(false);
  const editable = [0, 2, 3].includes(g.phase),
    section = g.phase === 0 ? "links" : g.phase === 2 ? "chain" : "prediction";
  const dirty =
    editable &&
    (section === "prediction"
      ? draft.prediction !== (g.mga?.prediction ?? "") ||
        draft.assumption !== (g.mga?.assumption ?? "")
      : different(draft[section], (g.mga ?? emptyDossier())[section]));
  useDraftGuard(dirty);
  const nodeName = (id: string) =>
    s.nodes.find((n) => n.id === id)?.label ?? "Sin definir";
  const checks = mgaChecks(g).filter((c) => c.phase <= g.phase);
  function confirm() {
    send({ type: "mga", section, value: draft });
    setReviewed(true);
  }
  return (
    <Panel
      title={
        g.phase >= 5
          ? "Consejo de revisión MGA"
          : "Laboratorio MGA · construye tu argumento"
      }
      kicker="FORMULAR ES EXPLICAR CÓMO OCURRE EL CAMBIO"
    >
      <p>
        Tu expediente conecta la necesidad con los resultados. Los vínculos
        confirmados influyen en la coherencia y el beneficio social modelado en
        partidas nuevas. La escritura se conserva para discusión y no se
        califica automáticamente.
      </p>
      {g.phase === 0 && (
        <>
          <h4>Une las situaciones: “A contribuye a B”</h4>
          <p className="muted">
            Primero selecciona tarjetas en el árbol del problema. Después
            conecta aquí cuatro relaciones desde las causas hasta los efectos.
            La flecha indica causalidad, no el orden de construcción.
          </p>
          <div className="two-col">
            <Field label="Situación que contribuye">
              <select value={from} onChange={(e) => setFrom(e.target.value)}>
                <option value="">Selecciona el origen</option>
                {s.nodes
                  .filter((n) => g.nodes.includes(n.id))
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Situación sobre la que influye">
              <select value={to} onChange={(e) => setTo(e.target.value)}>
                <option value="">Selecciona el destino</option>
                {s.nodes
                  .filter((n) => g.nodes.includes(n.id))
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label}
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
              draft.links.length >= 8 ||
              draft.links.some((l) => l.from === from && l.to === to)
            }
            onClick={() =>
              setDraft({ ...draft, links: [...draft.links, { from, to }] })
            }
          >
            Añadir conexión →
          </Button>
          <div className="mga-links">
            {draft.links.map((l, i) => (
              <div key={l.from + ">" + l.to}>
                <span>{nodeName(l.from)}</span>
                <b>→</b>
                <span>{nodeName(l.to)}</span>
                <button
                  aria-label={"Quitar conexión " + (i + 1)}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      links: draft.links.filter((_, j) => i !== j),
                    })
                  }
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
          <Button onClick={confirm}>Confirmar mapa causal</Button>
          {reviewed && (
            <p role="status">
              Coherencia de enlaces confirmados: {Math.round(causalQuality(g))}
              /100. Revisa dirección, niveles y relaciones que no explican el
              problema.
            </p>
          )}
          <Tip title="Distinguir población y déficit">
            <p>
              La población objetivo se expresa en personas. El déficit de
              atención es demanda menos oferta, en la unidad del servicio. La
              ficha preliminar estima{" "}
              {Math.max(0, s.demand - s.supply).toLocaleString("es-CO")}{" "}
              {s.unit}; el estudio puede precisar la demanda. No sumes
              cantidades de distintas unidades.
            </p>
          </Tip>
        </>
      )}
      {g.phase === 2 && !g.v2 && (
        <>
          <h4>Ensambla una ruta de la cadena de valor</h4>
          <p className="muted">
            Confirma antes tu cronograma. Esta ruta representa un objetivo
            específico y un producto; los nombres de productos son educativos,
            no códigos del catálogo oficial.
          </p>
          <div className="two-col">
            <Field label="Causa que vas a intervenir">
              <select
                value={draft.chain.cause}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    chain: { ...draft.chain, cause: e.target.value },
                  })
                }
              >
                <option value="">Elige la causa</option>
                {s.nodes
                  .filter((n) => g.nodes.includes(n.id))
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Objetivo específico asociado">
              <select
                value={draft.chain.objective}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    chain: { ...draft.chain, objective: e.target.value },
                  })
                }
              >
                <option value="">Elige el cambio</option>
                {s.nodes
                  .filter((n) => g.nodes.includes(n.id))
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.objective}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Producto que entregarás">
              <select
                value={draft.chain.product}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    chain: { ...draft.chain, product: e.target.value },
                  })
                }
              >
                <option value="">Elige el producto</option>
                <option value="service">{selected(g)?.product}</option>
                <option value="activity">Contratar al equipo ejecutor</option>
                <option value="population">
                  Población priorizada del distrito
                </option>
              </select>
            </Field>
          </div>
          <h4>Actividades que generan el producto</h4>
          {g.activities.length === 0 && (
            <p>
              Confirma las actividades en la herramienta de cronograma para
              vincularlas aquí.
            </p>
          )}
          {g.activities.map((a) => (
            <label className="checkline" key={a.id}>
              <input
                type="checkbox"
                checked={draft.chain.activities.includes(a.id)}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    chain: {
                      ...draft.chain,
                      activities: e.target.checked
                        ? [...draft.chain.activities, a.id]
                        : draft.chain.activities.filter((id) => id !== a.id),
                    },
                  })
                }
              />
              {a.name} · {a.cost.toLocaleString("es-CO")} M COP
            </label>
          ))}
          <Button onClick={confirm}>Confirmar cadena de valor</Button>
          {reviewed && (
            <p role="status">
              Consistencia estructural: {Math.round(chainQuality(g))}/100.
              Comprueba causa directa, objetivo correspondiente, bien o servicio
              y al menos dos actividades financiadas.
            </p>
          )}
          <Tip title="La entrega y el cambio se miden por separado">
            En indicadores, define uno de producto y otro de resultado.
            Especifica la fuente, frecuencia, unidad, línea base y meta. Un
            desembolso mide gestión; por sí solo no acredita entrega ni
            bienestar.
          </Tip>
        </>
      )}
      {g.phase === 3 && (
        <>
          <h4>Predecir → probar → explicar</h4>
          <Field
            label="Antes de mover los supuestos, ¿qué esperas que ocurra?"
            hint="Registra una predicción comprobable, indicando dirección y variable."
          >
            <textarea
              maxLength={1200}
              value={draft.prediction}
              onChange={(e) =>
                setDraft({ ...draft, prediction: e.target.value })
              }
              placeholder="Si la demanda disminuye, espero que…"
            />
          </Field>
          <Field
            label="¿Qué condición externa necesita tu proyecto?"
            hint="Distingue un supuesto externo de una actividad que controla el equipo."
          >
            <textarea
              maxLength={1200}
              value={draft.assumption}
              onChange={(e) =>
                setDraft({ ...draft, assumption: e.target.value })
              }
              placeholder="Para que el servicio genere resultados, debe mantenerse…"
            />
          </Field>
          <Button onClick={confirm}>Registrar hipótesis y supuesto</Button>
          <p>
            Después usa la sensibilidad en Evaluación. Compara el resultado con
            tu predicción antes de confirmar la evaluación.
          </p>
        </>
      )}
      <div className="mga-review">
        {g.phase >= 2 && indicatorReview(g).length > 0 && (
          <div className="mga-challenge">
            <h4>Observaciones sobre tus indicadores</h4>
            <p>
              Estas señales orientan la revisión; no sustituyen el juicio sobre
              la calidad del indicador.
            </p>
            <ul>
              {indicatorReview(g).map((finding, i) => (
                <li key={i}>
                  <strong>{finding.name}:</strong> {finding.message}
                </li>
              ))}
            </ul>
          </div>
        )}
        <h4>
          Expediente confirmado · {checks.filter((c) => c.ok).length}/
          {checks.length} criterios estructurales
        </h4>
        {checks.map((c) => (
          <details key={c.title}>
            <summary>
              <span>{c.ok ? "✓" : "○"}</span> {c.title}
            </summary>
            <p>{c.detail}</p>
            <small>
              Se trabaja en la etapa {c.phase + 1}.{" "}
              {c.ok
                ? "Estructura registrada; revisa también su sentido y evidencia."
                : "Hay un punto para revisar; no indica cuál alternativa elegir."}
            </small>
          </details>
        ))}
      </div>
      {g.phase >= 5 && (
        <>
          <h4>Tu argumento antes de invertir</h4>
          <blockquote>
            {g.mga?.prediction || "No se registró una predicción."}
          </blockquote>
          <p>Supuesto externo: {g.mga?.assumption || "No registrado."}</p>
          <h4>Matriz de seguimiento del argumento</h4>
          <p className="muted">
            Resumen educativo de la lógica vertical. Los vacíos se muestran para
            revisión; no se inventan indicadores de impacto.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nivel</th>
                  <th>Resumen narrativo</th>
                  <th>Indicador y verificación</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    "Fin",
                    s.nodes.find((n) => n.id === "n4")?.objective,
                    "Impacto",
                  ],
                  [
                    "Propósito",
                    s.nodes.find((n) => n.id === g.objective)?.objective,
                    "Resultado",
                  ],
                  [
                    "Producto",
                    (g.v2 ? g.v2.chain.some(c=>c.id==='service'&&c.level==='Productos') : g.mga?.chain.product === "service")
                      ? selected(g)?.product
                      : "Revisar clasificación del producto",
                    "Producto",
                  ],
                  [
                    "Actividades",
                    g.activities.map((a) => a.name).join("; "),
                    "Gestión",
                  ],
                ].map(([level, narrative, kind]) => (
                  <tr key={level}>
                    <td>{level}</td>
                    <td>{narrative || "Sin definir"}</td>
                    <td>
                      {g.indicators
                        .filter((i) => i.kind === kind)
                        .map(
                          (i) =>
                            `${i.name}: ${i.baseline} → ${i.target} ${i.unit}. Fuente: ${i.source}; ${i.frequency}; responsable: ${i.owner}.`,
                        )
                        .join(" ") ||
                        "Sin indicador asociado; revisar alcance de la medición."}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {g.alternative && (
            <p>
              Cobertura estimada del modelo:{" "}
              {Math.round(model(g).coverage * 100)} %. Contrasta esta magnitud
              con las metas de tus indicadores.
            </p>
          )}
          {g.outcome && (
            <div className="mga-challenge">
              <h4>Discusión posterior a la misión</h4>
              <Field
                label="Tu explicación del resultado"
                hint="Se guarda con esta misión y no cambia su puntuación."
              >
                <textarea
                  value={draft.reflection}
                  maxLength={2000}
                  onChange={(e) =>
                    setDraft({ ...draft, reflection: e.target.value })
                  }
                />
              </Field>
              <Button
                secondary
                onClick={() =>
                  send({ type: "reflection", text: draft.reflection })
                }
              >
                Guardar reflexión final
              </Button>
              {g.mga?.reflection && (
                <p role="status">Reflexión guardada en el expediente.</p>
              )}
              <p>
                ¿Qué parte de tu hipótesis se sostuvo? ¿Qué desviación provino
                de tu formulación y cuál de las condiciones externas? ¿Qué
                evidencia necesitarías para distinguirlas?
              </p>
              <p>
                Cobertura observada: {Math.round(g.outcome.coverage * 100)} %.
                Revisa también el diario y los beneficios sacrificados antes de
                concluir.
              </p>
            </div>
          )}
        </>
      )}

      <p className="mga-source">
        Adaptación educativa de los{" "}
        <a
          href="https://mgaayuda.dnp.gov.co/Recursos/Documento_conceptual_2023.pdf"
          target="_blank"
          rel="noreferrer"
        >
          lineamientos MGA del DNP (2023)
        </a>
        . No sustituye MGA Web ni acredita viabilidad oficial.
      </p>
    </Panel>
  );
}

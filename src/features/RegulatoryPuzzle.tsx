import { ConceptLinks } from "./v22/common";
import { useState } from "react";
import type { GameState } from "../domain/types";
import type { Action } from "../domain/engine";
import { scenarioById } from "../data/scenarios";
import { difficultyRules } from "../data/balance";
import {
  instrumentNet,
  puzzleDeck,
  puzzleResult,
  puzzleSlots,
  regulatoryDiagnosis,
  severityLabel,
} from "../domain/regulationLab";
import { Panel, Button, Field } from "../components/ui";
import { useDraftGuard, different } from "../components/workbench";
import { helpPolicy } from "../domain/help";
import { fb } from "../components/feedback";

const pick = (chain: Record<string, string>, slot: string, prefix: string, allowed: string[], fallback: string) => {
  const id = chain[slot] ?? "";
  const value = id.startsWith(prefix + ":") ? id.slice(prefix.length + 1) : "";
  return allowed.includes(value) ? value : fallback;
};

/** Laboratorio Regulatorio: analyse the market, estimate severity, then rebuild the full causal chain. */
export default function RegulatoryPuzzle({
  g,
  send,
}: {
  g: GameState;
  send: (a: Action) => void;
}) {
  const s = scenarioById(g.scenarioId),
    deck = puzzleDeck(g),
    { estimate, evidence } = regulatoryDiagnosis(g),
    [chain, setChain] = useState<Record<string, string>>(g.v2!.regulatory.chain ?? {}),
    [reason, setReason] = useState(g.v2!.regulatory.reason);
  useDraftGuard(different(chain, g.v2!.regulatory.chain ?? {}) || reason !== g.v2!.regulatory.reason);
  const used = new Set(Object.values(chain)),
    complete = puzzleSlots.every((slot) => chain[slot]),
    confirmed = g.v2!.regulatory.chain,
    result = confirmed ? puzzleResult(g) : null,
    detail = difficultyRules[g.difficulty].feedback;
  return (
    <Panel title="Laboratorio regulatorio" kicker="ANALIZA · DIAGNOSTICA · RECONSTRUYE"><ConceptLinks ids={["regulacion", "externalidad", "captura"]} />
      <p>
        Regular no siempre es correcto. Primero estima qué tan grave es la falla; después compara el valor neto de cada
        instrumento, incluido no intervenir. Por último reconstruye la cadena causal completa de tu decisión.
      </p>
      <div className="lab-evidence">
        <strong>Evidencia disponible</strong>
        <p>{evidence}</p>
        <p className="muted">
          Severidad estimada: {severityLabel(estimate.mid)}.{" "}
          {estimate.studied
            ? "El estudio de demanda redujo la incertidumbre."
            : "Un estudio de demanda estrecharía este rango (Centro de información)."}
        </p>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Instrumento</th>
              <th>Daño corregido*</th>
              <th>Costo regulatorio*</th>
              <th>Efectos secundarios*</th>
              <th>Valor neto estimado*</th>
            </tr>
          </thead>
          <tbody>
            {s.instruments.map((p) => {
              const low = instrumentNet(g, p.id, estimate.low),
                high = instrumentNet(g, p.id, estimate.high),
                mid = instrumentNet(g, p.id, estimate.mid);
              return (
                <tr key={p.id} className={g.policy === p.id ? "chosen-row" : ""}>
                  <td>{p.name}</td>
                  <td>{mid.benefit.toFixed(0)}</td>
                  <td>{mid.cost.toFixed(0)}</td>
                  <td>{mid.side.toFixed(0)}</td>
                  <td>
                    {low.net.toFixed(0)} a {high.net.toFixed(0)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="muted">
        * Índice educativo: 100 = daño de una falla típica sin corregir. Los rangos reflejan tu incertidumbre sobre la
        severidad real. Tu estrategia confirmada: {s.instruments.find((p) => p.id === g.policy)?.name}.
      </p>
      <h4>Cadena causal de tu decisión</h4>
      <p className="muted">
        Cada eslabón acepta una tarjeta. Hay distractores creíbles. La cadena debe ser coherente con el instrumento que
        confirmaste arriba: si cambias de estrategia, revisa también esta cadena.
      </p>
      <ol className="puzzle-chain">
        {puzzleSlots.map((slot) => (
          <li
            key={slot}
            {...(result && detail !== "score" && helpPolicy(g).immediate && chain[slot] === confirmed?.[slot]
              ? result.rows.find((r) => r.slot === slot)?.correct
                ? fb("ok", "Eslabón coherente con el instrumento que confirmaste y con el eslabón anterior.")
                : fb("grave", "Revisa este eslabón: la tarjeta no es coherente con el instrumento que confirmaste. Después del primer eslabón roto, los siguientes valen la mitad.")
              : {})}
          >
            <Field label={slot}>
              <select
                value={chain[slot] ?? ""}
                onChange={(e) => setChain({ ...chain, [slot]: e.target.value })}
              >
                <option value="">Elegir tarjeta</option>
                {deck.map((c) => (
                  <option key={c.id} value={c.id} disabled={used.has(c.id) && chain[slot] !== c.id}>
                    {c.text}
                  </option>
                ))}
              </select>
            </Field>
            {result && detail !== "score" && (
              <small className={result.rows.find((r) => r.slot === slot)?.correct ? "ok-text" : "warning"}>
                {result.rows.find((r) => r.slot === slot)?.correct ? "✓ coherente" : "✗ revisa este eslabón"}
              </small>
            )}
          </li>
        ))}
      </ol>
      <Field label="Justificación breve · hasta 200 caracteres">
        <textarea maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <Button
        disabled={!complete || !reason.trim()}
        onClick={() =>
          send({
            type: "regulatory",
            value: {
              evidence: pick(chain, "Evidencia", "evidence", ["observed", "popularity", "sole-price"], "opinion"),
              incentive: pick(chain, "Incentivo", "incentive", ["entry", "price", "baseline", "automatic", "profit"], "automatic"),
              adverse: pick(chain, "Efecto adverso", "adverse", ["oversight", "barriers", "persistence", "none"], "guarantee"),
              reason,
              chain,
            },
          })
        }
      >
        Confirmar cadena regulatoria
      </Button>
      {result && (
        <p role="status">
          Coherencia causal: {result.score}/100. Después del primer eslabón roto, los siguientes valen la mitad. La
          proporcionalidad del instrumento se conocerá al invertir, cuando la severidad real produzca sus consecuencias.
        </p>
      )}
    </Panel>
  );
}

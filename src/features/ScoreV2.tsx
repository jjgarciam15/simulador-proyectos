import { scoreBreakdown } from "../domain/scoreParts";
import type { GameState } from "../domain/types";
import { Panel } from "../components/ui";
import { outcomeLedger } from "../domain/ledger";
import { conceptById, dimensionConcepts } from "../data/concepts";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
const short: Record<string, string> = {
  "Diagnóstico y Árbol del problema": "Diagnóstico",
  "Alternativa y objetivos": "Alternativa",
  "Cadena de valor y presupuesto": "Preparación",
  "Evaluación ex ante": "Evaluación",
  "Regulación y ODS": "Regulación/ODS",
  "Compromisos y riesgo": "Riesgo",
  "Ejecución y servicio": "Ejecución",
  "Valor observado": "Valor",
  "Coherencia transversal": "Coherencia",
  "Efectos, impactos y valoración": "Valoración",
  "Flujos, VPN y RPC": "Flujos",
  "Coherencia y trazabilidad": "Coherencia",
  "Comité evaluador": "Comité",
  "Práctica de conceptos": "Práctica",
};
export default function ScoreV2({ g }: { g: GameState }) {
  const a = g.outcome?.assessment;
  if (!a) return null;
  const practice = a.notes.find((n) => n.startsWith("Práctica")),
    mastered = a.dimensions.filter((d) => d.value >= 75),
    review = a.dimensions.filter((d) => d.value < 55),
    ledger = outcomeLedger(g);
  return (
    <Panel
      title="Por qué obtuviste esta nota"
      kicker="APORTES, BONIFICACIONES Y PENALIZACIONES"
    >
      <p className="story">{a.story}</p>
      <div
        style={{ height: 280 }}
        aria-label="Perfil del proyecto, valores detallados en la tabla"
      >
        <ResponsiveContainer>
          <RadarChart
            data={a.dimensions.map((d) => ({
              name: short[d.name] ?? d.name,
              value: d.value,
            }))}
          >
            <PolarGrid />
            <PolarRadiusAxis domain={[0, 100]} tick={false} />
            <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
            <Radar
              dataKey="value"
              stroke="#367566"
              fill="#367566"
              fillOpacity={0.25}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="table-wrap">
        <table className="v2-score-table">
          <thead>
            <tr>
              <th>Etapa</th>
              <th>Nota</th>
              <th>Peso</th>
              <th>Aporte</th>
            </tr>
          </thead>
          <tbody>
            {a.dimensions.map((d, i) => (
              <tr key={d.name}>
                <td>
                  {d.name}
                  <details>
                    <summary>Ver criterio</summary>
                    {a.notes[i]}
                  </details>
                </td>
                <td>{d.value.toFixed(1)}</td>
                <td>{(d.weight * 100).toFixed(0)} %</td>
                <td>{(d.value * d.weight).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ActivityBreakdown g={g} />
      <p>
        Base: {a.base.toFixed(2)} − penalizaciones: {a.penalty.toFixed(2)}
        {a.bonus !== undefined && <> + bonificaciones: {a.bonus.toFixed(2)}</>}.
        Se limita a 0–100 y se redondea. Abandono/insolvencia multiplican el
        resultado por 0,35.
      </p>
      {a.adjustments && (
        <div className="two-col adjustments">
          <div>
            <h4>Bonificaciones</h4>
            {a.adjustments.bonuses.length ? (
              <ul>
                {a.adjustments.bonuses.map((b) => (
                  <li key={b.label}>
                    <strong>+{b.points} {b.label}.</strong> {b.reason}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Ninguna bonificación en esta partida.</p>
            )}
          </div>
          <div>
            <h4>Penalizaciones</h4>
            {a.adjustments.penalties.length ? (
              <ul>
                {a.adjustments.penalties.map((p) => (
                  <li key={p.label}>
                    <strong>−{p.points} {p.label}.</strong> {p.reason}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Ninguna penalización por decisiones.</p>
            )}
          </div>
        </div>
      )}
      {practice && !a.dimensions.some((d) => d.name === "Práctica de conceptos") && <p className="muted">{practice}</p>}
      <h4>Aciertos y errores</h4>
      <div className="ledger">
        {[...new Set(ledger.map((l) => l.stage))].map((stage) => {
          const rows = ledger.filter((l) => l.stage === stage),
            ok = rows.filter((r) => r.ok).length;
          return (
            <details key={stage}>
              <summary>
                {stage}: <span className="ok-text">{ok} acierto(s)</span> ·{" "}
                <span className="warning">{rows.length - ok} error(es)</span>{" "}
                <small className="muted">→ {rows[0].dimension}</small>
              </summary>
              <ul className="findings">
                {rows.map((r, i) => (
                  <li key={i} className={"finding " + (r.ok ? "ok" : "grave")}>
                    {r.ok ? "✓" : "✗"} {r.text}
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
      </div>
      {a.coherence && a.coherence.length > 0 && (
        <details open>
          <summary>Coherencia transversal entre etapas</summary>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Relación</th>
                  <th>Valor</th>
                  <th>Por qué</th>
                </tr>
              </thead>
              <tbody>
                {a.coherence.map((c) => (
                  <tr key={c.pair}>
                    <td>{c.pair}</td>
                    <td>{c.value.toFixed(0)}</td>
                    <td>{c.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
      {a.budgetFindings && a.budgetFindings.length > 0 && (
        <details>
          <summary>Diagnóstico del presupuesto aprobado</summary>
          <ul className="findings">
            {a.budgetFindings.map((f) => (
              <li key={f.topic + f.text} className={"finding " + f.level}>
                <strong>{f.topic}:</strong> {f.text}
              </li>
            ))}
          </ul>
        </details>
      )}
      <div className="two-col">
        <div>
          <h4>Conceptos dominados</h4>
          <p>
            {mastered.length
              ? mastered.map((d) => short[d.name] ?? d.name).join(", ")
              : "Todavía ninguno con 75 o más."}
          </p>
        </div>
        <div>
          <h4>Conceptos a repasar</h4>
          <p>
            {review.length
              ? review.map((d) => short[d.name] ?? d.name).join(", ")
              : "Ninguna dimensión por debajo de 55."}
          </p>
        </div>
      </div>
      {review.length > 0 && (
        <div className="v22-recommend">
          <h4>Te recomendamos repasar</h4>
          <p className="muted">Según las dimensiones con menor nota en esta partida.</p>
          {[...new Set(review.flatMap((d) => dimensionConcepts[d.name] ?? []))].slice(0, 6).map((id) => (
            <button key={id} className="text-btn v22-chip" onClick={() => window.dispatchEvent(new CustomEvent("proyecta:learn", { detail: id }))}>
              {conceptById(id)?.name ?? id}
            </button>
          ))}
        </div>
      )}
      <p>
        El perfil combina proceso y resultados. Las justificaciones se conservan
        para discusión; el texto libre no recibe una nota automática.
      </p>
    </Panel>
  );
}

/** Puntuación integral: every scored activity of the game, its result, its weight in the grade and the points it gave. */
function ActivityBreakdown({ g }: { g: GameState }) {
  const a = g.outcome!.assessment!,
    rows = scoreBreakdown(a.dimensions),
    indirect = [
      [g.studies.length, "estudio(s) comprados", "información al invertir y riesgo"],
      [g.v2?.dilemmas?.length ?? 0, "dilema(s) resueltos", "recursos, apoyo, plazo y ejecución"],
      [g.eventIds.length, "evento(s) de ejecución atendidos", "plazo, costos, legitimidad y servicio"],
      [g.mitigations.length, "mitigación(es) de riesgo", "riesgo e información, y la bonificación de gestión de riesgo"],
    ].filter(([n]) => Number(n) > 0) as [number, string, string][];
  return (
    <details className="score-breakdown" open>
      <summary>
        Desglose completo: {rows.length} actividades de tu partida suman {a.base.toFixed(2)} puntos base
      </summary>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Dimensión</th>
              <th>Actividad</th>
              <th>Tu resultado</th>
              <th>Peso en la nota</th>
              <th>Puntos</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.dimension + r.activity}>
                <td>{r.dimension}</td>
                <td>{r.activity}</td>
                <td>{r.value.toFixed(0)}/100</td>
                <td>{(r.weight * 100).toFixed(1)} %</td>
                <td>{r.points.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan={3}>Total base</th>
              <th>100 %</th>
              <th>{a.base.toFixed(2)}</th>
            </tr>
          </tfoot>
        </table>
      </div>
      {indirect.length > 0 && (
        <p className="muted">
          Sin nota propia, pero cuentan a través de otras dimensiones: {indirect.map(([n, what, where]) => `${n} ${what} (${where})`).join("; ")}.
        </p>
      )}
    </details>
  );
}

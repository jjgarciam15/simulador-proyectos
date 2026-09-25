import { phases, type GameState } from "../domain/types";
import { selected } from "../domain/engine";
import { Panel } from "../components/ui";

const mmss = (s: number) => `${Math.floor(s / 60)} min ${String(Math.round(s % 60)).padStart(2, "0")} s`;
/** Local analytics: time spent per stage (never scored, only for reflection). */
export function StageTimes({ g }: { g: GameState }) {
  const t = g.v2?.stageSeconds ?? {};
  const total = Object.values(t).reduce((n, v) => n + v, 0);
  if (!total) return null;
  const max = Math.max(...Object.values(t));
  return (
    <Panel title="Tiempo por etapa" kicker="ANALÍTICA LOCAL · NO AFECTA LA NOTA">
      <ul className="stage-times">
        {phases.map((name, i) =>
          t[i] ? (
            <li key={name}>
              <span>{name}</span>
              <span className="stage-time-bar" aria-hidden>
                <i style={{ width: (100 * t[i]) / max + "%" }} />
              </span>
              <strong>{mmss(t[i])}</strong>
            </li>
          ) : null,
        )}
      </ul>
      <p className="muted">Total: {mmss(total)}. Solo se cuenta el tiempo con la pestaña visible.</p>
    </Panel>
  );
}
/** Comparación de intentos de la misma misión (misma o distinta semilla). */
export function AttemptComparison({ g, history }: { g: GameState; history: GameState[] }) {
  const same = history.filter((x) => x.scenarioId === g.scenarioId && x.outcome);
  if (same.length < 2) return null;
  const dims = same[0].outcome?.assessment?.dimensions.map((d) => d.name) ?? [];
  return (
    <Panel title="Comparación de intentos" kicker={`${same.length} INTENTOS DE ESTA MISIÓN`}>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Intento</th>
              <th>Alternativa</th>
              <th>Dificultad</th>
              <th>Nota</th>
              {dims.slice(0, 6).map((d) => (
                <th key={d}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {same.map((x, i) => (
              <tr key={x.id} className={x.id === g.id ? "current-attempt" : ""}>
                <td>
                  {i + 1} · {x.seed}
                  {x.id === g.id ? " (este)" : ""}
                </td>
                <td>{selected(x)?.name ?? "—"}</td>
                <td>{x.difficulty}</td>
                <td>
                  <strong>{x.outcome!.score}</strong>
                </td>
                {dims.slice(0, 6).map((d) => (
                  <td key={d}>{Math.round(x.outcome!.assessment?.dimensions.find((y) => y.name === d)?.value ?? 0)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted">Compara estrategias: con la misma semilla las condiciones externas son idénticas, así que las diferencias vienen de tus decisiones.</p>
    </Panel>
  );
}

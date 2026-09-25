import type { Budget, GameState } from "../domain/types";
import { budgetGuide, budgetReview } from "../domain/budgetReview";
import { money } from "../domain/finance";

/** Live, explainable review of the draft budget: sufficiency, waste, contingency and coherence. */
export default function BudgetReviewPanel({
  g,
  budget,
}: {
  g: GameState;
  budget: Budget;
}) {
  const review = budgetReview(g, budget),
    guide = budgetGuide(g);
  if (!review.findings.length) return null;
  return (
    <div className="budget-review" role="status" aria-live="polite">
      <details>
        <summary>Guía de referencia · tú decides los valores</summary>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Rango de referencia (M)</th>
                <th>Tu borrador</th>
                <th>Criterio</th>
              </tr>
            </thead>
            <tbody>
              {guide.map((r) => {
                const v = budget[r.key],
                  state = v < r.low ? "bajo" : v > r.high ? "alto" : "en rango";
                return (
                  <tr key={r.key}>
                    <td>{r.label}</td>
                    <td>
                      {money(r.low)} – {money(r.high)}
                    </td>
                    <td className={state === "en rango" ? "ok-text" : "warning"}>
                      {money(v)} · {state}
                    </td>
                    <td>{r.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="muted">
          Los rangos no suman el presupuesto ideal: el fondo no alcanza para dejar todo en el máximo. Prioriza.
        </p>
      </details>
      <strong>Diagnóstico del planificador presupuestal: {review.score.toFixed(0)}/100</strong>
      <p className="muted">
        Se recalcula con tu borrador. Considera el cronograma confirmado: si cambias costos de actividades, confírmalos
        para actualizar este diagnóstico.
      </p>
      <ul className="findings">
        {review.findings.map((f) => (
          <li key={f.topic + f.text} className={"finding " + f.level}>
            <strong>{f.topic}:</strong> {f.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

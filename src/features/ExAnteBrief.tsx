import type { GameState } from "../domain/types";
import { available, model, projectCost, riskLevel, schedule, selected } from "../domain/engine";
import { scenarioById } from "../data/scenarios";
import { money } from "../domain/finance";
import { Panel } from "../components/ui";
import { budgetReview } from "../domain/budgetReview";

/** What ex ante evaluation is, and the concrete data of this game that it uses. */
export default function ExAnteBrief({ g }: { g: GameState }) {
  const s = scenarioById(g.scenarioId),
    a = selected(g);
  if (!a) return null;
  const m = model(g),
    cost = projectCost(g),
    duration = Math.max(a.months, schedule(g.activities).duration) + g.assumptions.delay,
    review = budgetReview(g),
    delayed = g.v2?.delayed?.length ?? 0;
  return (
    <Panel title="¿Para qué evaluar antes de ejecutar?" kicker="EVALUACIÓN EX ANTE · FUNCIÓN EN LA PARTIDA">
      <div className="two-col">
        <div>
          <p>
            <strong>Qué es.</strong> Estimar costos, beneficios y riesgos de un proyecto <em>antes</em> de comprometer
            recursos, con la información disponible hoy.
          </p>
          <p>
            <strong>Para qué sirve.</strong> Decidir si el proyecto merece los recursos frente a sus alternativas, ajustar
            su diseño y dejar una línea de comparación para el seguimiento.
          </p>
          <p>
            <strong>Por qué ocurre antes.</strong> Después de invertir, corregir es más caro: las obras, contratos y
            compromisos ya existen.
          </p>
          <p>
            <strong>En esta partida.</strong> Todo lo que decidiste llega aquí: al invertir se congela esta evaluación, y
            al final se compara con lo observado. Los eventos posteriores no cambian la nota de esta etapa, porque juzga
            la calidad de la decisión con la información que tenías.
          </p>
        </div>
        <div className="table-wrap">
          <table>
            <caption>Datos de tu partida que alimentan la evaluación</caption>
            <tbody>
              <tr><td>Alternativa</td><td>{a.name}</td></tr>
              <tr><td>Población objetivo</td><td>{g.target.toLocaleString("es-CO")} · cobertura prevista {(m.coverage * 100).toFixed(0)} %</td></tr>
              <tr><td>Costo a comprometer</td><td>$ {money(cost)} M de $ {money(available(g))} M libres</td></tr>
              <tr><td>Costo anual</td><td>$ {money(m.opex)} M</td></tr>
              <tr><td>Beneficio social anual</td><td>$ {money(m.benefit)} M</td></tr>
              <tr><td>Tiempo</td><td>{duration} meses de ejecución; quedan {Math.max(0, s.deadline - g.month)} del plazo</td></tr>
              <tr><td>Riesgo</td><td>{riskLevel(g).toFixed(0)}/100 · información {g.quality}/100</td></tr>
              <tr><td>Presupuesto</td><td>Diagnóstico {review.score.toFixed(0)}/100</td></tr>
              <tr><td>Sostenibilidad</td><td>{Math.round(g.sustainability)}/100 · mantenimiento {(m.maintenanceRatio * 100).toFixed(0)} % de lo recomendado</td></tr>
              {delayed > 0 && (
                <tr><td>Decisiones con efectos pendientes</td><td>{delayed}: se revelarán al invertir</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Panel>
  );
}

import { useState } from "react";
import type { GameState } from "../domain/types";
import { efficiencyComparison } from "../domain/costEfficiency";
import { scenarioById } from "../data/scenarios";
import { money, number } from "../domain/finance";
import { Panel, Range, Tip } from "../components/ui";
export default function CostEfficiency({ g }: { g: GameState }) {
  const s = scenarioById(g.scenarioId),
    [minimum, setMinimum] = useState(Math.round(g.target * 0.5)),
    rows = efficiencyComparison(g),
    eligible = rows.filter(
      (r) => r.feasible && r.people >= minimum && r.unitCost !== null,
    ),
    lowest = eligible.reduce<(typeof eligible)[number] | null>(
      (best, r) => (!best || r.unitCost! < best.unitCost! ? r : best),
      null,
    );
  return (
    <Panel
      title="¿Cuánto cuesta producir el resultado?"
      kicker="LABORATORIO DE COSTO-EFICIENCIA"
    >
      <p>
        Compara el costo de sostener acceso efectivo a una persona durante un
        año. Útil cuando el resultado físico es comparable y no quieres suponer
        que todos sus beneficios pueden monetizarse.
      </p>
      <Range
        label="Mínimo de personas con acceso efectivo"
        value={minimum}
        min={0}
        max={s.affected}
        step={Math.max(1, Math.round(s.affected / 100))}
        onChange={setMinimum}
        format={number}
      />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Alternativa</th>
              <th>Personas/año</th>
              <th>CAUE · M COP</th>
              <th>COP por persona-año</th>
              <th>Restricciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.name}
                  {r.id === g.alternative ? " · seleccionada" : ""}
                </td>
                <td>{number(r.people)}</td>
                <td>
                  {r.annualCost === null ? "No aplica" : money(r.annualCost)}
                </td>
                <td>
                  {r.unitCost === null
                    ? "Sin resultado"
                    : number(r.unitCost * 1e6)}
                </td>
                <td>
                  {!r.feasible
                    ? "No cabe en caja o plazo"
                    : r.people < minimum
                      ? "No alcanza el mínimo"
                      : "Cumple mínimo, caja y plazo"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p role="status">
        {lowest
          ? `${lowest.name} tiene el menor costo por persona-año entre las opciones que cumplen estas restricciones.`
          : "Ninguna opción cumple simultáneamente este mínimo, caja y plazo. Revisa alcance o financiación."}{" "}
        Esto no determina por sí solo la mejor alternativa.
      </p>
      <Tip title="Cómo interpretar costo-eficiencia">
        Cociente = valor presente de costos / valor presente de resultados
        físicos anuales, descontados con la misma tasa real. Se mantienen
        horizonte, precios constantes, población, presupuesto de gestión y
        reglas de financiación disponibles; los costos y duración del cronograma
        se escalan a cada tecnología. No se añaden tarifas, préstamos ni
        beneficios monetarios al denominador. Acceso no significa igual calidad,
        equidad o impacto ambiental: contrástalos antes de decidir. La
        comparación usa los supuestos guardados y no cambia tu alternativa.
      </Tip>
    </Panel>
  );
}

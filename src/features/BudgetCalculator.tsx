import { useState } from "react";
import type { Budget } from "../domain/types";
import {
  type BudgetLine,
  lineTotal,
  detailedTotals,
  validBudgetLines,
} from "../domain/budgetLines";
import { Field, Button } from "../components/ui";
import { money } from "../domain/finance";

export default function BudgetCalculator({
  labels,
  budget,
  lines,
  onAdd,
  onRemove,
}: {
  labels: Record<keyof Budget, string>;
  budget: Budget;
  lines: BudgetLine[];
  onAdd: (line: BudgetLine) => void;
  onRemove: (id: string) => void;
}) {
  const [category, setCategory] = useState<keyof Budget>("maintenance"),
    [description, setDescription] = useState(""),
    [unit, setUnit] = useState("visita"),
    [quantity, setQuantity] = useState(1),
    [unitCost, setUnitCost] = useState(0),
    [message, setMessage] = useState("");
  const total = quantity * unitCost,
    valid =
      Number.isFinite(total) &&
      quantity > 0 &&
      unitCost > 0 &&
      description.trim() &&
      unit.trim() &&
      lines.length < 200;
  const totals = detailedTotals(lines);
  return (
    <details className="v2-budget-calculator">
      <summary>Presupuesto detallado · {lines.length} partidas</summary>
      <p>
        Construye partidas con cantidad × costo unitario en millones de COP. El
        detalle se guarda al confirmar la asignación. Mantenimiento corresponde
        a un año; las demás categorías son reservas iniciales. La inversión
        técnica se programa en el cronograma.
      </p>
      <div className="field-grid">
        <Field label="Descripción de la partida">
          <input
            maxLength={160}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <Field label="Destino del cálculo">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as keyof Budget)}
          >
            {Object.entries(labels).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Unidad de medida">
          <input
            maxLength={40}
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          />
        </Field>
        <Field label="Cantidad de unidades">
          <input
            type="number"
            min={0.001}
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </Field>
        <Field label="Costo por unidad (M COP)">
          <input
            type="number"
            min={0.001}
            step="any"
            value={unitCost}
            onChange={(e) => setUnitCost(Number(e.target.value))}
          />
        </Field>
      </div>
      <p>
        Total calculado: $ {money(Number.isFinite(total) ? total : 0)}. Ejemplo
        simulado: 12 visitas × 5 M = 60 M.
      </p>
      <Button
        secondary
        disabled={!valid}
        onClick={() => {
          onAdd({
            id: crypto.randomUUID(),
            category,
            description: description.trim(),
            unit: unit.trim(),
            quantity,
            unitCost,
          });
          setDescription("");
          setUnitCost(0);
          setMessage(
            "Partida añadida al borrador. Confirma la asignación para guardarla.",
          );
        }}
      >
        Sumar al borrador
      </Button>
      <p role="status">{message}</p>
      {lines.length > 0 && (
        <div className="table-wrap">
          <table>
            <caption>Detalle de recursos propuestos · M COP</caption>
            <thead>
              <tr>
                <th>Partida / destino</th>
                <th>Cantidad / unidad</th>
                <th>Costo unitario</th>
                <th>Total</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id}>
                  <td>
                    {line.description}
                    <small style={{ display: "block" }}>
                      {labels[line.category]}
                    </small>
                  </td>
                  <td>
                    {line.quantity} {line.unit}
                  </td>
                  <td>{money(line.unitCost)}</td>
                  <td>{money(lineTotal(line))}</td>
                  <td>
                    <button
                      className="text-btn"
                      aria-label={"Quitar partida " + line.description}
                      onClick={() => onRemove(line.id)}
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p>
        Los montos ingresados directamente siguen disponibles como asignación
        sin desglose. El detalle está incluido en el presupuesto, no se suma dos
        veces.
      </p>
      <ul>
        {Object.entries(labels).map(([key, label]) => (
          <li key={key}>
            {label}: {money(totals[key as keyof Budget])} detallados;{" "}
            {money(budget[key as keyof Budget] - totals[key as keyof Budget])}{" "}
            sin desglose.
          </li>
        ))}
      </ul>
      {!validBudgetLines(lines, budget) && (
        <p role="alert">
          El detalle supera una asignación. Aumenta esa categoría o quita las
          partidas correspondientes antes de confirmar.
        </p>
      )}
    </details>
  );
}

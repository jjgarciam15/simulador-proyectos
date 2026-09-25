import { npvSteps } from "../../domain/flows";
import { fmtFactor, fmtMoney, fmtPct, fmtRpc } from "../../domain/format";

/** Calculadora pedagógica del VPN: fórmula → variables → sustitución → resultado → interpretación. */
export default function NpvCalculator({ flows, rate, label, economic = false }: { flows: number[]; rate: number; label: string; economic?: boolean }) {
  const { rows, npv } = npvSteps(flows, rate),
    n = flows.length - 1,
    shown = rows.slice(0, 3);
  return (
    <details className="v22-calc">
      <summary>¿Cómo se calculó el {label}? · paso a paso</summary>
      <ol className="v22-calc-steps">
        <li>
          <strong>Fórmula</strong>
          <code>VPN = Σ (t = 0…{n}) Fₜ / (1 + r)ᵗ</code>
        </li>
        <li>
          <strong>Variables</strong>
          <span>
            Fₜ = flujo neto del periodo t; r = {economic ? "tasa social de descuento" : "tasa de descuento"} = {fmtPct(rate)}; N = {n} periodos. El periodo 0 no
            se descuenta.
          </span>
        </li>
        <li>
          <strong>Sustitución</strong>
          <code>
            VPN = {shown.map((r) => `${fmtMoney(r.flow)} / (1 + ${rate})^${r.period}`).join(" + ")}
            {n > 2 ? " + …" : ""}
          </code>
        </li>
        <li>
          <strong>Periodo a periodo</strong>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Periodo</th>
                  <th>Flujo</th>
                  <th>Factor 1/(1+r)ᵗ</th>
                  <th>Valor presente</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.period}>
                    <td>{r.period}</td>
                    <td>{fmtMoney(r.flow)}</td>
                    <td>{fmtFactor(r.factor)}</td>
                    <td>{fmtMoney(r.pv)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </li>
        <li>
          <strong>Resultado</strong>
          <code>
            Σ valores presentes = {label} = {fmtMoney(npv)}
          </code>
        </li>
        <li>
          <strong>Interpretación</strong>
          <span>
            {npv >= 0
              ? `Descontando al ${fmtPct(rate)}, el proyecto genera ${fmtMoney(npv)} más de lo que rendiría el mejor uso alternativo de los recursos${economic ? " para la sociedad" : ""}.`
              : `Descontando al ${fmtPct(rate)}, el proyecto no recupera el costo de oportunidad de los recursos: le faltan ${fmtMoney(-npv)}${economic ? " en términos de bienestar" : ""}.`}{" "}
            Un VPN mayor no decide solo: considera riesgo, distribución, restricciones y sostenibilidad.
          </span>
        </li>
      </ol>
    </details>
  );
}
/** RPC transformation shown as a formula with its values. */
export function RpcFormula({ financial, rpc, label }: { financial: number; rpc: number; label: string }) {
  return (
    <code className="v22-rpc-formula">
      {fmtMoney(financial)} × RPC {label} {fmtRpc(rpc)} = {fmtMoney(financial * rpc)}
    </code>
  );
}

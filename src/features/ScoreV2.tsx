import type { GameState } from "../domain/types";
import { Panel } from "../components/ui";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
export default function ScoreV2({ g }: { g: GameState }) {
  const a = g.outcome?.assessment;
  if (!a) return null;
  return (
    <Panel
      title="Por qué obtuviste esta nota"
      kicker="APORTES Y PENALIZACIONES V2"
    >
      <p>{a.story}</p>
      <div
        style={{ height: 280 }}
        aria-label="Perfil del proyecto, valores detallados en la tabla"
      >
        <ResponsiveContainer>
          <RadarChart
            data={a.dimensions.map((d, i) => ({
              name: [
                "Diagnóstico",
                "Alternativa",
                "Preparación",
                "Evaluación",
                "Regulación/ODS",
                "Riesgo",
                "Ejecución",
                "Valor",
              ][i],
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
      <p>
        Base: {a.base.toFixed(2)} − pistas e intentos: {a.penalty.toFixed(2)}.
        Se limita a 0–100 y se redondea. Abandono/insolvencia multiplican el
        resultado por 0,35.
      </p>
      <p>{a.notes[8]}</p>
      <p>
        El perfil combina proceso y resultados. Las justificaciones se conservan
        para discusión; el texto libre no recibe una nota automática.
      </p>
    </Panel>
  );
}

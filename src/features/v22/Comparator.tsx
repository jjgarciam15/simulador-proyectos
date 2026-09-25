import { useState } from "react";
import type { GameState } from "../../domain/types";
import type { Action } from "../../domain/engine";
import { compareAlternatives, decisionCriteria, decisionMatrix } from "../../domain/comparison";
import { fmtMoney, fmtPct } from "../../domain/format";
import { Panel, Button } from "../../components/ui";
import { ModuleIntro } from "./common";

/** Comparador de alternativas (#65) and weighted decision matrix (#66): supports reasoning, never picks automatically. */
export default function Comparator({ g, send }: { g: GameState; send: (a: Action) => void }) {
  const rows = compareAlternatives(g),
    [weights, setWeights] = useState<Record<string, number>>(Object.fromEntries(decisionCriteria.map((c) => [c.id, 1]))),
    matrix = decisionMatrix(rows, weights),
    lines: [string, (r: (typeof rows)[number]) => string][] = [
      ["Inversión", (r) => fmtMoney(r.investment)],
      ["O&M anual", (r) => fmtMoney(r.om)],
      ["Vida útil", (r) => r.life + " años"],
      ["Valor residual", (r) => fmtMoney(r.residual)],
      ["Tiempo de obra", (r) => r.months + " meses"],
      ["Cobertura", (r) => fmtPct(r.coverage)],
      ["VPN financiero", (r) => fmtMoney(r.npvF)],
      ["VPN económico", (r) => fmtMoney(r.npvE)],
      ["Riesgo", (r) => r.risk.toFixed(0) + "/100"],
      ["Impacto anual (beneficio social)", (r) => fmtMoney(r.impact)],
      ["Confianza de la valoración", (r) => r.confidence],
      ["Complejidad regulatoria", (r) => r.regulation + "/100"],
      ["Sostenibilidad ambiental", (r) => (r.sustainability > 0 ? "+" : "") + r.sustainability],
    ];
  return (
    <Panel title="Comparar alternativas antes de decidir" kicker="COMPARADOR Y MATRIZ DE DECISIÓN">
      <ModuleIntro
        what="Todas las alternativas evaluadas con el mismo horizonte, tasas y RPC. Los beneficios de las otras alternativas proyectan tu valoración."
        why="Elegir una alternativa implica renunciar a las demás: ese es el costo de oportunidad de la decisión."
        decide="Si mantienes tu alternativa o vuelves a Formulación para cambiarla (tu trabajo se conserva)."
        next="Comité evaluador, compromiso de inversión y resultado."
      />
      <div className="table-wrap">
        <table className="v22-comparison">
          <thead>
            <tr>
              <th>Criterio</th>
              {rows.map((r) => (
                <th key={r.id} className={r.chosen ? "chosen-col" : ""}>
                  {r.name}
                  {r.chosen && <small>Tu alternativa</small>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map(([label, f]) => (
              <tr key={label}>
                <td>{label}</td>
                {rows.map((r) => (
                  <td key={r.id} className={r.chosen ? "chosen-col" : ""}>
                    {f(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details className="v22-tree" open={g.difficulty !== "guiado"}>
        <summary>Matriz de decisión ponderada</summary>
        <p className="muted">Asigna el peso que tiene cada criterio para ti. La matriz normaliza cada criterio entre la peor y la mejor alternativa. Es una ayuda para razonar: cambia con los pesos y no declara una alternativa universalmente correcta.</p>
        <div className="v22-sliders">
          {decisionCriteria.map((c) => (
            <label key={c.id}>
              {c.label}: {weights[c.id]}
              <input type="range" min={0} max={5} step={1} value={weights[c.id]} onChange={(e) => setWeights({ ...weights, [c.id]: Number(e.target.value) })} />
            </label>
          ))}
        </div>
        <div className="v22-bars">
          {matrix.map((m) => (
            <div key={m.id} className="gain">
              <span>{m.name}</span>
              <div>
                <i style={{ width: m.score + "%" }} />
              </div>
              <strong>{m.score.toFixed(0)}/100</strong>
            </div>
          ))}
        </div>
      </details>
      <Button secondary disabled={!!g.snapshot} onClick={() => send({ type: "visit", phase: 1 })}>
        Volver a Formulación para cambiar de alternativa
      </Button>
    </Panel>
  );
}

import { useState } from "react";
import type { GameState } from "../../domain/types";
import {
  criticalVariable,
  evaluate,
  scenarioShocks,
  sensitivityVariables,
  stressTests,
  switchingValue,
  type Shocks,
  type SensitivityVar,
} from "../../domain/flows";
import { missionFlowCase } from "../../domain/missionFlow";
import { playerFlow } from "../../domain/comparison";
import { moduleEnabled } from "../../data/missionProfiles";
import { scenarioById } from "../../data/scenarios";
import { estimate } from "../../domain/engine";
import { helpPolicy } from "../../domain/help";
import { fmtMoney, fmtPct } from "../../domain/format";
import { Panel } from "../../components/ui";
import { ModuleIntro, Status } from "./common";

/** Supuestos del proyecto: each datum labelled as observed data, estimate, assumption or player decision. */
export function AssumptionsPanel({ g }: { g: GameState }) {
  const s = scenarioById(g.scenarioId),
    c = missionFlowCase(g),
    studied = g.studies.includes("demanda"),
    band = studied ? 0.08 : g.difficulty === "experto" ? 0.3 : 0.2,
    demand = s.demand * estimate(g, "demand");
  const rows: [string, string, string][] = [
    ["Demanda estimada", `${Math.round(demand * (1 - band)).toLocaleString("es-CO")}–${Math.round(demand * (1 + band)).toLocaleString("es-CO")} ${s.unit}`, studied ? "Estimación · confianza alta (estudio de demanda)" : "Estimación · confianza media o baja: sin estudio de demanda"],
    ["Población afectada", s.affected.toLocaleString("es-CO"), "Dato observado"],
    ["Población objetivo", g.target.toLocaleString("es-CO"), "Decisión del jugador"],
    ["Tasa de descuento financiera", fmtPct(g.assumptions.discount), "Supuesto (costo de oportunidad del capital)"],
    ["Tasa social de descuento", fmtPct(g.assumptions.socialDiscount), "Dato oficial: DNP, Res. 1092 de 2022"],
    ["Inflación", fmtPct(g.assumptions.inflation), "Supuesto (flujos a precios constantes)"],
    ["Crecimiento de la demanda", fmtPct(g.assumptions.growth), "Supuesto"],
    ["Horizonte / vida útil", `${c?.horizon ?? g.assumptions.life} años`, "Dato de la alternativa"],
    ["Inversión técnica", c ? fmtMoney(c.rubros.filter((r) => ["obras", "equipos", "manoObra"].includes(r.id)).reduce((n, r) => n + r.amount, 0)) : "—", g.studies.includes("tecnico") ? "Estimación precisada por prefactibilidad" : "Estimación de referencia, sin prefactibilidad"],
  ];
  return (
    <details className="v22-tree">
      <summary>Supuestos del proyecto y fuente de cada dato</summary>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Variable</th>
              <th>Valor</th>
              <th>Tipo de dato</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([a, b, t]) => (
              <tr key={a}>
                <td>{a}</td>
                <td>{b}</td>
                <td>{t}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted">Los supuestos alimentan la sensibilidad. Puedes modificar tasas, crecimiento y vida útil en la pestaña de supuestos de la evaluación.</p>
    </details>
  );
}

/** Sensibilidad, escenarios, estrés y valor de quiebre sobre el flujo que construyó el jugador. */
export default function SensitivityLab({ g }: { g: GameState }) {
  const c = missionFlowCase(g),
    help = helpPolicy(g),
    [shocks, setShocks] = useState<Shocks>({}),
    [guess, setGuess] = useState<string>("");
  if (!c) return null;
  const f = playerFlow(g, c),
    run = (s: Shocks) => evaluate(c, f.rows, f.econ, f.benefits, s),
    base = run({}),
    now = run(shocks),
    crit = criticalVariable(c, f.rows, f.econ, f.benefits),
    tied = crit.ranked.filter((r) => Math.abs(r.delta - crit.critical.delta) < 1e-6).map((r) => r.id as string),
    advanced = moduleEnabled(g.scenarioId, "switching") && g.difficulty !== "guiado";
  const pct = (id: SensitivityVar) => Math.round(((shocks[id] ?? 1) - 1) * 100);
  return (
    <Panel title="Sensibilidad, escenarios y estrés" kicker="¿QUÉ PUEDE CAMBIAR LA DECISIÓN?">
      <ModuleIntro
        what={`Tu flujo${f.own ? "" : " de referencia (aún no confirmas el tuyo)"} tiene VPN financiero ${fmtMoney(base.npvF)} y VPN económico ${fmtMoney(base.npvE)}.`}
        why="Las estimaciones son inciertas. Saber qué variable amenaza la viabilidad orienta estudios, contingencias y la defensa del proyecto."
        decide="Explora cambios, identifica la variable crítica y observa la resiliencia ante choques combinados."
        next="Comparación de alternativas y comité evaluador."
      />
      <AssumptionsPanel g={g} />
      <div className="v22-sliders">
        {sensitivityVariables.map((v) => (
          <label key={v.id}>
            {v.label}: {pct(v.id) > 0 ? "+" : ""}
            {pct(v.id)} %
            <input type="range" min={-40} max={40} step={5} value={pct(v.id)} onChange={(e) => setShocks({ ...shocks, [v.id]: 1 + Number(e.target.value) / 100 })} />
          </label>
        ))}
        <label>
          Retraso de la operación: {shocks.delay ?? 0} año(s)
          <input type="range" min={0} max={3} step={1} value={shocks.delay ?? 0} onChange={(e) => setShocks({ ...shocks, delay: Number(e.target.value) })} />
        </label>
      </div>
      <p role="status">
        Con estos cambios: VPN financiero <strong>{fmtMoney(now.npvF)}</strong> ({fmtMoney(now.npvF - base.npvF)}) · VPN económico{" "}
        <strong>{fmtMoney(now.npvE)}</strong> ({fmtMoney(now.npvE - base.npvE)}).{" "}
        {Math.sign(now.npvE) !== Math.sign(base.npvE) && "La conclusión económica cambió."}
      </p>
      <button className="text-btn" onClick={() => setShocks({})}>
        Restablecer
      </button>
      <h4>Escenarios</h4>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Escenario</th>
              <th>Supuestos</th>
              <th>VPN financiero</th>
              <th>VPN económico</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(scenarioShocks) as (keyof typeof scenarioShocks)[]).map((k) => {
              const r = run(scenarioShocks[k]);
              return (
                <tr key={k}>
                  <td>{k === "optimista" ? "Optimista" : k === "base" ? "Base" : "Pesimista"}</td>
                  <td>{k === "optimista" ? "Demanda +15 %, costos −5 %, beneficios +10 %" : k === "base" ? "Supuestos confirmados" : "Demanda −15 %, inversión +15 %, O&M +10 %, beneficios −10 %, retraso 1 año"}</td>
                  <td>{fmtMoney(r.npvF)}</td>
                  <td>{fmtMoney(r.npvE)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {moduleEnabled(g.scenarioId, "stress") && (
        <>
          <h4>Pruebas de estrés</h4>
          <ul className="findings">
            {stressTests.map((t) => {
              const r = run(t.shocks);
              return (
                <Status key={t.id} level={r.npvE >= 0 ? "ok" : "grave"}>
                  {t.label}: VPN económico {fmtMoney(r.npvE)} — {r.npvE >= 0 ? "el proyecto resiste" : "el proyecto deja de ser viable"}.
                </Status>
              );
            })}
          </ul>
        </>
      )}
      <h4>Variable crítica</h4>
      <p>¿Qué variable amenaza más la viabilidad económica si empeora 10 %?</p>
      <div className="v22-choice methods">
        {sensitivityVariables.map((v) => (
          <label key={v.id} className={guess === v.id ? "chosen" : ""}>
            <input type="radio" name="critica" checked={guess === v.id} onChange={() => setGuess(v.id)} />
            {v.label}
          </label>
        ))}
      </div>
      {guess && (help.immediate ? (
        <ul className="findings">
          <Status level={tied.includes(guess) ? "ok" : "alerta"}>
            {tied.includes(guess) ? "Correcto." : `La variable crítica es ${crit.critical.label.toLowerCase()}.`} Cambio del VPN económico ante un 10 % desfavorable:{" "}
            {crit.ranked.map((r) => `${r.label} ${fmtMoney(r.delta)}`).join(" · ")}.
            {tied.length > 1 && " En el flujo económico la demanda actúa a través de los beneficios valorados: ambas pesan igual."}
          </Status>
        </ul>
      ) : (
        <p className="muted">Respuesta registrada para esta sesión.</p>
      ))}
      {advanced && (
        <>
          <h4>Valor de quiebre</h4>
          <p className="muted">¿Cuánto tendría que cambiar cada variable para que el VPN económico cambie de signo?</p>
          <ul className="findings">
            {sensitivityVariables.map((v) => {
              const sv = switchingValue(c, f.rows, f.econ, f.benefits, v.id);
              return (
                <Status key={v.id} level="info">
                  {v.label}: {sv ? `${sv.change > 0 ? "+" : ""}${(sv.change * 100).toFixed(0)} % cambia la decisión` : "ningún cambio entre −100 % y +300 % cambia la decisión"}.
                </Status>
              );
            })}
          </ul>
        </>
      )}
    </Panel>
  );
}

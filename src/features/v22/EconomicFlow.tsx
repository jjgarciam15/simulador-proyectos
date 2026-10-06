import { useState } from "react";
import type { GameState } from "../../domain/types";
import type { Action } from "../../domain/engine";
import { rpcById, rpcTable, type RpcCategory } from "../../data/rpc";
import {
  benefitCells,
  detectEconomicErrors,
  economicCells,
  economicNet,
  netFlow,
  npv,
  type EconomicRowInput,
} from "../../domain/flows";
import { missionFlowCase } from "../../domain/missionFlow";
import { helpPolicy } from "../../domain/help";
import { fmtMoney, fmtPct, fmtRpc } from "../../domain/format";
import { Panel, Button } from "../../components/ui";
import { useDraftGuard, different } from "../../components/workbench";
import { Deferred, ModuleIntro, Status } from "./common";
import NpvCalculator, { RpcFormula } from "./NpvCalculator";

export function RpcTable() {
  return (
    <details className="v22-rpc-table">
      <summary>Tabla de Razones Precio Cuenta (RPC)</summary>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Categoría</th>
              <th>RPC</th>
              <th>Fuente</th>
              <th>Nota</th>
            </tr>
          </thead>
          <tbody>
            {rpcTable.map((r) => (
              <tr key={r.id}>
                <td>{r.label}</td>
                <td>{fmtRpc(r.value)}</td>
                <td>{r.source}</td>
                <td>{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted">Valor económico = valor financiero × RPC. Tasa social de descuento: 9 % (DNP, Resolución 1092 de 2022).</p>
    </details>
  );
}

/** Flujo económico: RPC por rubro, exclusión de transferencias, beneficios valorados y comparación con el flujo financiero. */
export default function EconomicFlow({ g, send }: { g: GameState; send: (a: Action) => void }) {
  const c = missionFlowCase(g)!,
    help = helpPolicy(g),
    v = g.v2!.v22!,
    rows = v.flow?.rows ?? [],
    included = rows.filter((r) => r.kind !== "excluir"),
    [econ, setEcon] = useState<EconomicRowInput[]>(v.economic?.rows ?? []),
    [benefits, setBenefits] = useState<string[]>(v.economic?.benefits ?? []);
  useDraftGuard(different(econ, v.economic?.rows ?? []) || different(benefits, v.economic?.benefits ?? []));
  if (!v.flow) return <Panel title="Flujo económico y RPC" kicker="DEL VALOR DE MERCADO AL VALOR ECONÓMICO"><p>Confirma primero el flujo financiero.</p></Panel>;
  const rpcOf = (id: string) => econ.find((e) => e.rubroId === id)?.rpc ?? "";
  const setRpc = (id: string, rpc: RpcCategory | "") => setEcon([...econ.filter((e) => e.rubroId !== id), ...(rpc ? [{ rubroId: id, rpc }] : [])]);
  const finNet = netFlow(c, rows),
    ecoNet = economicNet(c, rows, econ, benefits),
    npvF = npv(finNet, c.financialRate),
    npvE = npv(ecoNet, c.socialRate),
    periods = Array.from({ length: c.horizon + 1 }, (_, p) => p),
    errors = v.economic ? detectEconomicErrors(c, rows, v.economic.rows, v.economic.benefits) : [],
    example = c.rubros.find((r) => r.id === "manoObra");
  // Guided RPC learning: hints on the first rows in easy learning mode, then the player works alone.
  const hinted = help.guidedHints ? included.slice(0, 3).map((r) => r.rubroId) : [];
  return (
    <Panel title="Flujo económico y RPC" kicker="DEL VALOR DE MERCADO AL VALOR ECONÓMICO">
      <ModuleIntro
        concepts={["flujo-economico", "rpc", "transferencias"]}
        what="El flujo financiero mide la caja del proyecto a precios de mercado. El flujo económico mide su aporte al bienestar de la sociedad."
        why="Los precios de mercado tienen distorsiones (impuestos, salarios, divisa). Las RPC las corrigen; las transferencias no son recursos."
        decide="Qué RPC aplica a cada rubro, qué rubros son transferencias y qué beneficios valorados entran sin doble conteo."
        next="VPN económico, sensibilidad, comparación de alternativas y comité."
      />
      <div className="v22-compare" aria-label="Flujo financiero frente a flujo económico">
        <div>
          <strong>FINANCIERO</strong>
          <span>Valor de mercado</span>
          <span>↓ Ajustes: ninguno</span>
          <span>Flujo financiero · tasa {fmtPct(c.financialRate)}</span>
        </div>
        <div>
          <strong>ECONÓMICO</strong>
          <span>Valor económico</span>
          <span>↓ RPC y exclusión de transferencias</span>
          <span>Flujo económico · tasa social {fmtPct(c.socialRate)}</span>
        </div>
      </div>
      {example && <p className="muted">Ejemplo de esta misión: <RpcFormula financial={example.amount} rpc={rpcById("moNoCalificada").value} label="mano de obra no calificada" /></p>}
      <RpcTable />
      <div className="table-wrap v22-sheet-wrap">
        <table className="v22-sheet">
          <thead>
            <tr>
              <th className="sticky">Rubro</th>
              <th>RPC aplicada</th>
              {periods.map((p) => (
                <th key={p}>P{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {included.map((row) => {
              const r = c.rubros.find((x) => x.id === row.rubroId)!,
                rpc = rpcOf(row.rubroId),
                cells = rpc ? economicCells(c, row, rpc) : periods.map(() => 0);
              return (
                <tr key={row.rubroId}>
                  <th className="sticky" scope="row">
                    {r.label}
                    {hinted.includes(row.rubroId) && <small className="muted">Pista: {rpcById(r.rpc).label.toLowerCase()}.</small>}
                  </th>
                  <td>
                    <select aria-label={"RPC de " + r.label} value={rpc} onChange={(e) => setRpc(row.rubroId, e.target.value as RpcCategory)}>
                      <option value="">Elegir RPC</option>
                      {rpcTable.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.label} · {fmtRpc(x.value)}
                        </option>
                      ))}
                    </select>
                  </td>
                  {cells.map((val, p) => (
                    <td key={p} className="cell-auto">
                      {val ? Math.round(val).toLocaleString("es-CO") : ""}
                    </td>
                  ))}
                </tr>
              );
            })}
            {c.benefits.map((b) => (
              <tr key={b.id}>
                <th className="sticky" scope="row">
                  <label className="checkline">
                    <input
                      type="checkbox"
                      checked={benefits.includes(b.id)}
                      onChange={(e) => setBenefits(e.target.checked ? [...benefits, b.id] : benefits.filter((x) => x !== b.id))}
                    />
                    {b.annual < 0 ? "Costo valorado: " : "Beneficio valorado: "}
                    {b.label}
                  </label>
                </th>
                <td>{fmtMoney(b.annual)}/año</td>
                {benefitCells(c, b).map((val, p) => (
                  <td key={p} className="cell-auto">
                    {benefits.includes(b.id) && val ? Math.round(val).toLocaleString("es-CO") : ""}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="v22-total">
              <th className="sticky">Flujo económico neto</th>
              <td />
              {ecoNet.map((val, p) => (
                <td key={p} className={"cell-auto " + (val < 0 ? "neg" : "")}>
                  {Math.round(val).toLocaleString("es-CO")}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      {!c.benefits.length && <p className="notice">No hay impactos valorados: el flujo económico solo tendrá costos. Valora los impactos primero.</p>}
      <div className="metric-grid">
        <div className="metric">
          <span>VPN financiero ({fmtPct(c.financialRate)})</span>
          <strong>{fmtMoney(npvF)}</strong>
        </div>
        <div className="metric">
          <span>VPN económico ({fmtPct(c.socialRate)})</span>
          <strong>{fmtMoney(npvE)}</strong>
        </div>
      </div>
      <p className="muted">
        {npvF < 0 && npvE >= 0
          ? "El proyecto no es atractivo financieramente, pero sí económicamente: la sociedad gana, aunque la caja no se sostiene sin financiación o tarifas."
          : npvF >= 0 && npvE < 0
            ? "El proyecto es atractivo financieramente, pero no económicamente: genera caja para el operador y costos netos para la sociedad."
            : npvF >= 0
              ? "El proyecto es atractivo financiera y económicamente."
              : "El proyecto no es atractivo ni financiera ni económicamente con estos supuestos."}
      </p>
      <NpvCalculator flows={ecoNet} rate={c.socialRate} label="VPN económico" economic />
      <Button disabled={econ.length < included.length} onClick={() => send({ type: "economic", rows: econ, benefits })}>
        Confirmar flujo económico ({econ.length}/{included.length} RPC)
      </Button>
      {v.economic &&
        (help.immediate ? (
          <ul className="findings">
            {errors.length ? (
              errors.map((e, i) => (
                <Status key={i} level={e.severity}>
                  {help.detail === "score" ? `Error en el flujo económico (${e.code}).` : e.message}
                </Status>
              ))
            ) : (
              <Status level="ok">Flujo económico consistente: RPC, transferencias y beneficios sin doble conteo.</Status>
            )}
          </ul>
        ) : (
          <Deferred />
        ))}
    </Panel>
  );
}

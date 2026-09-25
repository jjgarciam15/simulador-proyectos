import { useState } from "react";
import type { GameState } from "../../domain/types";
import type { Action } from "../../domain/engine";
import {
  detectFlowErrors,
  kindLabels,
  netFlow,
  npv,
  operatingPeriods,
  rowCells,
  type FlowCase,
  type RowInput,
  type RubroKind,
  type Timing,
} from "../../domain/flows";
import { missionFlowCase } from "../../domain/missionFlow";
import { helpPolicy } from "../../domain/help";
import { fmtMoney, fmtPct } from "../../domain/format";
import { Panel, Button } from "../../components/ui";
import { useDraftGuard, different } from "../../components/workbench";
import { Deferred, ModuleIntro, Status } from "./common";
import NpvCalculator from "./NpvCalculator";

type Draft = { rubroId: string; kind: RubroKind | ""; amount: number; timing: Timing; overrides?: Record<number, number> };
const timingOf = (t: Timing) => (t.type === "periodo" ? "periodo" : t.type);
const givenLabel = { entregado: "Dato entregado", calcular: "Debes calcular", ingresar: "Debes ingresar" } as const;

export function initialDraft(c: FlowCase, saved?: RowInput[]): Draft[] {
  return c.rubros.map((r) => {
    const s = saved?.find((x) => x.rubroId === r.id);
    return s ? { ...s } : { rubroId: r.id, kind: "", amount: r.given === "entregado" ? r.amount : 0, timing: { type: "ninguno" } };
  });
}
export const toRows = (d: Draft[]): RowInput[] => d.filter((r) => r.kind).map((r) => ({ ...r, kind: r.kind as RubroKind }));

/** Timeline of the project: construction, operation, maintenance/replacement and closing with residual value. */
export function Timeline({ c }: { c: FlowCase }) {
  const op = operatingPeriods(c),
    repl = c.rubros.find((r) => r.kind === "reinversion" && r.timing.type === "periodo");
  return (
    <div className="v22-timeline" aria-label="Línea de tiempo del proyecto">
      {Array.from({ length: c.horizon + 1 }, (_, p) => (
        <div key={p} className={p <= c.constructionEnd ? "build" : "operate"}>
          <b>{p}</b>
          <small>
            {p === 0 ? "Preparación y construcción" : p <= c.constructionEnd ? "Construcción" : p === op[0] ? "Inicio de operación" : ""}
            {repl && repl.timing.type === "periodo" && repl.timing.period === p ? "Reposición" : ""}
            {p === c.horizon ? " · Cierre y residual" : ""}
          </small>
        </div>
      ))}
    </div>
  );
}

/** Flujo financiero tipo hoja de cálculo: el jugador clasifica, calcula y ubica cada rubro; los totales son reactivos. */
export default function FlowSheet({ g, send }: { g: GameState; send: (a: Action) => void }) {
  const c = missionFlowCase(g)!,
    help = helpPolicy(g),
    saved = g.v2!.v22!.flow?.rows,
    [draft, setDraft] = useState<Draft[]>(() => initialDraft(c, saved)),
    [inspect, setInspect] = useState<{ rubroId: string; period: number } | null>(null);
  useDraftGuard(saved ? different(toRows(draft), saved) : draft.some((d) => d.kind));
  const rows = toRows(draft),
    net = netFlow(c, rows),
    value = npv(net, c.financialRate),
    periods = Array.from({ length: c.horizon + 1 }, (_, p) => p),
    errors = saved ? detectFlowErrors(c, saved) : [];
  const set = (id: string, patch: Partial<Draft>) => setDraft(draft.map((d) => (d.rubroId === id ? { ...d, ...patch } : d)));
  const setTiming = (id: string, type: string, period = 0) =>
    set(id, { timing: (type === "periodo" ? { type, period } : { type }) as Timing, overrides: undefined });
  const explain = (rubroId: string, p: number) => {
    const d = draft.find((x) => x.rubroId === rubroId)!,
      r = c.rubros.find((x) => x.id === rubroId)!;
    if (!d.kind) return "Clasifica el rubro para que aparezca en el flujo.";
    if (d.overrides?.[p] !== undefined) return `Celda editada a mano: ${fmtMoney(d.overrides[p])}. Restablece el rubro para volver al cálculo.`;
    const sg = d.kind === "ingreso" || d.kind === "residual" ? "+" : d.kind === "excluir" ? "0 ×" : "−";
    const where =
      d.timing.type === "construccion"
        ? `se reparte en ${c.constructionEnd + 1} periodo(s) de construcción`
        : d.timing.type === "operacion"
          ? `se repite en cada periodo de operación (${operatingPeriods(c)[0]}–${c.horizon})`
          : d.timing.type === "final"
            ? `aparece en el último periodo (${c.horizon})`
            : d.timing.type === "periodo"
              ? `aparece solo en el periodo ${d.timing.period}`
              : "no se ubicó en ningún periodo";
    return `${r.label} · periodo ${p}: ${sg} ${fmtMoney(d.amount)} (${kindLabels[d.kind]}); ${where}.${r.formula ? " Cálculo del caso: " + r.formula + "." : ""}`;
  };
  return (
    <Panel title="Flujo financiero del proyecto" kicker="HOJA DE CÁLCULO EDUCATIVA">
      <ModuleIntro
        what={`Horizonte de ${c.horizon} años (vida útil de la alternativa). Tasa de descuento financiera: ${fmtPct(c.financialRate)}.`}
        why="El flujo ordena en el tiempo cuándo se invierte, cuándo se opera y cuándo llegan los ingresos: sin él no hay VPN."
        decide="Clasifica cada rubro, calcula los valores que faltan y ubícalos en los periodos correctos. Algunos rubros no deben entrar."
        next="VPN financiero, flujo económico con RPC, sensibilidad y comparación de alternativas."
      />
      <Timeline c={c} />
      <p className="v22-legend">
        <span className="cell-given">Dato entregado</span>
        <span className="cell-compute">Debes calcular</span>
        <span className="cell-input">Debes ingresar</span>
        <span className="cell-auto">Calculado automáticamente</span>
      </p>
      <div className="table-wrap v22-sheet-wrap">
        <table className="v22-sheet">
          <thead>
            <tr>
              <th className="sticky">Rubro</th>
              <th>Tipo</th>
              <th>Monto (M)</th>
              <th>Cuándo ocurre</th>
              {periods.map((p) => (
                <th key={p}>P{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {draft.map((d) => {
              const r = c.rubros.find((x) => x.id === d.rubroId)!,
                cells = d.kind ? rowCells(c, { ...d, kind: d.kind }) : periods.map(() => 0);
              return (
                <tr key={d.rubroId}>
                  <th className="sticky" scope="row">
                    {r.label}
                    <small className={"cell-tag cell-" + (r.given === "entregado" ? "given" : r.given === "calcular" ? "compute" : "input")}>{givenLabel[r.given]}</small>
                    {r.formula && <small className="muted">{r.formula}</small>}
                  </th>
                  <td>
                    <select aria-label={"Tipo de " + r.label} value={d.kind} onChange={(e) => set(d.rubroId, { kind: e.target.value as RubroKind })}>
                      <option value="">Clasificar</option>
                      {(Object.keys(kindLabels) as RubroKind[]).map((k) => (
                        <option key={k} value={k}>
                          {kindLabels[k]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={r.given === "entregado" ? "cell-given" : r.given === "calcular" ? "cell-compute" : "cell-input"}>
                    <input
                      aria-label={"Monto de " + r.label}
                      type="number"
                      min={0}
                      value={Math.round(d.amount * 100) / 100 || ""}
                      readOnly={r.given === "entregado"}
                      onChange={(e) => set(d.rubroId, { amount: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <select aria-label={"Momento de " + r.label} value={timingOf(d.timing)} onChange={(e) => setTiming(d.rubroId, e.target.value)}>
                      <option value="ninguno">Sin ubicar / no aplica</option>
                      <option value="construccion">Construcción (P0{c.constructionEnd ? "–P" + c.constructionEnd : ""})</option>
                      <option value="operacion">Cada año de operación</option>
                      <option value="final">Último periodo (P{c.horizon})</option>
                      <option value="periodo">Un periodo específico</option>
                    </select>
                    {d.timing.type === "periodo" && (
                      <input
                        aria-label={"Periodo de " + r.label}
                        type="number"
                        min={0}
                        max={c.horizon}
                        value={d.timing.period}
                        onChange={(e) => setTiming(d.rubroId, "periodo", Number(e.target.value))}
                      />
                    )}
                  </td>
                  {cells.map((v, p) => (
                    <td key={p} className={"cell-auto " + (d.overrides?.[p] !== undefined ? "edited" : "")}>
                      <input
                        aria-label={`${r.label}, periodo ${p}`}
                        type="number"
                        value={v ? Math.round(v) : ""}
                        onFocus={() => setInspect({ rubroId: d.rubroId, period: p })}
                        onChange={(e) => set(d.rubroId, { overrides: { ...d.overrides, [p]: Number(e.target.value) } })}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
            <tr className="v22-total">
              <th className="sticky">Flujo neto</th>
              <td colSpan={3}>Suma de los rubros de cada periodo</td>
              {net.map((v, p) => (
                <td key={p} className={"cell-auto " + (v < 0 ? "neg" : "")}>
                  {Math.round(v).toLocaleString("es-CO")}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="v22-inspect" role="status">
        {inspect ? explain(inspect.rubroId, inspect.period) : "Selecciona una celda para ver cómo se calculó."}{" "}
        {inspect && (
          <button className="text-btn" onClick={() => set(inspect.rubroId, { overrides: undefined })}>
            Restablecer celdas editadas de este rubro
          </button>
        )}
      </p>
      <p>
        <strong>VPN financiero a {fmtPct(c.financialRate)}: {fmtMoney(value)}</strong>
      </p>
      <NpvCalculator flows={net} rate={c.financialRate} label="VPN financiero" />
      <Button disabled={!rows.length} onClick={() => send({ type: "flow", rows })}>
        Confirmar flujo financiero
      </Button>
      {saved &&
        (help.immediate ? (
          <ul className="findings">
            {errors.length ? (
              errors.map((e, i) => (
                <Status key={i} level={e.severity}>
                  {help.detail === "score" ? `Error en un rubro (${e.code}).` : e.message}
                </Status>
              ))
            ) : (
              <Status level="ok">El flujo financiero es consistente con el caso.</Status>
            )}
          </ul>
        ) : (
          <Deferred />
        ))}
    </Panel>
  );
}

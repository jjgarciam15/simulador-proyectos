import { useState } from "react";
import { exam2, examCase } from "../../data/exam2";
import { rpcTable, type RpcCategory } from "../../data/rpc";
import { methodById } from "../../data/valuationMethods";
import { decisionReasons, examReference, examResults, sensitivityOptions, type ExamAnswers } from "../../domain/exam2";
import { economicNet, netFlow, npv } from "../../domain/flows";
import { fmtMoney } from "../../domain/format";
import { kindText } from "../../domain/valuation";
import { Panel, Button } from "../../components/ui";
import { FlowTable, initialDraft, toRows, type Draft } from "./FlowSheet";
import NpvCalculator from "./NpvCalculator";
import { Status } from "./common";
import { stableShuffle } from "../../domain/shuffle";

const steps = ["Caso", "Objetivos", "Alternativas", "Datos", "Flujo financiero", "VPN", "Efectos e impactos", "Valoración", "RPC", "Flujo económico", "Comparación", "Sensibilidad", "Decisión"];
const KEY = "proyecta-exam2-v1";
export interface ExamAttempt {
  date: string;
  mode: "aprendizaje" | "evaluacion";
  total: number;
}
export function loadAttempts(): ExamAttempt[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => Number.isFinite(x?.total)) : [];
  } catch {
    return [];
  }
}
function saveAttempt(a: ExamAttempt) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...loadAttempts(), a].slice(-20)));
  } catch {
    /* storage unavailable: the result is still shown */
  }
}
function Radio({ name, options, value, onChange, shuffle = true }: { name: string; options: { id: string; text: string }[]; value?: string; onChange: (id: string) => void; shuffle?: boolean }) {
  return (
    <div className="v22-choice">
      {(shuffle ? stableShuffle(name, options) : options).map((o) => (
        <label key={o.id} className={value === o.id ? "chosen" : ""}>
          <input type="radio" name={name} checked={value === o.id} onChange={() => onChange(o.id)} />
          {o.text}
        </label>
      ))}
    </div>
  );
}

/** Examen 2: applied case with an Excel-like template, deferred feedback in evaluation mode. */
export default function Exam2({ onExit }: { onExit: () => void }) {
  const [mode, setMode] = useState<"aprendizaje" | "evaluacion" | null>(null),
    [step, setStep] = useState(0),
    [a, setA] = useState<ExamAnswers>({}),
    [draft, setDraft] = useState<Draft[]>(() => initialDraft(examCase("A"))),
    [checked, setChecked] = useState<Record<number, boolean>>({}),
    [done, setDone] = useState(false);
  const A = examCase("A"),
    ref = examReference(),
    set = (patch: Partial<ExamAnswers>) => setA({ ...a, ...patch }),
    answers = { ...a, flow: toRows(draft) },
    results = examResults(answers),
    stepRow = results.rows.find((r) => r.step === steps[step]);
  if (!mode)
    return (
      <Panel title="Examen 2 · caso aplicado" kicker="CASO → FLUJO → VALORACIÓN → RPC → DECISIÓN">
        <p>{exam2.title}. Trece pasos: del caso a la decisión, con una plantilla tipo hoja de cálculo. La plantilla usa el mismo motor que las misiones.</p>
        <div className="actions">
          <Button onClick={() => setMode("aprendizaje")}>Practicar (retroalimentación inmediata)</Button>
          <Button secondary onClick={() => setMode("evaluacion")}>
            Modo examen (retroalimentación al final)
          </Button>
          <button className="text-btn" onClick={onExit}>
            Volver
          </button>
        </div>
        {loadAttempts().length > 0 && (
          <p className="muted">
            Intentos anteriores: {loadAttempts().map((x) => `${x.total}/100 (${x.mode})`).join(" · ")}. Se guarda cada intento; no se acumulan puntos por repetir.
          </p>
        )}
      </Panel>
    );
  if (done)
    return (
      <Panel title={`Resultado del Examen 2: ${results.total}/100`} kicker="RETROALIMENTACIÓN COMPLETA">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Paso</th>
                <th>Puntos</th>
                <th>Retroalimentación</th>
              </tr>
            </thead>
            <tbody>
              {results.rows.map((r) => (
                <tr key={r.step}>
                  <td>{r.step}</td>
                  <td>
                    {r.points}/{r.max}
                  </td>
                  <td>{r.feedback}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button onClick={onExit}>Terminar</Button>
      </Panel>
    );
  const body = (() => {
    switch (steps[step]) {
      case "Caso":
        return (
          <>
            <p>{exam2.context}</p>
            <p>
              <strong>Problema:</strong> {exam2.problem}
            </p>
            <ul>
              {exam2.constraints.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </>
        );
      case "Objetivos":
        return <Radio name="obj" options={exam2.objectives} value={a.objective} onChange={(id) => set({ objective: id })} />;
      case "Alternativas":
        return (
          <>
            {exam2.alternatives.map((x) => (
              <p key={x.id}>
                <strong>
                  {x.id}. {x.name}:
                </strong>{" "}
                {x.text}
              </p>
            ))}
            <p>{exam2.tradeoff.question}</p>
            <Radio name="tr" options={exam2.tradeoff.options} value={a.tradeoff} onChange={(id) => set({ tradeoff: id })} />
          </>
        );
      case "Datos":
        return (
          <>
            <div className="table-wrap">
              <table>
                <tbody>
                  {exam2.data.map((d) => (
                    <tr key={d.label}>
                      <td>{d.label}</td>
                      <td>{d.value}</td>
                      <td>{d.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>{exam2.sunkQuestion.question}</p>
            <Radio name="sunk" options={exam2.sunkQuestion.options} value={a.sunk} onChange={(id) => set({ sunk: id })} />
          </>
        );
      case "Flujo financiero":
        return (
          <>
            <p className="muted">Construye el flujo de la alternativa A. Tasa financiera 12 %, horizonte 5 años.</p>
            <FlowTable c={A} draft={draft} setDraft={setDraft} />
          </>
        );
      case "VPN": {
        const own = netFlow(A, toRows(draft));
        return (
          <>
            <p>Calcula el VPN financiero de tu flujo al 12 % e ingrésalo.</p>
            <label className="v22-compute">
              VPN financiero (M)
              <input type="number" value={a.npv ?? ""} onChange={(e) => set({ npv: e.target.value === "" ? undefined : Number(e.target.value) })} />
            </label>
            {mode === "aprendizaje" && <NpvCalculator flows={own} rate={A.financialRate} label="VPN financiero" />}
          </>
        );
      }
      case "Efectos e impactos":
        return exam2.impacts.map((i) => (
          <label key={i.id} className="v22-row-select">
            {i.text}
            <select value={a.impacts?.[i.id] ?? ""} onChange={(e) => set({ impacts: { ...a.impacts, [i.id]: e.target.value } })}>
              <option value="">Clasificar</option>
              {Object.entries(kindText).map(([k, t]) => (
                <option key={k} value={k}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        ));
      case "Valoración":
        return (
          <>
            <p>¿Con qué método valoras las visitas recreativas al humedal?</p>
            <Radio name="met" options={exam2.valuation.offered.map((id) => methodById(id)!).map((m) => ({ id: m.id, text: m.name + " · " + m.family }))} value={a.method} onChange={(id) => set({ method: id })} />
            <label className="v22-compute">
              Beneficio anual de A (M) = visitas × excedente por visita
              <input type="number" value={a.benefit ?? ""} onChange={(e) => set({ benefit: e.target.value === "" ? undefined : Number(e.target.value) })} />
            </label>
          </>
        );
      case "RPC":
        return exam2.rpcRows.map((id) => {
          const r = A.rubros.find((x) => x.id === id)!;
          return (
            <label key={id} className="v22-row-select">
              {r.label}
              <select value={a.rpc?.[id] ?? ""} onChange={(e) => set({ rpc: { ...a.rpc, [id]: e.target.value as RpcCategory } })}>
                <option value="">Elegir RPC</option>
                {rpcTable.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label} · {x.value}
                  </option>
                ))}
              </select>
            </label>
          );
        });
      case "Flujo económico": {
        const econ = Object.entries(a.rpc ?? {}).map(([rubroId, rpc]) => ({ rubroId, rpc })),
          net = economicNet(A, toRows(draft), econ, a.benefits ?? []);
        return (
          <>
            <p>¿Qué beneficios y costos valorados incluyes en el flujo económico de A?</p>
            {A.benefits.map((b) => (
              <label key={b.id} className="checkline">
                <input
                  type="checkbox"
                  checked={a.benefits?.includes(b.id) ?? false}
                  onChange={(e) => set({ benefits: e.target.checked ? [...(a.benefits ?? []), b.id] : (a.benefits ?? []).filter((x) => x !== b.id) })}
                />
                {b.label}: {fmtMoney(b.annual)}/año
              </label>
            ))}
            <p>
              VPN económico de tu flujo al 9 %: <strong>{fmtMoney(npv(net, A.socialRate))}</strong>
            </p>
          </>
        );
      }
      case "Comparación":
        return (
          <>
            <p>
              Flujos de referencia de B: VPN financiero {fmtMoney(ref.rB.npvF)} · VPN económico {fmtMoney(ref.rB.npvE)}. Compáralos con tu evaluación de A.
            </p>
            <Radio
              name="cmp"
              options={[
                { id: "A", text: "A tiene mayor VPN económico" },
                { id: "B", text: "B tiene mayor VPN económico" },
                { id: "igual", text: "Tienen el mismo VPN económico porque protegen el mismo humedal" },
                { id: "financiero", text: "Gana la de mayor VPN financiero; el económico no se compara" },
                { id: "barata", text: "B, porque la alternativa de menor inversión siempre tiene mayor VPN" },
              ]}
              value={a.compare}
              onChange={(id) => set({ compare: id })}
            />
          </>
        );
      case "Sensibilidad":
        return (
          <>
            <p>Si las visitas caen 30 % en ambas alternativas, ¿qué ocurre con la viabilidad económica?</p>
            <Radio name="sens" options={sensitivityOptions()} value={a.sensitivity} onChange={(id) => set({ sensitivity: id })} />
          </>
        );
      case "Decisión":
        return (
          <>
            <Radio
              name="dec"
              shuffle={false}
              options={[
                { id: "A", text: "Elijo A" },
                { id: "B", text: "Elijo B" },
              ]}
              value={a.decision}
              onChange={(id) => set({ decision: id as "A" | "B" })}
            />
            <p>¿Por qué?</p>
            <Radio name="why" options={decisionReasons} value={a.reason} onChange={(id) => set({ reason: id })} />
          </>
        );
    }
  })();
  const last = step === steps.length - 1;
  return (
    <Panel title={`Examen 2 · ${steps[step]}`} kicker={`PASO ${step + 1} DE ${steps.length} · ${mode === "evaluacion" ? "MODO EXAMEN" : "PRÁCTICA"}`}>
      <ol className="v22-stepper" aria-label="Secuencia del examen">
        {steps.map((x, i) => (
          <li key={x} className={i === step ? "on" : i < step ? "done" : ""}>
            {x}
          </li>
        ))}
      </ol>
      {body}
      {mode === "aprendizaje" && stepRow && checked[step] && (
        <ul className="findings">
          <Status level={stepRow.points === stepRow.max ? "ok" : stepRow.points > 0 ? "alerta" : "grave"}>
            {stepRow.points}/{stepRow.max}. {stepRow.feedback}
          </Status>
        </ul>
      )}
      <div className="actions">
        {step > 0 && (
          <Button secondary onClick={() => setStep(step - 1)}>
            Anterior
          </Button>
        )}
        {mode === "aprendizaje" && stepRow && (
          <Button secondary onClick={() => setChecked({ ...checked, [step]: true })}>
            Comprobar
          </Button>
        )}
        <Button
          onClick={() => {
            if (last) {
              saveAttempt({ date: new Date().toISOString(), mode, total: results.total });
              setDone(true);
            } else setStep(step + 1);
          }}
        >
          {last ? "Entregar examen" : "Siguiente"}
        </Button>
      </div>
      <p className="muted">
        {answers.flow.length ? `Rubros en tu flujo: ${answers.flow.length}.` : ""} Resultados de la alternativa B: se entregan como dato para comparar. {mode === "evaluacion" && "Podrás ver la retroalimentación al entregar."}
      </p>
    </Panel>
  );
}

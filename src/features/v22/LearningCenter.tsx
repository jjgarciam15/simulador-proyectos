import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { concepts, conceptCategories, conceptById, type Concept } from "../../data/concepts";
import { rpcTable } from "../../data/rpc";
import { npv } from "../../domain/flows";
import { fmtMoney } from "../../domain/format";

function Exercise({ c }: { c: Concept }) {
  const [pick, setPick] = useState("");
  const chosen = c.exercise.options.find((o) => o.id === pick);
  return (
    <div className="v22-experiment">
      <h4>Mini ejercicio · no afecta la partida</h4>
      <p>{c.exercise.question}</p>
      <div className="v22-choice">
        {c.exercise.options.map((o) => (
          <label key={o.id} className={pick === o.id ? "chosen" : ""}>
            <input type="radio" name={"ex" + c.id} checked={pick === o.id} onChange={() => setPick(o.id)} />
            {o.text}
          </label>
        ))}
      </div>
      {chosen && (
        <p role="status" className={"v22-status " + (chosen.correct ? "ok" : "grave")}>
          <span className="v22-status-label">{chosen.correct ? "Correcto:" : "Revisa:"}</span> {chosen.feedback}
        </p>
      )}
    </div>
  );
}
export function ConceptView({ c, open }: { c: Concept; open: (id: string) => void }) {
  return (
    <article className="v22-concept">
      <span className="badge">{c.category}</span>
      <h3>{c.name}</h3>
      <p className="lead">{c.definition}</p>
      {c.diagram && <code className="v22-diagram">{c.diagram}</code>}
      <dl>
        <dt>Explicación</dt>
        <dd>{c.explanation}</dd>
        <dt>¿Para qué sirve?</dt>
        <dd>{c.purpose}</dd>
        <dt>Ejemplo</dt>
        <dd>{c.example}</dd>
        <dt>Dentro del simulador</dt>
        <dd>{c.inSimulator}</dd>
        <dt>Error frecuente</dt>
        <dd>{c.commonError}</dd>
      </dl>
      <p>
        <strong>Relacionado: </strong>
        {c.related.map((id) => (
          <button key={id} className="text-btn v22-chip" onClick={() => open(id)}>
            {conceptById(id)?.name ?? id}
          </button>
        ))}
      </p>
      <Exercise key={c.id} c={c} />
    </article>
  );
}
/** Práctica rápida: VPN, RPC and concepts without playing a full mission (random but reproducible per round). */
function QuickPractice() {
  const [round, setRound] = useState(1),
    [answer, setAnswer] = useState(""),
    [kind, setKind] = useState<"vpn" | "rpc">("vpn");
  const q = useMemo(() => {
    const r = (n: number) => ((round * 9301 + n * 49297) % 233280) / 233280;
    if (kind === "vpn") {
      const inv = 500 + Math.round(r(1) * 10) * 100,
        f = 200 + Math.round(r(2) * 6) * 50,
        rate = [0.08, 0.09, 0.1, 0.12][Math.floor(r(3) * 4)];
      return { text: `Inversión de ${inv} hoy y flujos de ${f} al final de los años 1, 2 y 3. Tasa ${rate * 100} %. ¿VPN?`, value: npv([-inv, f, f, f], rate), hint: `VPN = −${inv} + ${f}/(1+${rate}) + ${f}/(1+${rate})² + ${f}/(1+${rate})³` };
    }
    const pool = rpcTable.filter((x) => x.value > 0),
      e = pool[Math.floor(r(4) * pool.length)],
      v = 1000 + Math.round(r(5) * 20) * 100;
    return { text: `Rubro de ${v} M en «${e.label}» (RPC ${e.value}). ¿Valor económico?`, value: v * e.value, hint: `${v} × ${e.value}` };
  }, [round, kind]);
  const ok = answer !== "" && Math.abs(Number(answer) - q.value) <= Math.max(1, Math.abs(q.value) * 0.01);
  return (
    <div className="v22-quick">
      <div className="actions">
        <button className={"v22-tab " + (kind === "vpn" ? "on" : "")} onClick={() => { setKind("vpn"); setAnswer(""); }}>VPN</button>
        <button className={"v22-tab " + (kind === "rpc" ? "on" : "")} onClick={() => { setKind("rpc"); setAnswer(""); }}>RPC</button>
      </div>
      <p>{q.text}</p>
      <label>
        Tu respuesta (M)
        <input type="number" value={answer} onChange={(e) => setAnswer(e.target.value)} />
      </label>
      {answer !== "" && (
        <p role="status" className={"v22-status " + (ok ? "ok" : "alerta")}>
          <span className="v22-status-label">{ok ? "Correcto." : "Aún no."}</span> {ok ? `Valor exacto: ${fmtMoney(q.value)}.` : `Pista: ${q.hint}.`}
        </p>
      )}
      <button className="text-btn" onClick={() => { setRound(round + 1); setAnswer(""); }}>
        Otro ejercicio
      </button>
      <p className="muted">Para practicar impactos, valoración y regulación usa los mini ejercicios de cada concepto.</p>
    </div>
  );
}
/** Centro de aprendizaje: concept network with search, categories, related links and exercises. */
export default function LearningCenter({ focus }: { focus?: string }) {
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState(""),
    [current, setCurrent] = useState(focus ?? "vpn"),
    [tab, setTab] = useState<"conceptos" | "practica">("conceptos");
  const q = query.trim().toLowerCase();
  const list = concepts.filter(
    (c) =>
      (!category || c.category === category) &&
      (!q || [c.name, c.definition, c.category, c.id].some((t) => t.toLowerCase().includes(q))),
  );
  const c = conceptById(current) ?? concepts[0];
  return (
    <div className="v22-learning">
      <div className="actions">
        <button className={"v22-tab " + (tab === "conceptos" ? "on" : "")} onClick={() => setTab("conceptos")}>
          Conceptos
        </button>
        <button className={"v22-tab " + (tab === "practica" ? "on" : "")} onClick={() => setTab("practica")}>
          Práctica rápida
        </button>
      </div>
      {tab === "practica" ? (
        <QuickPractice />
      ) : (
        <div className="v22-learning-grid">
          <aside>
            <label className="v22-search">
              <Search size={15} aria-hidden />
              <input placeholder="Buscar: VPN, RPC, impacto…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar concepto" />
            </label>
            <select aria-label="Categoría" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Todas las categorías</option>
              {conceptCategories.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <ul>
              {list.map((x) => (
                <li key={x.id}>
                  <button className={x.id === c.id ? "on" : ""} onClick={() => setCurrent(x.id)}>
                    {x.name}
                  </button>
                </li>
              ))}
              {!list.length && <li className="muted">Sin resultados.</li>}
            </ul>
          </aside>
          <ConceptView c={c} open={setCurrent} />
        </div>
      )}
    </div>
  );
}

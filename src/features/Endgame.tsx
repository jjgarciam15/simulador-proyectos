import {NegotiationCommitments} from './NegotiationDesk';
import {FinalRecognition} from './Recognition';
import { ReconstructionScene, EventChoices } from "../components/LivingWorld";
import { useState } from "react";
import {
  ArrowRight,
  Play,
  RotateCcw,
  GitBranch,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import type { GameState } from "../domain/types";
import {
  model,
  selected,
  projectCost,
  available,
  schedule,
  riskLevel,
  indicatorValue,
  sdgImpact,
  type Action,
} from "../domain/engine";
import { scenarioById } from "../data/scenarios";
import { sdgs } from "../data/sdgs";
import { money, number, clamp } from "../domain/finance";
import { Panel, Button, Metric, Field, Chart, Tip } from "../components/ui";
import { FinancialMetrics } from "./Evaluation";
import { Finance } from "./Preparation";
import { Risks } from "./Regulation";

export function Journal({ g }: { g: GameState }) {
  return (
    <div className="journal">
      {g.journal.map((d) => (
        <article key={d.id}>
          <span className="journal-dot" />
          <div className="eyebrow">
            MES {d.month} · DECISIÓN {String(d.id).padStart(2, "0")}
          </div>
          <h4>{d.title}</h4>
          <p>{d.detail}</p>
          {(d.cost > 0 || d.time > 0) && (
            <small>
              $ {money(d.cost)} · {d.time} meses
            </small>
          )}
          {d.justification && <blockquote>«{d.justification}»</blockquote>}
        </article>
      ))}
    </div>
  );
}

export function Decision({
  g,
  send,
}: {
  g: GameState;
  send: (a: Action) => void;
}) {
  const a = selected(g)!,
    s = scenarioById(g.scenarioId),
    [text, setText] = useState(g.justification),
    [confirm, setConfirm] = useState(false);
  return (
    <>
      <Panel
        title="Es momento de tomar posición"
        kicker="COMPROMISO DE INVERSIÓN"
      >
        <div className="decision-hero">
          <span className="alternative-letter">
            {String.fromCharCode(65 + Number(a.id.slice(1)))}
          </span>
          <div>
            <h2>{a.name}</h2>
            <p>{a.tradeoff}</p>
          </div>
        </div>
        <FinancialMetrics g={g} />
        <div className="metric-grid">
          <Metric label="A comprometer" value={"$ " + money(projectCost(g))} />
          <Metric
            label="Saldo posterior"
            value={"$ " + money(available(g) - projectCost(g))}
          />
          <Metric
            label="Terminación prevista"
            value={
              "Mes " +
              (g.month +
                Math.max(a.months, schedule(g.activities).duration) +
                g.assumptions.delay)
            }
            sub={"Restricción: mes " + s.deadline}
          />
        </div>
        <Field
          label="¿Por qué esta alternativa es adecuada bajo tus restricciones?"
          hint="Se conserva para discusión. No se califica automáticamente ni bloquea la partida."
        >
          <textarea
            rows={4}
            maxLength={1200}
            value={text}
            placeholder="Explica el beneficio principal, el sacrificio que aceptas y el supuesto que más te preocupa…"
            onChange={(e) => setText(e.target.value)}
          />
        </Field>
        <Button secondary onClick={() => send({ type: "justify", text })}>
          Guardar justificación
        </Button>
        <NegotiationCommitments g={g}/><Tip title="Antes de comprometer">
          La inversión congela la evaluación ex ante. Los cambios posteriores
          deben hacerse mediante respuestas a eventos. Un resultado adverso no
          invalida automáticamente el razonamiento usado hoy.
        </Tip>
        <label className="checkline confirm-line">
          <input
            type="checkbox"
            checked={confirm}
            onChange={(e) => setConfirm(e.target.checked)}
          />
          Comprendo los compromisos y las restricciones de la propuesta.
        </label>
        <Button
          disabled={!confirm || projectCost(g) > available(g)}
          onClick={() => send({ type: "commit", text })}
        >
          Comprometer inversión e iniciar ejecución <ArrowRight size={17} />
        </Button>
      </Panel>
      <Risks g={g} send={send} />
      <Finance g={g} send={send} />
    </>
  );
}

export function Execution({
  g,
  send,
}: {
  g: GameState;
  send: (a: Action) => void;
}) {
  const a = selected(g)!,
    s = scenarioById(g.scenarioId),
    m = model(g, a, true),
    duration =
      Math.max(a.months, schedule(g.activities).duration) + g.assumptions.delay,
    progress = clamp(g.elapsed / (duration + g.delay), 0, 1),
    event = g.pendingEvent;
  return (
    <>
      <Panel
        title="El proyecto se encuentra con la realidad"
        kicker={"EJECUCIÓN · MES " + g.elapsed}
      >
        <ReconstructionScene g={g} progress={progress} />
        <div className="execution-progress">
          <span style={{ width: progress * 100 + "%" }} />
        </div>
        <div className="metric-grid">
          <Metric
            label="Avance de ejecución"
            value={Math.round(progress * 100) + " %"}
          />
          <Metric
            label="Tiempo transcurrido total"
            value={g.month + " meses"}
            sub={"Límite: " + s.deadline}
          />
          <Metric
            label="Desviación por eventos"
            value={"$ " + money(g.extraCost)}
            sub={"Retraso acumulado: " + g.delay + " meses"}
          />
        </div>
        <div className="two-col">
          <Chart
            bar
            data={[
              {
                name: "Recursos",
                planeado: projectCost({ ...g, budget: g.snapshot!.budget }),
                real: g.spent + g.committed,
              },
              { name: "Desviación", planeado: 0, real: g.extraCost },
            ]}
            series={[
              { key: "planeado", name: "Planeado M COP", color: "#a8bbae" },
              {
                key: "real",
                name: "Ejecutado + comprometido",
                color: "#377864",
              },
            ]}
          />
          <Chart
            bar
            data={[
              {
                name: "Cobertura %",
                planeado: model(g).coverage * 100,
                real: m.coverage * progress * 100,
              },
              {
                name: "Riesgo /100",
                planeado: riskLevel(g.snapshot!.decisionState!),
                real: riskLevel(g),
              },
            ]}
            series={[
              { key: "planeado", name: "Previsto", color: "#cbbb96" },
              { key: "real", name: "Observado", color: "#779587" },
            ]}
          />
        </div>
        {!event && (
          <div className="actions">
            <Button onClick={() => send({ type: "advance" })}>
              <Play size={17} />
              Avanzar hasta 3 meses
            </Button>
            <span className="muted">
              El avance se detiene cuando aparece una decisión.
            </span>
          </div>
        )}
      </Panel>
      {event && (
        <Panel
          className="event-panel"
          title={event.name}
          kicker="CAMBIO DE CONTEXTO"
        >
          <div className="event-heading">
            <AlertTriangle size={28} />
            <p>{event.description}</p>
          </div>
          <p>
            Continuar expone a un sobrecosto base de{" "}
            {Math.round(
              event.cost *
                (event.id !== "technical-reveal" && g.difficulty === "experto"
                  ? 1.25
                  : 1) *
                100,
            )}{" "}
            % de la inversión técnica, {event.delay} meses de retraso y un
            cambio de desempeño de {Math.round(event.benefit * 100)} %.
          </p>
          <p className="muted">
            La contingencia puede absorber costos. Si no alcanza el saldo, obtén
            financiación o reduce el alcance.
          </p>
          <EventChoices key={event.id} g={g} send={send} />
        </Panel>
      )}
      <Panel
        title="Seguimiento de indicadores"
        kicker="RESULTADOS EN CONSTRUCCIÓN"
      >
        {g.indicators.map((ind, i) => {
          const factor =
            ind.kind === "Gestión"
              ? progress
              : ind.kind === "Producto"
                ? progress * g.performance
                : progress * g.performance * m.maintenanceRatio;
          const current = indicatorValue(g, ind, progress);
          return (
            <div className="indicator-track" key={i}>
              <div>
                <strong>{ind.name}</strong>
                <span>
                  {number(current)} / {number(ind.target)} {ind.unit}
                </span>
              </div>
              <progress value={clamp(factor, 0, 1)} max={1} />
              <small>
                {ind.kind} · {ind.frequency} · {ind.source} · {ind.owner}
              </small>
            </div>
          );
        })}
      </Panel>
      <Finance g={g} send={send} />
      <Panel title="Últimas decisiones">
        <Journal g={{ ...g, journal: g.journal.slice(-6) }} />
      </Panel>
    </>
  );
}

export function Results({
  g,
  onRetry,
  onFork,
}: {
  g: GameState;
  onRetry: () => void;
  onFork: () => void;
}) {
  const o = g.outcome!,
    s = scenarioById(g.scenarioId),
    [details, setDetails] = useState(false);
  return (
    <>
      <Panel className="result-hero" kicker="EVALUACIÓN EX POST">
        <div className="result-top">
          <div>
            <span className="badge">
              {
                {
                  completado: "Ejecución completada",
                  incumplimiento: "Cierre con incumplimiento",
                  insolvencia: "Cierre por insolvencia",
                  abandonado: "Proyecto abandonado",
                }[o.status]
              }
            </span>
            <h2>
              Una decisión.
              <br />
              Muchas consecuencias.
            </h2>
            <p>
              {selected(g)!.name} · {s.territory}
            </p>
          </div>
          <div className="score-circle">
            <strong>{o.score}</strong>
            <span>DE 100</span>
          </div>
        </div>
        <p className="result-quote">
          Un buen proyecto utiliza adecuadamente los recursos disponibles para
          solucionar un problema real y sigue siendo viable cuando la realidad
          cambia.
        </p>
        <div className="actions">
          <Button onClick={onRetry}>
            <RotateCcw size={16} />
            Volver a intentarlo
          </Button>
          <Button secondary onClick={onFork} disabled={!g.snapshot}>
            <GitBranch size={16} />
            Explorar qué habría pasado si…
          </Button>
        </div>
      </Panel>
      <ScoreV2 g={g}/><FinalRecognition g={g}/><Panel title="Lo esperado y lo que ocurrió">
        <div className="metric-grid">
          <Metric
            label="VPN financiero observado"
            value={"$ " + money(o.financial)}
            sub={"Esperado: $ " + money(o.expectedFinancial)}
          />
          <Metric
            label="VPN social observado"
            value={"$ " + money(o.social)}
            sub={"Esperado: $ " + money(o.expectedSocial)}
          />
          <Metric
            label="Cobertura observada"
            value={(o.coverage * 100).toFixed(1) + " %"}
            sub={number(o.coverage * s.affected) + " beneficiarios directos"}
          />
        </div>
        <Chart
          bar
          data={[
            {
              name: "VPN financiero",
              esperado: o.expectedFinancial,
              real: o.financial,
            },
            { name: "VPN social", esperado: o.expectedSocial, real: o.social },
          ]}
          series={[
            { key: "esperado", name: "Ex ante · M COP", color: "#c4b28b" },
            { key: "real", name: "Ex post · M COP", color: "#477b69" },
          ]}
        />
        <p className="muted">
          Beneficiarios indirectos estimados:{" "}
          {number(o.coverage * s.affected * 0.25)} personas (supuesto educativo
          de efectos secundarios, no se suman a cobertura directa).
        </p>
      </Panel>
      <Panel
        title="El valor de lo que no elegiste"
        kicker="COSTO DE OPORTUNIDAD"
      >
        <div className="metric-grid">
          <Metric
            label="Beneficio sacrificado observado"
            value={"$ " + money(o.opportunity)}
          />
          <Metric
            label="Diferencia esperada al decidir"
            value={"$ " + money(o.expectedOpportunity)}
          />
          <Metric
            label="Recursos desperdiciados / sobrecostos"
            value={"$ " + money(o.wasted)}
            sub="Se informa separado; no se suma al costo de oportunidad"
          />
        </div>
        <p>
          Mejor alternativa factible entre las modeladas:{" "}
          <strong>{o.best}</strong>.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Alternativa</th>
                <th>Factible al decidir</th>
                <th>Valor esperado</th>
                <th>Valor simulado ex post</th>
              </tr>
            </thead>
            <tbody>
              {o.alternatives.map((a) => (
                <tr key={a.name}>
                  <td>
                    {a.name}
                    {a.name === selected(g)!.name ? " · Tu decisión" : ""}
                  </td>
                  <td>{a.feasible ? "Sí" : "Fuera de restricciones"}</td>
                  <td>{money(a.expected)}</td>
                  <td>{money(a.realized)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Tip title="Decisión razonable y resultado favorable">
          Compara únicamente alternativas modeladas bajo recursos y condiciones
          comunes. La diferencia esperada usa información disponible al decidir;
          la realizada incorpora condiciones reveladas. No demuestra un óptimo
          universal ni convierte suerte en calidad de decisión.
        </Tip>
      </Panel>
      <Panel title="Tu criterio, en perspectiva" kicker="DEBRIEF">
        <div className="lessons">
          {o.lessons.map((lesson, i) => (
            <article key={i}>
              <BookOpen size={20} />
              <p>{lesson}</p>
            </article>
          ))}
        </div>
        <div className="score-dimensions">
          {o.dimensions.map((d) => (
            <div key={d.name}>
              <span>{d.name}</span>
              <progress max={100} value={d.value} />
              <strong>{Math.round(d.value)}</strong>
            </div>
          ))}
        </div>
        <button className="text-btn" onClick={() => setDetails(!details)}>
          {details ? "Ocultar" : "Consultar"} cómo se calculó el resultado
        </button>
        {details && (
          <div className="formula">
            <p>
              Puntuación = suma de valor normalizado × peso. Abandono e
              insolvencia multiplican el agregado por 0,35.
            </p>
            {o.dimensions.map((d) => (
              <p key={d.name}>
                {d.name}: {d.value.toFixed(1)} × {(d.weight * 100).toFixed(0)} %
                = {(d.value * d.weight).toFixed(1)}
              </p>
            ))}
            <p>
              Coherencia base: 45 % árbol, 25 % objetivo, 30 % vínculos. En contenido 3: 70 % de esa base + 15 % conexiones causales + 15 % cadena de valor. Los textos no se califican. Valor: 50 +
              VPN / presupuesto × 30. Cobertura/equidad: 65/35.
              Información/riesgo: 50/50. Disciplina: 100 menos sobrecostos
              relativos ×150 y deuda relativa ×15. Plazo: −4 por mes fuera de
              plazo. Legitimidad: 60 % apoyo +40 % reputación, con −20 por
              instrumento que no corresponde a la falla.
            </p>
            <p>
              Sostenibilidad: 50 + impacto ODS promedio observado ×20 −8 por ODS
              ajeno; alineación respaldada por cadena e indicador +8,
              incoherente −15. Cada dimensión se limita a 0–100.
            </p>
          </div>
        )}
        <div className="concept-tags">
          {[
            "Costo de oportunidad",
            "Información imperfecta",
            "MGA",
            "VPN y TIR",
            "Externalidades",
            "Riesgo residual",
            "Equidad",
            "Incentivos",
          ].map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
      </Panel>
      <Panel title="Contribuciones y tensiones ODS">
        <div className="ods-results">
          {s.sdgs.map((id) => {
            const v = sdgImpact(g, id);
            return (
              <div key={id}>
                <span>
                  ODS {id} · {sdgs[id - 1].name}
                </span>
                <strong>
                  {v > 0 ? "+" : ""}
                  {clamp(v, -2, 2).toFixed(1)}
                </strong>
              </div>
            );
          })}
        </div>
        <p className="muted">
          Impacto potencial ponderado por desempeño, cobertura y coherencia
          causal. Una mala ejecución reduce la contribución.
        </p>
      </Panel>
      <Panel title="La historia de tus decisiones" kicker={g.seed}>
        <Journal g={g} />
      </Panel>
    </>
  );
}

import ScoreV2 from './ScoreV2';

import ProjectTrace from "./v22/ProjectTrace";
import InformationCenter from "./InformationCenter";
import ResetStage from "./ResetStage";
import { useState } from "react";
import { phases, type GameState } from "../domain/types";
import {
  selected,
  available,
  projectCost,
  model,
  riskLevel,
  type Action,
} from "../domain/engine";
import { stageStatus } from "../domain/projectV2";
import { scenarioById } from "../data/scenarios";
import { money } from "../domain/finance";
import { Panel, Button, Field } from "../components/ui";
/** Brief stage introductions; "Aprender más" holds the extended explanation. */
const introductions = [
  {
    title: "Diagnosticar una necesidad",
    what: "Construyes el Árbol del problema, ubicas actores y defines la población objetivo.",
    why: "Una causa mal identificada lleva a una solución que no resuelve el problema.",
    decide: "Qué causas y efectos incluir, qué información comprar y cómo relacionarte con cada actor.",
    effect: "Las causas elegidas definen qué alternativas son coherentes; la información reduce riesgos y los actores condicionan la aceptación.",
    more: "El Árbol del problema separa causas directas e indirectas del problema central y de sus efectos. Tratar un síntoma como causa, o la falta de una obra como problema, son errores frecuentes. Los estudios no cambian la realidad: reducen tu incertidumbre sobre ella.",
  },
  {
    title: "Comparar formas de intervenir",
    what: "Defines el objetivo central y eliges una alternativa entre varias factibles.",
    why: "Toda alternativa sacrifica algo: costo, cobertura, rapidez, riesgo o sostenibilidad.",
    decide: "Qué alternativa atiende mejor tus causas con los recursos y el plazo disponibles.",
    effect: "La alternativa alimenta la cadena de valor, el presupuesto y la evaluación. Puedes cambiarla después sin perder el trabajo: las etapas afectadas quedarán para revisión.",
    more: "El costo de oportunidad es el valor de la mejor alternativa factible que sacrificas. No intervenir o una solución optimizada también son alternativas.",
  },
  {
    title: "Construir cómo se producirá el cambio",
    what: "Armas la cadena de valor y construyes el presupuesto y el cronograma.",
    why: "Un proyecto sin cadena coherente gasta sin producir resultados; sin presupuesto realista, no se ejecuta.",
    decide: "Qué tarjetas usar, cuánto asignar a cada categoría, cuánta contingencia reservar.",
    effect: "El presupuesto define la caja comprometida; mantenimiento y operación afectan la confiabilidad; la contingencia absorbe eventos.",
    more: "Insumos → actividades → productos → resultados → impactos. Un contrato firmado es un hito de gestión, no un producto; ejecutar el presupuesto no es un resultado.",
  },
  {
    title: "Evaluar antes de comprometer",
    what: "Revisas flujos, indicadores, escenarios y sensibilidad con tus propias decisiones.",
    why: "Es la última oportunidad de corregir antes de que el dinero quede comprometido.",
    decide: "Si los supuestos son razonables y si el proyecto merece los recursos frente a sus alternativas.",
    effect: "La evaluación se congela al invertir y se compara después con lo observado.",
    more: "La evaluación ex ante estima costos y beneficios futuros antes de ejecutar. La financiera mide caja; la social mide bienestar. Un VPN social positivo no paga las cuentas.",
  },
  {
    title: "Examinar incentivos y sostenibilidad",
    what: "Diagnosticas la falla de mercado, eliges un instrumento (o no intervenir) y sustentas los ODS.",
    why: "Una regla cambia comportamientos: puede corregir una falla o crear otra.",
    decide: "Si existe una falla suficiente, qué instrumento es proporcional y qué ODS puedes sostener con evidencia.",
    effect: "Un instrumento desproporcionado genera fallo regulatorio al invertir; seleccionar ODS sin relación resta puntos.",
    more: "Regular tiene costos administrativos, de cumplimiento y riesgos de captura o barreras. No intervenir es correcto cuando la falla es leve frente a esos costos.",
  },
  {
    title: "Asumir compromisos",
    what: "Revisas dependencias pendientes, riesgos y compromisos, y decides invertir.",
    why: "Al invertir se congelan el plan y la evaluación ex ante.",
    decide: "Si el proyecto está listo o necesita más revisión, financiación o mitigación.",
    effect: "Las consecuencias diferidas de tus decisiones anteriores aparecen en este momento.",
    more: "Explica los sacrificios aceptados: la justificación se conserva para discutirla al final.",
  },
  {
    title: "Gestionar la ejecución",
    what: "Avanzas la obra y respondes a eventos.",
    why: "La realidad se revela durante la ejecución y exige adaptarse.",
    decide: "Cómo responder a cada evento: continuar, mitigar, redimensionar, aplazar o renegociar.",
    effect: "Cada respuesta consume reservas, tiempo o alcance y cambia el servicio final.",
    more: "La contingencia se usa antes que la caja libre. La exposición a eventos depende de tus estudios, actores, mitigaciones y regulación.",
  },
  {
    title: "Explicar los resultados",
    what: "Comparas lo esperado con lo observado y con las alternativas factibles.",
    why: "Distinguir calidad de la decisión y suerte es la base para mejorar.",
    decide: "Qué harías distinto; puedes explorar otra estrategia con las mismas condiciones.",
    effect: "La nota combina proceso, resultado, coherencia y eficiencia.",
    more: "Una buena decisión puede tener un mal resultado por eventos externos, y al revés. La comparación contrafactual usa la misma semilla.",
  },
];
export function ProjectMap({
  g,
  send,
}: {
  g: GameState;
  send: (a: Action) => void;
}) {
  if (!g.v2) return null;
  return (
    <section className="project-map">
      <strong>{introductions[g.phase].title}</strong>
      <dl className="stage-intro">
        <dt>Qué vas a hacer</dt>
        <dd>{introductions[g.phase].what}</dd>
        <dt>Por qué importa</dt>
        <dd>{introductions[g.phase].why}</dd>
        <dt>Qué debes decidir</dt>
        <dd>{introductions[g.phase].decide}</dd>
        <dt>Cómo afecta el proyecto</dt>
        <dd>{introductions[g.phase].effect}</dd>
      </dl>
      <details>
        <summary>Aprender más</summary>
        <p>{introductions[g.phase].more}</p>
      </details>
      <nav aria-label="Mapa del proyecto">
        {phases.map((name, i) => (
          <button
            key={name}
            disabled={
              i > g.maxPhase || !!g.snapshot || !!g.outcome || i === g.phase
            }
            onClick={() => send({ type: "visit", phase: i })}
            className={g.v2!.reviews[i]?.length ? "needs-review" : ""}
          >
            <b>
              {i + 1} · {name}
            </b>
            <small>{stageStatus(g, i)}</small>
          </button>
        ))}
      </nav>
      {!!g.v2.reviews[g.phase]?.length && (
        <div role="status" className="review-notice">
          <strong>Requiere revisión · el trabajo se conserva</strong>
          {g.v2.reviews[g.phase].map((r) => (
            <p key={r}>{r}</p>
          ))}
          <p>
            Comprueba esta etapa y pulsa Guardar y avanzar para confirmar la
            revisión.
          </p>
        </div>
      )}
      <details>
        <summary>Cómo corregir sin perder trabajo</summary>
        <p>
          Visitar una etapa desbloqueada no cuesta recursos. Confirmar un cambio
          en una etapa completada cuesta un mes y 0,2 % del presupuesto base.
          Los estudios y negociaciones conservan sus costos propios. Antes de
          invertir debes confirmar las revisiones pendientes. Durante ejecución,
          usa las respuestas de adaptación.
        </p>
      </details>
      <ResetStage key={g.phase} g={g} send={send} />
    </section>
  );
}
export function CommandCenter({
  g,
  send,
}: {
  g: GameState;
  send: (a: Action) => void;
}) {
  const [planned, setPlanned] = useState(g.v2?.planner ?? 0);
  if (!g.v2) return null;
  const a = selected(g),
    s = scenarioById(g.scenarioId),
    m = a ? model(g) : null;
  return (
    <>
      <Panel title="Alternativa en estudio">
        <h4>{a?.name ?? "Aún por decidir"}</h4>
        <p>{a?.description ?? "Compara opciones en Formulación."}</p>
        {a && (
          <>
            <dl className="alt-detail">
              <dt>Inversión técnica</dt>
              <dd>$ {money((a.capex * g.target) / s.affected)}</dd>
              <dt>Operación anual</dt>
              <dd>$ {money((a.opex * g.target) / s.affected)}</dd>
              <dt>Duración de obra</dt>
              <dd>{a.months} meses de {Math.max(0, s.deadline - g.month)} disponibles</dd>
              <dt>Población objetivo</dt>
              <dd>{g.target.toLocaleString("es-CO")} de {s.affected.toLocaleString("es-CO")} afectadas</dd>
              <dt>Beneficio social anual</dt>
              <dd>$ {money((a.social * g.target) / s.affected)} · cobertura potencial {(a.coverage * 100).toFixed(0)} %</dd>
              <dt>Riesgos</dt>
              <dd>Riesgo técnico {a.risk}/100 · complejidad {a.complexity}/100 · ambiental {a.environment > 0 ? "+" : ""}{a.environment}</dd>
              <dt>Restricciones</dt>
              <dd>Aceptación {a.acceptance}/100 · flexibilidad {a.flexibility}/100</dd>
            </dl>
            <p>{a.tradeoff}</p>
            <div className="live-vars" aria-label="Variables vivas del proyecto">
              {[
                ["Cobertura prevista", ((m?.coverage ?? 0) * 100).toFixed(0) + " %"],
                ["Aceptación social", g.support + "/100"],
                ["Riesgo", riskLevel(g).toFixed(0) + "/100"],
                ["Viabilidad financiera", available(g) - (g.snapshot ? 0 : projectCost(g)) >= 0 ? "Financiable" : "Déficit $ " + money(projectCost(g) - available(g))],
                ["Impacto esperado (VPN social)", "$ " + money(m!.social.npv)],
                ["Sostenibilidad", Math.round(g.sustainability) + "/100"],
                ["Exposición sistémica", ((g.v2?.eventRisk ?? 0) >= 0 ? "+" : "") + Math.round((g.v2?.eventRisk ?? 0) * 100) + " %"],
              ].map(([k, v]) => (
                <div key={k}>
                  <small>{k}</small>
                  <strong>{v}</strong>
                </div>
              ))}
            </div>
            <p className="muted">El VPN social no es caja disponible.</p>
            {Object.entries(g.v2.reviews).some(([, r]) => r.length) && (
              <p className="review-inline">
                Etapas que requieren revisión:{" "}
                {Object.entries(g.v2.reviews)
                  .filter(([, r]) => r.length)
                  .map(([p]) => phases[Number(p)])
                  .join(", ")}
              </p>
            )}
            <Button
              secondary
              disabled={!!g.snapshot || !!g.outcome}
              onClick={() => send({ type: "visit", phase: 1 })}
            >
              Cambiar alternativa
            </Button>
          </>
        )}
      </Panel>
      <details className="command-tool">
        <summary>Planificar recursos</summary>
        <p>
          Simula una necesidad adicional. Planear no compromete ni gasta dinero.
        </p>
        <dl>
          <dt>Disponible libre</dt>
          <dd>{money(available(g))}</dd>
          <dt>Propuesta formal</dt>
          <dd>{money(a ? projectCost(g) : 0)}</dd>
          <dt>Comprometido</dt>
          <dd>{money(g.committed)}</dd>
          <dt>Utilizado</dt>
          <dd>{money(g.spent)}</dd>
          <dt>Reserva dentro del plan</dt>
          <dd>{money(g.budget.contingency)}</dd>
        </dl>
        <Field label="Necesidad adicional planeada · M COP">
          <input
            type="number"
            min="0"
            value={planned}
            onChange={(e) => setPlanned(Number(e.target.value))}
          />
        </Field>
        <p>
          Margen previsto:{" "}
          {money(
            available(g) - (g.snapshot ? 0 : a ? projectCost(g) : 0) - planned,
          )}
          .
        </p>
        <Button
          secondary
          disabled={!!g.outcome}
          onClick={() => send({ type: "planner", value: planned })}
        >
          Guardar planificación
        </Button>
      </details>
      <ProjectTrace g={g} />
      <InformationCenter g={g} send={send} />
    </>
  );
}

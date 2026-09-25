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
const introductions = [
  [
    "Diagnosticar una necesidad",
    "Elige evidencia, causas, actores y población. La focalización y la información afectan costos, cobertura y exposición.",
  ],
  [
    "Comparar formas de intervenir",
    "Selecciona un objetivo y contrasta alternativas con las mismas restricciones. La elección alimenta cadena, presupuesto y evaluación.",
  ],
  [
    "Construir cómo se producirá el cambio",
    "Organiza la cadena de valor y asigna recursos. Menos mantenimiento libera caja pero reduce confiabilidad.",
  ],
  [
    "Evaluar antes de comprometer",
    "Compara costos y beneficios futuros para decidir si el proyecto merece los recursos. Prueba supuestos antes de ejecutarlo.",
  ],
  [
    "Examinar incentivos y sostenibilidad",
    "Diagnostica la falla, compara no intervenir y sustenta los ODS. Las políticas cambian costos, acceso y bienestar.",
  ],
  [
    "Asumir compromisos",
    "Revisa dependencias y explica los sacrificios aceptados. La inversión congela el plan; luego se adapta con respuestas de ejecución.",
  ],
  [
    "Gestionar la ejecución",
    "Observa avance y eventos. Las respuestas consumen reservas, tiempo o alcance y dejan consecuencias en el servicio.",
  ],
  [
    "Explicar los resultados",
    "Contrasta expectativas, evidencia y alternativas factibles. Distingue calidad del proceso y desempeño observado.",
  ],
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
      <strong>{introductions[g.phase][0]}</strong>
      <p>{introductions[g.phase][1]}</p>
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
            <p>
              Inversión técnica de referencia:{" "}
              {money((a.capex * g.target) / s.affected)}. Población objetivo:{" "}
              {g.target.toLocaleString("es-CO")}.
            </p>
            <p>{a.tradeoff}</p>
            <p>
              Cobertura prevista: {((m?.coverage ?? 0) * 100).toFixed(0)} % ·
              Riesgo: {riskLevel(g).toFixed(0)}/100.
            </p>
            <p>
              VPN social previsto: {money(m!.social.npv)}. No es caja
              disponible.
            </p>
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
      <details className="command-tool">
        <summary>Centro de información</summary>
        <p>{s.brief}</p>
        <ul>
          {s.constraints.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <p>
          Población afectada: {s.affected.toLocaleString("es-CO")}. Demanda
          preliminar: {s.demand.toLocaleString("es-CO")} {s.unit}. Oferta:{" "}
          {s.supply.toLocaleString("es-CO")}.
        </p>
        {s.studies.map((st) => (
          <p key={st.id}>
            <strong>{st.name}</strong>:{" "}
            {g.studies.includes(st.id)
              ? st.finding
              : `Disponible por ${money(st.cost)} y ${st.months} meses en Diagnóstico.`}
          </p>
        ))}
        <Button
          secondary
          disabled={!!g.snapshot || !!g.outcome}
          onClick={() => send({ type: "visit", phase: 0 })}
        >
          Ir a estudios y actores
        </Button>
        <p>
          Datos simulados. Consulta las referencias MGA en la ayuda de
          aprendizaje.
        </p>
      </details>
    </>
  );
}

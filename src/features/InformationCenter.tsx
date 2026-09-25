import { useState } from "react";
import type { GameState } from "../domain/types";
import type { Action } from "../domain/engine";
import { available } from "../domain/engine";
import { scenarioById } from "../data/scenarios";
import { money } from "../domain/finance";
import { Button } from "../components/ui";
import { regulatoryDiagnosis } from "../domain/regulationLab";

/** What each study makes less uncertain. Shown before buying so the player can weigh the value of information. */
const studyValue: Record<string, string> = {
  demand:
    "Precisa la demanda esperada: reduce el error de cobertura e ingresos y la severidad estimada de la falla de mercado.",
  technical:
    "Precisa la inversión técnica: reduce la sorpresa de costos al iniciar la ejecución y el riesgo técnico.",
  environment:
    "Anticipa permisos y externalidades: reduce la probabilidad de exigencias ambientales durante la ejecución.",
  social:
    "Revela posiciones de actores y barreras de acceso: reduce la exposición social y habilita acuerdos.",
};

export default function InformationCenter({
  g,
  send,
}: {
  g: GameState;
  send: (a: Action) => void;
}) {
  const s = scenarioById(g.scenarioId),
    [confirm, setConfirm] = useState(""),
    open = !g.snapshot && !g.outcome,
    reg = regulatoryDiagnosis(g);
  return (
    <details className="command-tool">
      <summary>Centro de información</summary>
      <p className="muted">
        Algunas fichas son gratuitas. Los estudios consumen presupuesto y
        tiempo: compra información cuando pueda cambiar una decisión.
      </p>
      <h4>Fichas gratuitas</h4>
      <dl>
        <dt>Territorio</dt>
        <dd>{s.territory}</dd>
        <dt>Población total / afectada</dt>
        <dd>
          {s.population.toLocaleString("es-CO")} /{" "}
          {s.affected.toLocaleString("es-CO")}
        </dd>
        <dt>Demanda y oferta preliminares</dt>
        <dd>
          {s.demand.toLocaleString("es-CO")} / {s.supply.toLocaleString("es-CO")}{" "}
          {s.unit}
        </dd>
        <dt>Plazo de la misión</dt>
        <dd>{s.deadline} meses</dd>
        <dt>Costo de referencia de alternativas</dt>
        <dd>
          {money(Math.min(...s.alternatives.map((a) => a.capex)))} –{" "}
          {money(Math.max(...s.alternatives.map((a) => a.capex)))}
        </dd>
        <dt>Estructura del mercado</dt>
        <dd>
          Participaciones: {s.market.join(" / ")} %. {reg.evidence}
        </dd>
      </dl>
      <ul>
        {s.constraints.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <h4>Estudios y consultas</h4>
      {s.studies.map((st) => {
        const bought = g.studies.includes(st.id);
        return (
          <div key={st.id} className="info-item">
            <p>
              <strong>{st.name}</strong>{" "}
              {bought ? (
                <span className="badge">Disponible</span>
              ) : (
                <small>
                  {money(st.cost)} · {st.months} meses
                </small>
              )}
            </p>
            <p className="muted">
              {bought ? st.finding : studyValue[st.reveals]}
            </p>
            {!bought &&
              open &&
              (confirm === st.id ? (
                <div className="actions">
                  <Button secondary onClick={() => setConfirm("")}>
                    Cancelar
                  </Button>
                  <Button
                    disabled={st.cost > available(g)}
                    onClick={() => {
                      send({ type: "study", id: st.id });
                      setConfirm("");
                    }}
                  >
                    Pagar {money(st.cost)} y {st.months} meses
                  </Button>
                </div>
              ) : (
                <Button secondary onClick={() => setConfirm(st.id)}>
                  Contratar
                </Button>
              ))}
          </div>
        );
      })}
      {g.v2 && g.phase > 0 && open && (
        <p className="muted">
          La nueva información puede marcar etapas completadas para revisión:
          el trabajo se conserva, pero debes confirmar que sigue siendo
          coherente.
        </p>
      )}
      <p className="muted">
        Datos simulados de un territorio ficticio. No son estadísticas
        oficiales.
      </p>
    </details>
  );
}

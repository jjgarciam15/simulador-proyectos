import { useState } from "react";
import type { GameState } from "../../domain/types";
import type { Action } from "../../domain/engine";
import { valuationDecisionTree, valuationMethods, type MethodId } from "../../data/valuationMethods";
import {
  coveredPeople,
  fitLabel,
  measurement,
  methodOptions,
  studyCost,
  studyMonths,
  valuableCards,
  valuationCharge,
  valuationSummary,
  type Study,
  type ValuationChoice,
} from "../../domain/valuation";
import { scenarioById } from "../../data/scenarios";
import { helpPolicy } from "../../domain/help";
import { fmtMoney, fmtQty, fmtUnitMoney } from "../../domain/format";
import { Panel, Button } from "../../components/ui";
import { useDraftGuard, different } from "../../components/workbench";
import { Deferred, ModuleIntro, Status } from "./common";
import ChoiceExperiment from "./ChoiceExperiment";

export function MethodLibrary() {
  return (
    <details className="v22-library">
      <summary>Biblioteca de metodologías de valoración</summary>
      <p className="muted">
        Clasificación según la Guía de valoración económica ambiental de MinAmbiente (Res. 1084 de 2018). Esa guía ubica los métodos de costos evitados y
        de gastos dentro de las preferencias reveladas; aquí se muestran como familias propias para distinguir su lógica. La transferencia de beneficios no es
        un método de valoración en sí mismo.
      </p>
      <div className="v22-library-grid">
        {valuationMethods.map((m) => (
          <article key={m.id}>
            <span className="badge">{m.family}</span>
            <h4>{m.name}</h4>
            <dl>
              <dt>Qué hace</dt>
              <dd>{m.what}</dd>
              <dt>Qué información necesita</dt>
              <dd>{m.needs}</dd>
              <dt>Cuándo usar</dt>
              <dd>{m.when}</dd>
              <dt>Cuándo no usar</dt>
              <dd>{m.whenNot}</dd>
              <dt>Ejemplo</dt>
              <dd>{m.example}</dd>
              <dt>Limitaciones</dt>
              <dd>{m.limitations}</dd>
            </dl>
          </article>
        ))}
      </div>
      <ChoiceExperiment />
    </details>
  );
}
export function DecisionTree() {
  return (
    <details className="v22-tree">
      <summary>Árbol de decisión para elegir una metodología (guía, no regla)</summary>
      <ol>
        {valuationDecisionTree.map((q) => (
          <li key={q.question}>
            <strong>{q.question}</strong>
            <span>Sí → {q.yes}</span>
            <span>No → {q.no}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}

/** Valoración económica de impactos: medir → elegir método → valor unitario → unidades → beneficio anual. */
export default function ValuationLab({ g, send }: { g: GameState; send: (a: Action) => void }) {
  const s = scenarioById(g.scenarioId),
    help = helpPolicy(g),
    cards = valuableCards(g),
    placed = g.v2!.v22!.impacts?.placements ?? [],
    classified = cards.filter((c) => placed.some((p) => p.id === c.id && (p.kind === "impactoPositivo" || p.kind === "impactoNegativo"))),
    saved = g.v2!.v22!.valuation?.choices ?? [],
    [choices, setChoices] = useState<ValuationChoice[]>(saved),
    covered = coveredPeople(g);
  useDraftGuard(different(choices, saved));
  const choiceOf = (id: string) => choices.find((c) => c.impactId === id);
  const update = (id: string, patch: Partial<ValuationChoice>) => {
    const prior = choiceOf(id) ?? { impactId: id, method: "" as MethodId, study: "basico" as Study, quantity: 0 };
    setChoices([...choices.filter((c) => c.impactId !== id), { ...prior, ...patch }]);
  };
  const ready = choices.filter((c) => c.method),
    charge = valuationCharge(g, ready),
    summary = valuationSummary(g);
  return (
    <Panel title="Valoración económica de impactos" kicker="MEDIR ≠ VALORAR">
      <ModuleIntro
        concepts={["valoracion", "reveladas", "declaradas"]}
        what="Algunos impactos tienen precio de mercado, otros tienen mercados relacionados y otros no tienen mercado."
        why="Para comparar beneficios y costos en el flujo económico, los impactos deben expresarse en pesos de forma defendible."
        decide="Para cada impacto: cuánto cambia (medición), con qué método valorarlo y cuánto invertir en el estudio."
        next="Flujo económico, comparación de alternativas, comité evaluador y puntuación."
      />
      <p className="muted">
        Primero se mide: «se ahorran 45 horas por persona al año» es una medición. Convertirla en pesos es otra etapa que requiere un método.
      </p>
      <DecisionTree />
      <MethodLibrary />
      {!classified.length && <p className="notice">Clasifica los impactos en Preparación para poder valorarlos.</p>}
      {classified.map((card) => {
        const c = choiceOf(card.id),
          m = measurement(g, card),
          on = !!c,
          result = summary.rows.find((r) => r.card.id === card.id)?.result;
        return (
          <article key={card.id} className="v22-impact">
            <header>
              <label className="checkline">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => (e.target.checked ? update(card.id, {}) : setChoices(choices.filter((x) => x.impactId !== card.id)))}
                />
                <strong>{card.text}</strong>
              </label>
              <span className="badge">{card.kind === "impactoNegativo" ? "Impacto negativo" : "Impacto positivo"}</span>
            </header>
            <p className="muted">Información del caso: {card.valuation!.data}</p>
            {on && (
              <>
                <div className="v22-measure">
                  <span className="v22-given">Personas cubiertas: {covered.toLocaleString("es-CO")}</span>
                  <span className="v22-given">
                    Cantidad por persona al año: {fmtQty(m.perCovered)} {m.unit}
                  </span>
                  <label className="v22-compute">
                    1. Medición anual ({m.unit}){help.guidedHints && " = personas × cantidad por persona"}
                    <input type="number" min={0} value={c!.quantity ? Math.round(c!.quantity * 100) / 100 : ""} onChange={(e) => update(card.id, { quantity: Number(e.target.value) })} />
                  </label>
                </div>
                <fieldset className="v22-choice methods">
                  <legend>2. Metodología de valoración</legend>
                  {methodOptions(g, card).map((method) => (
                    <label key={method.id} className={c!.method === method.id ? "chosen" : ""}>
                      <input type="radio" name={"m" + card.id} checked={c!.method === method.id} onChange={() => update(card.id, { method: method.id })} />
                      <span>
                        {method.name}
                        <small>{method.family}</small>
                      </span>
                    </label>
                  ))}
                </fieldset>
                <fieldset className="v22-choice study">
                  <legend>3. Calidad del estudio</legend>
                  {(["basico", "completo"] as Study[]).map((st) => (
                    <label key={st} className={c!.study === st ? "chosen" : ""}>
                      <input type="radio" name={"s" + card.id} checked={c!.study === st} onChange={() => update(card.id, { study: st })} />
                      {st === "basico" ? "Estudio básico" : "Estudio completo"} · {fmtMoney(s.budget * studyCost[st])} · {studyMonths[st]} mes(es)
                      <small>{st === "basico" ? "Menor confianza; datos secundarios." : "Mayor confianza; trabajo de campo."}</small>
                    </label>
                  ))}
                </fieldset>
              </>
            )}
            {result &&
              saved.some((x) => x.impactId === card.id) &&
              (help.immediate ? (
                <div className="v22-result">
                  <p>
                    {fmtQty(result.quantity)} {result.unit} × {fmtUnitMoney(result.unitValue)} por unidad = <strong>{fmtMoney(result.annual)} al año</strong> · rango{" "}
                    {fmtMoney(result.low)} a {fmtMoney(result.high)} · confianza {result.confidence}
                  </p>
                  <ul className="findings">
                    <Status level={result.fit === "optima" ? "ok" : result.fit === "inadecuada" ? "grave" : "alerta"}>
                      Metodología {fitLabel[result.fit].toLowerCase()}. {help.detail === "full" ? result.feedback : ""}
                    </Status>
                    {!result.quantityOk && <Status level="grave">La medición no coincide con los datos: revisa personas × cantidad por persona.</Status>}
                  </ul>
                </div>
              ) : (
                <p className="muted">Valor registrado con confianza {result.confidence}.</p>
              ))}
          </article>
        );
      })}
      <p className="muted">
        Estudios nuevos a pagar: {fmtMoney(charge.cost)} y {charge.months} mes(es). Un estudio ya pagado no se cobra de nuevo.
      </p>
      <Button disabled={!ready.length || ready.length !== choices.length} onClick={() => send({ type: "valuation", choices: ready })}>
        Confirmar valoración
      </Button>
      {saved.length > 0 &&
        (help.immediate ? (
          <ul className="findings">
            <Status level={summary.score >= 75 ? "ok" : summary.score >= 50 ? "alerta" : "grave"}>Valoración: {summary.score}/100.</Status>
            {summary.overlaps.map((r) => (
              <Status key={r.card.id} level="grave">
                Posible doble conteo: «{r.card.text}» capitaliza beneficios que ya valoraste.
              </Status>
            ))}
            {summary.missingNegative.map((c) => (
              <Status key={c.id} level="grave">
                Falta valorar el impacto negativo «{c.text}»: los costos para terceros también cuentan.
              </Status>
            ))}
            {help.detail !== "score" &&
              summary.missingPositive.map((c) => (
                <Status key={c.id} level="alerta">
                  Impacto sin valorar: «{c.text}».
                </Status>
              ))}
          </ul>
        ) : (
          <Deferred />
        ))}
    </Panel>
  );
}

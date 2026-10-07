import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { GameState } from "../../domain/types";
import type { Action } from "../../domain/engine";
import { scenarioById } from "../../data/scenarios";
import { generalObjectiveOptions, objectivesScore, specificObjectiveOptions } from "../../domain/valuation";
import { helpPolicy } from "../../domain/help";
import { Panel, Button } from "../../components/ui";
import { useDraftGuard, different } from "../../components/workbench";
import { Deferred, ModuleIntro, Status } from "./common";
import { fb, FeedbackLegend, type FeedbackLevel } from "../../components/feedback";

/** Objetivo general y objetivos específicos, conectados con el Árbol del problema. */
export default function ObjectivesBuilder({ g, send }: { g: GameState; send: (a: Action) => void }) {
  const s = scenarioById(g.scenarioId),
    saved = g.v2!.v22!.objectives,
    [general, setGeneral] = useState(saved?.general ?? ""),
    [specific, setSpecific] = useState<string[]>(saved?.specific ?? []),
    help = helpPolicy(g),
    generalOptions = generalObjectiveOptions(g),
    specificOptions = specificObjectiveOptions(g);
  useDraftGuard(general !== (saved?.general ?? "") || different(specific, saved?.specific ?? []));
  const toggle = (id: string) => setSpecific(specific.includes(id) ? specific.filter((x) => x !== id) : [...specific, id]);
  const marks = !!saved && help.immediate && help.detail !== "score",
    why = (o: { why: string }) => (help.detail === "full" ? ` ${o.why}` : "");
  /** Color and hover text of each option while the choice stays as it was confirmed. */
  function feedbackOf(o: { id: string; valid: boolean; why: string }, kind: "general" | "specific"): { level: FeedbackLevel; text: string } | null {
    if (!marks) return null;
    const was = kind === "general" ? saved!.general === o.id : saved!.specific.includes(o.id),
      is = kind === "general" ? general === o.id : specific.includes(o.id);
    if (was !== is) return null;
    if (was) return o.valid ? { level: "ok", text: `Bien elegido.${why(o)}` } : { level: "grave", text: `No corresponde.${why(o)}` };
    // Missing specific objectives are pointed out only with full feedback (as the list does).
    return kind === "specific" && o.valid && help.detail === "full" ? { level: "alerta", text: `Faltó seleccionarlo.${why(o)}` } : null;
  }
  const levels = [...generalOptions.map((o) => feedbackOf(o, "general")), ...specificOptions.map((o) => feedbackOf(o, "specific"))]
      .map((f) => f?.level)
      .filter((x): x is FeedbackLevel => !!x),
    count = (k: FeedbackLevel) => levels.filter((x) => x === k).length;
  return (
    <Panel title="Del problema a los objetivos" kicker="OBJETIVOS · GENERAL Y ESPECÍFICOS">
      <ModuleIntro
        concepts={["objetivos", "arbol"]}
        what="Cada situación negativa del Árbol del problema puede transformarse en una situación deseada."
        why="Los objetivos definen qué cambio persigues: la alternativa, la cadena de valor y los indicadores deben responder a ellos."
        decide="Un objetivo general (el cambio central) y los objetivos específicos (los medios para lograrlo)."
        next="Alternativas, cadena de valor, trazabilidad y puntuación."
      />
      <div className="v22-transform" aria-label="Situación negativa, transformación y situación deseada">
        {s.nodes
          .filter((n) => g.nodes.includes(n.id))
          .map((n) => (
            <div key={n.id}>
              <span className="neg">{n.label}</span>
              <ArrowRight size={16} aria-hidden />
              <span className="pos">{n.objective}</span>
            </div>
          ))}
      </div>
      <fieldset className="v22-choice">
        <legend>Objetivo general · elige uno</legend>
        {generalOptions.map((o) => (
          <label key={o.id} className={general === o.id ? "chosen" : ""} {...fb(feedbackOf(o, "general")?.level, feedbackOf(o, "general")?.text ?? "")}>
            <input type="radio" name="general" checked={general === o.id} onChange={() => setGeneral(o.id)} />
            {o.text}
          </label>
        ))}
      </fieldset>
      <fieldset className="v22-choice">
        <legend>Objetivos específicos · selecciona los que correspondan</legend>
        {specificOptions.map((o) => (
          <label
            key={o.id}
            className={specific.includes(o.id) ? "chosen" : ""}
            {...fb(feedbackOf(o, "specific")?.level, feedbackOf(o, "specific")?.text ?? "")}
          >
            <input type="checkbox" checked={specific.includes(o.id)} onChange={() => toggle(o.id)} />
            {o.text}
          </label>
        ))}
      </fieldset>
      <Button disabled={!general || !specific.length} onClick={() => send({ type: "objectives", general, specific })}>
        Confirmar objetivos
      </Button>
      {saved &&
        (help.immediate ? (
          <div className="chain-feedback" role="status">
            <p>
              <strong>Coherencia de objetivos: {objectivesScore(g).toFixed(0)}/100.</strong>
            </p>
            {marks && <FeedbackLegend counts={{ ok: count("ok"), alerta: count("alerta"), grave: count("grave") }} />}
            {help.detail !== "score" && (
              <details className="fb-details">
                <summary>Ver la retroalimentación en lista</summary>
                <ul className="findings">
                  {[...generalOptions.filter((o) => o.id === saved.general), ...specificOptions.filter((o) => saved.specific.includes(o.id))].map((o) => (
                    <Status key={o.id} level={o.valid ? "ok" : "grave"}>
                      {o.text}
                      {help.detail === "full" && <> — {o.why}</>}
                    </Status>
                  ))}
                  {specificOptions
                    .filter((o) => o.valid && !saved.specific.includes(o.id))
                    .map((o) => (
                      <Status key={o.id} level="alerta">
                        Falta un objetivo específico{help.detail === "full" ? `: «${o.text}» — ${o.why}` : "."}
                      </Status>
                    ))}
                </ul>
              </details>
            )}
          </div>
        ) : (
          <Deferred />
        ))}
    </Panel>
  );
}

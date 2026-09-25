import type { GameState } from "../../domain/types";
import { traceability } from "../../domain/traceability";
import { helpPolicy } from "../../domain/help";
import { scenarioById } from "../../data/scenarios";

/**
 * Mapa del proyecto: built progressively as the game advances (never shows unreached steps as done).
 * The coherence indicator is detailed while learning, level-only in hard mode and hidden in exam mode.
 */
export default function ProjectTrace({ g }: { g: GameState }) {
  const v = g.v2?.v22;
  if (!v) return null;
  const s = scenarioById(g.scenarioId),
    a = s.alternatives.find((x) => x.id === g.alternative),
    t = traceability(g),
    help = helpPolicy(g);
  const steps: [string, string | null][] = [
    ["Problema", s.nodes[0].label],
    ["Objetivo", v.objectives ? s.nodes.find((n) => n.id === v.objectives!.general)?.objective ?? null : null],
    ["Alternativa", a?.name ?? null],
    ["Cadena de valor", g.v2!.chain.length ? `${g.v2!.chain.length} tarjetas` : null],
    ["Efectos", v.impacts ? `${v.impacts.placements.filter((p) => p.kind === "efecto").length} efectos` : null],
    ["Impactos", v.impacts ? `${v.impacts.placements.filter((p) => p.kind.startsWith("impacto")).length} impactos` : null],
    ["Valoración", v.valuation ? `${v.valuation.choices.length} valorados` : null],
    ["Flujos", v.flow ? (v.economic ? "Financiero y económico" : "Financiero") : null],
    ["Evaluación", g.acknowledged.includes("evaluation") || g.snapshot ? "Confirmada" : null],
    ["Decisión", g.snapshot ? "Inversión comprometida" : null],
  ];
  const reached = steps.findIndex(([, x]) => !x);
  return (
    <details className="command-tool v22-map" open>
      <summary>Mapa del proyecto</summary>
      <ol>
        {steps.map(([label, value], i) => (
          <li key={label} className={value ? "done" : i === reached ? "current" : "todo"}>
            <b>{value ? "✓" : i === reached ? "→" : "·"}</b> {label}
            {value && <small>{value}</small>}
          </li>
        ))}
      </ol>
      {help.coherenceIndicator !== "oculto" && (
        <p className={"v22-level " + t.level.toLowerCase()}>
          Coherencia del proyecto: <strong>{t.level}</strong>
          {help.coherenceIndicator === "detalle" && t.gaps.length > 0 && <small> · {t.gaps.length} punto(s) por revisar</small>}
        </p>
      )}
      {help.coherenceIndicator === "detalle" && t.gaps.length > 0 && (
        <ul>
          {t.gaps.slice(0, 4).map((gap) => (
            <li key={gap.code + gap.message}>
              <small>{gap.message}</small>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}

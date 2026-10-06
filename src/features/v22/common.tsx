import type { ReactNode } from "react";
import { AlertTriangle, BookOpen, CheckCircle2, Info, XCircle } from "lucide-react";
import { conceptById } from "../../data/concepts";

/** Status line that never relies on color alone: icon + label + text. */
export function Status({ level, children }: { level: "ok" | "alerta" | "grave" | "info"; children: ReactNode }) {
  const Icon = level === "ok" ? CheckCircle2 : level === "grave" ? XCircle : level === "alerta" ? AlertTriangle : Info;
  const label = level === "ok" ? "Correcto" : level === "grave" ? "Error" : level === "alerta" ? "Revisar" : "Nota";
  return (
    <li className={"v22-status " + level}>
      <Icon size={16} aria-hidden />
      <span className="v22-status-label">{label}:</span> <span>{children}</span>
    </li>
  );
}
/** Deferred feedback notice used in exam mode. */
export function Deferred() {
  return (
    <p className="v22-deferred">
      <Info size={15} aria-hidden /> Modo evaluación: tu respuesta quedó registrada. La retroalimentación completa aparece al final.
    </p>
  );
}
/** Short structured intro for a V2.2 module: context → information → decision → consequence. */
export function ModuleIntro({ what, why, decide, next, concepts = [] }: { what: string; why: string; decide: string; next: string; concepts?: string[] }) {
  return (
    <>
    <dl className="v22-intro">
      <dt>Contexto</dt>
      <dd>{what}</dd>
      <dt>Por qué importa</dt>
      <dd>{why}</dd>
      <dt>Qué decides</dt>
      <dd>{decide}</dd>
      <dt>Se conecta con</dt>
      <dd>{next}</dd>
    </dl>
    <ConceptLinks ids={concepts} />
    </>
  );
}
/**
 * Tutor on demand: links that open the Learning Center on the concept a tool uses.
 * Reading a concept never changes the game or its score.
 */
export function ConceptLinks({ ids }: { ids: string[] }) {
  const items = ids.map((id) => conceptById(id)).filter((c) => !!c);
  if (!items.length) return null;
  return (
    <p className="concept-links">
      <BookOpen size={15} aria-hidden /> <span>¿Dudas? Repasa:</span>
      {items.map((c) => (
        <button key={c.id} type="button" className="text-btn v22-chip" onClick={() => window.dispatchEvent(new CustomEvent("proyecta:learn", { detail: c.id }))}>
          {c.name}
        </button>
      ))}
    </p>
  );
}

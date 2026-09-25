import { useState, type ReactNode } from "react";
import { BookOpen, FileSearch, Lightbulb, Plus, Trash2 } from "lucide-react";
import { conceptById } from "../../data/concepts";
import type { Evidence, NormalizedProject } from "../../domain/project/types";
import type { Issue } from "../../domain/project/validation";

export type Edit = (paths: string[], mutate: (draft: NormalizedProject) => void) => void;
export interface BuilderCtx {
  p: NormalizedProject;
  edit: Edit;
  issues: Issue[];
}
/** Opens the Learning Center without leaving the builder (modal/drawer handled by App). */
export function LearnLink({ concept, children }: { concept: string; children?: ReactNode }) {
  return (
    <button type="button" className="text-btn pb-learn" onClick={() => window.dispatchEvent(new CustomEvent("proyecta:learn", { detail: concept }))}>
      <BookOpen size={14} aria-hidden /> {children ?? "¿Qué es esto?"}
    </button>
  );
}
const confLabel = { alta: "confianza alta", media: "confianza media", baja: "confianza baja" };
/** Where an imported value came from, and whether a person already reviewed it. */
export function EvidenceBadge({ ev }: { ev?: Evidence }) {
  if (!ev) return null;
  const r = ev.ref;
  const where = r ? [r.page ? `pág. ${r.page}` : "", r.sheet ? `hoja «${r.sheet}»` : "", r.cell ? `celda ${r.cell}` : ""].filter(Boolean).join(" · ") : "";
  return (
    <span className={"pb-evidence " + (ev.reviewed ? "reviewed" : ev.confidence)} title={r?.excerpt ?? ""}>
      <FileSearch size={12} aria-hidden /> {where || "archivo importado"} · {ev.reviewed ? "revisado" : confLabel[ev.confidence]}
      {r?.excerpt && <em> «{r.excerpt.slice(0, 60)}»</em>}
    </span>
  );
}
export function IssuesFor({ issues, path, exact = false }: { issues: Issue[]; path: string; exact?: boolean }) {
  const mine = issues.filter((i) => (exact ? i.path === path : i.path === path || i.path.startsWith(path + ".")));
  if (!mine.length) return null;
  return (
    <ul className="pb-issues">
      {mine.map((i) => (
        <li key={i.path + i.message} className={i.level === "error" ? "error" : "warn"}>
          <strong>{i.level === "error" ? "Error:" : "Advertencia:"}</strong> {i.message}
        </li>
      ))}
    </ul>
  );
}
export function TextField({ ctx, path, label, value, set, hint, area = false, placeholder }: { ctx: BuilderCtx; path: string; label: string; value: string; set: (d: NormalizedProject, v: string) => void; hint?: string; area?: boolean; placeholder?: string }) {
  const ev = ctx.p.evidence[path];
  return (
    <label className="field pb-field">
      <span>
        {label} <EvidenceBadge ev={ev} />
      </span>
      {area ? (
        <textarea value={value} placeholder={placeholder ?? (ev || ctx.p.source.type !== "manual" ? "No identificada" : "")} rows={3} onChange={(e) => ctx.edit([path], (d) => set(d, e.target.value))} />
      ) : (
        <input value={value} placeholder={placeholder ?? (ctx.p.source.type !== "manual" ? "No identificada" : "")} onChange={(e) => ctx.edit([path], (d) => set(d, e.target.value))} />
      )}
      {hint && <small>{hint}</small>}
      <IssuesFor issues={ctx.issues} path={path} exact />
    </label>
  );
}
/** Numeric input; `scale` shows a decimal as percent (0.12 → 12). Empty = null (No identificada). */
export function NumField({ ctx, path, label, value, set, unit, scale = 1, hint, min }: { ctx: BuilderCtx; path: string; label: string; value: number | null | undefined; set: (d: NormalizedProject, v: number | null) => void; unit?: string; scale?: number; hint?: string; min?: number }) {
  const ev = ctx.p.evidence[path];
  const shown = value === null || value === undefined ? "" : String(Math.round(value * scale * 1e6) / 1e6);
  return (
    <label className="field pb-field pb-num">
      <span>
        {label} {unit && <small className="pb-unit">({unit})</small>} <EvidenceBadge ev={ev} />
      </span>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        value={shown}
        placeholder={ctx.p.source.type !== "manual" ? "No identificada" : ""}
        onChange={(e) => ctx.edit([path], (d) => set(d, e.target.value === "" ? null : Number(e.target.value) / scale))}
      />
      {hint && <small>{hint}</small>}
      <IssuesFor issues={ctx.issues} path={path} exact />
    </label>
  );
}
/** Editable list of short texts (value chain columns, etc.). */
export function TextList({ label, items, onChange, placeholder }: { label: string; items: string[]; onChange: (items: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    if (!draft.trim()) return;
    onChange([...items, draft.trim()]);
    setDraft("");
  };
  return (
    <div className="pb-list">
      <strong>{label}</strong>
      <ul>
        {items.map((it, i) => (
          <li key={i}>
            <input aria-label={`${label} ${i + 1}`} value={it} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
            <button type="button" className="icon-btn" aria-label={`Quitar ${it}`} onClick={() => onChange(items.filter((_, j) => j !== i))}>
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
      <div className="pb-add">
        <input aria-label={`Nuevo: ${label}`} placeholder={placeholder} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} />
        <button type="button" className="btn secondary" onClick={add}>
          <Plus size={14} /> Agregar
        </button>
      </div>
    </div>
  );
}
export function ConfidenceNote({ p }: { p: NormalizedProject }) {
  if (p.source.type !== "imported_pdf" && p.source.type !== "imported_excel") return null;
  const values = Object.values(p.evidence),
    reviewed = values.filter((e) => e.reviewed).length;
  return (
    <p className="pb-import-note">
      <FileSearch size={15} aria-hidden /> Proyecto importado de <strong>{p.source.fileName}</strong>: {values.length} dato(s) extraído(s), {reviewed} revisado(s). Los campos vacíos muestran «No identificada»: el archivo no los contenía y el
      simulador no los inventa. Al editar un dato queda marcado como revisado.
    </p>
  );
}

/**
 * Example from the Learning Center that can help fill the project. It is never applied automatically:
 * the person reads it and confirms before anything is copied.
 */
export function ExampleBox({ concept, preview, onUse, label }: { concept: string; preview: ReactNode; onUse: () => void; label: string }) {
  const c = conceptById(concept);
  return (
    <details className="pb-example">
      <summary>
        <Lightbulb size={14} aria-hidden /> Ver un ejemplo del Centro de aprendizaje{c ? ` · ${c.name}` : ""}
      </summary>
      {c && <p className="muted">{c.example}</p>}
      <div className="pb-example-preview">{preview}</div>
      <button
        type="button"
        className="btn secondary"
        onClick={() => {
          if (window.confirm(`${label}\n\nEl ejemplo se agregará a tu proyecto y podrás editarlo o borrarlo. ¿Continuar?`)) onUse();
        }}
      >
        Usar este ejemplo como punto de partida
      </button>
    </details>
  );
}

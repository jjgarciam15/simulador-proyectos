import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, Download, Play, XCircle } from "lucide-react";
import type { ActivityOverride, MissionConfig, NormalizedProject } from "../../domain/project/types";
import { touch } from "../../domain/project/project";
import { completeness, reviewProject, validateProject, type BuilderSection } from "../../domain/project/validation";
import { generateActivities, phaseAvailability, type GeneratedActivity } from "../../domain/project/generator";
import { exportProject } from "../../domain/project/schema";
import { fmtMoney } from "../../domain/format";
import { Button } from "../../components/ui";
import { ConfidenceNote, type BuilderCtx, type Edit } from "./fields";
import { ActorsStep, AlternativesStep, ChainStep, ContextStep, FinanceStep, GeneralStep, ImpactsStep, ObjectivesStep, ProblemStep } from "./steps";

type StepId = BuilderSection | "contexto" | "revision" | "actividades";
const baseSteps: { id: StepId; label: string; sections: BuilderSection[] }[] = [
  { id: "general", label: "Información general", sections: ["general"] },
  { id: "problema", label: "Problema, causas y efectos", sections: ["problema"] },
  { id: "actores", label: "Actores y población", sections: ["actores"] },
  { id: "objetivos", label: "Objetivos", sections: ["objetivos"] },
  { id: "alternativas", label: "Alternativas", sections: ["alternativas"] },
  { id: "cadena", label: "Cadena de valor", sections: ["cadena"] },
  { id: "impactos", label: "Efectos, impactos y valoración", sections: ["impactos"] },
  { id: "finanzas", label: "Costos, beneficios y finanzas", sections: ["finanzas"] },
  { id: "contexto", label: "Riesgos, regulación y ODS", sections: ["riesgos", "regulacion", "ods"] },
];
export function download(name: string, content: string | Uint8Array, type: string) {
  const blob = new Blob([content as BlobPart], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const fileSafe = (s: string) => (s || "proyecto").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 60);

export default function ProjectBuilder({ project, onChange, onExit, onGenerate, savedAt }: { project: NormalizedProject; onChange: (p: NormalizedProject) => void; onExit: () => void; onGenerate: (p: NormalizedProject, c: MissionConfig) => string | null; savedAt: string }) {
  const [step, setStep] = useState<StepId>("general");
  const p = project;
  const issues = useMemo(() => validateProject(p), [p]);
  const comp = useMemo(() => completeness(p), [p]);
  const edit: Edit = (paths, mutate) => {
    const d = structuredClone(p);
    mutate(d);
    for (const path of paths) for (const k of Object.keys(d.evidence)) if (k === path || k.startsWith(path + ".")) d.evidence[k].reviewed = true;
    onChange(touch(d));
  };
  const ctx: BuilderCtx = { p, edit, issues };
  const steps = [...baseSteps, ...(p.metadata.profile === "creador" ? [{ id: "actividades" as StepId, label: "Actividades (creador)", sections: [] as BuilderSection[] }] : []), { id: "revision" as StepId, label: "Revisar y crear partida", sections: [] as BuilderSection[] }];
  const index = steps.findIndex((s) => s.id === step);
  const count = (sections: BuilderSection[]) => {
    const mine = issues.filter((i) => sections.includes(i.section));
    return { errors: mine.filter((i) => i.level === "error").length, warnings: mine.filter((i) => i.level === "advertencia").length };
  };
  const progress = [
    { label: "Problema", ok: !!p.problem.trim() && p.causes.length >= 2 && p.problemEffects.length >= 2 },
    { label: "Objetivo", ok: !!p.generalObjective.trim() && p.specificObjectives.length > 0 },
    { label: "Alternativas", ok: p.alternatives.length >= 2 },
    { label: "Proyecto", ok: reviewProject(p).ready },
  ];
  return (
    <div className="pb-shell">
      <aside className="pb-nav" aria-label="Pasos del asistente">
        <button type="button" className="text-btn" onClick={onExit}>
          <ArrowLeft size={15} /> Mis proyectos
        </button>
        <div className="pb-progress" aria-label={`Completitud ${comp.percent} %`}>
          <span>Proyecto</span>
          <div className="pb-bar">
            <i style={{ width: comp.percent + "%" }} />
          </div>
          <strong>{comp.percent} %</strong>
        </div>
        <ol className="pb-path">
          {progress.map((x, i) => (
            <li key={x.label} className={x.ok ? "ok" : ""}>
              {x.ok ? <CheckCircle2 size={14} aria-hidden /> : <span aria-hidden>{i + 1}</span>} {x.label}
            </li>
          ))}
        </ol>
        <ol className="pb-steps">
          {steps.map((s, i) => {
            const c = count(s.sections);
            return (
              <li key={s.id}>
                <button type="button" className={s.id === step ? "on" : ""} aria-current={s.id === step ? "step" : undefined} onClick={() => setStep(s.id)}>
                  <span className="pb-step-n">{i + 1}</span>
                  {s.label}
                  {c.errors > 0 && (
                    <span className="pb-badge error" title="Errores">
                      {c.errors}
                    </span>
                  )}
                  {!c.errors && c.warnings > 0 && (
                    <span className="pb-badge warn" title="Advertencias">
                      {c.warnings}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
        <small className="pb-saved" role="status">
          Guardado automático · {savedAt}
        </small>
      </aside>
      <section className="pb-main panel">
        <div className="eyebrow">
          {p.metadata.profile === "creador" ? "MODO CREADOR / PROFESOR" : "MODO ESTUDIANTE"} · PASO {index + 1} DE {steps.length}
        </div>
        <h2>{steps[index].label}</h2>
        <ConfidenceNote p={p} />
        {step === "general" && (
          <div className="pb-profile" role="radiogroup" aria-label="Perfil">
            {(["estudiante", "creador"] as const).map((prof) => (
              <label key={prof} className={p.metadata.profile === prof ? "on" : ""}>
                <input type="radio" name="perfil" checked={p.metadata.profile === prof} onChange={() => edit([], (d) => (d.metadata.profile = prof))} />
                <strong>{prof === "estudiante" ? "Estudiante" : "Creador / profesor"}</strong>
                <small>{prof === "estudiante" ? "Construyo mi proyecto para analizarlo y ponerlo a prueba." : "Construyo un caso para que otros lo resuelvan: defino respuestas esperadas, distractores y actividades."}</small>
              </label>
            ))}
          </div>
        )}
        {step === "general" && <GeneralStep ctx={ctx} />}
        {step === "problema" && <ProblemStep ctx={ctx} />}
        {step === "actores" && <ActorsStep ctx={ctx} />}
        {step === "objetivos" && <ObjectivesStep ctx={ctx} />}
        {step === "alternativas" && <AlternativesStep ctx={ctx} />}
        {step === "cadena" && <ChainStep ctx={ctx} />}
        {step === "impactos" && <ImpactsStep ctx={ctx} />}
        {step === "finanzas" && <FinanceStep ctx={ctx} />}
        {step === "contexto" && <ContextStep ctx={ctx} />}
        {step === "actividades" && <ActivitiesEditor ctx={ctx} />}
        {step === "revision" && <ReviewStep ctx={ctx} goTo={(s) => setStep(steps.find((x) => x.sections.includes(s))?.id ?? "general")} onGenerate={onGenerate} />}
        <div className="pb-footer">
          <Button secondary disabled={index === 0} onClick={() => setStep(steps[index - 1].id)}>
            <ArrowLeft size={15} /> Anterior
          </Button>
          {index < steps.length - 1 && (
            <Button onClick={() => setStep(steps[index + 1].id)}>
              Siguiente <ArrowRight size={15} />
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}

/* ---------------- Revisar mi proyecto, vista previa y generación ---------------- */
function ReviewStep({ ctx, goTo, onGenerate }: { ctx: BuilderCtx; goTo: (s: BuilderSection) => void; onGenerate: (p: NormalizedProject, c: MissionConfig) => string | null }) {
  const p = ctx.p;
  const review = reviewProject(p);
  const phases = phaseAvailability(p);
  const [config, setConfig] = useState<MissionConfig>({ difficulty: p.creator?.difficulty ?? "guiado", mode: "aprendizaje", duration: "normal" });
  const [error, setError] = useState("");
  const imported = p.source.type === "imported_pdf" || p.source.type === "imported_excel";
  const Icon = { ok: CheckCircle2, revisar: AlertTriangle, error: XCircle };
  return (
    <>
      <div className={"pb-ready " + (review.ready ? (review.items.every((i) => i.status === "ok") ? "ok" : "warn") : "error")} role="status">
        <strong>{review.label}</strong>
        <span>Completitud {completeness(p).percent} %</span>
      </div>
      <h4>Revisar mi proyecto</h4>
      <p className="muted">La revisión señala qué no cuadra; no propone la respuesta. Tú decides cómo corregirlo.</p>
      <ul className="pb-checklist">
        {review.items.map((it) => {
          const I = Icon[it.status];
          return (
            <li key={it.label} className={it.status}>
              <I size={16} aria-hidden />
              <span className="pb-check-label"><span className="sr-only">{it.status === "ok" ? "Correcto: " : it.status === "error" ? "Error: " : "Revisar: "}</span>{it.label}</span>
              {it.messages.length > 0 && (
                <>
                  <ul>
                    {it.messages.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                  <button type="button" className="text-btn" onClick={() => goTo(it.section)}>
                    Ir a corregir
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
      {imported && (
        <label className="checkline pb-confirm">
          <input type="checkbox" checked={!!p.metadata.importReviewed} onChange={(e) => ctx.edit([], (d) => (d.metadata.importReviewed = e.target.checked))} />
          Revisé y corregí los datos importados (los marcados como «No identificada» los completé o acepto que falten).
        </label>
      )}
      <h4>Resumen del proyecto</h4>
      <Preview p={p} />
      <h4>Fases de la partida según tus datos</h4>
      <ul className="pb-phases">
        {phases.map((f) => (
          <li key={f.label} className={f.status}>
            <span aria-hidden>{f.status === "si" ? "✓" : f.status === "parcial" ? "?" : "✕"}</span> <strong>{f.label}</strong> <small>{f.reason}</small>
          </li>
        ))}
      </ul>
      <h4>Configuración de la partida</h4>
      <div className="pb-config">
        <fieldset>
          <legend>Dificultad</legend>
          {(
            [
              ["guiado", "Guiado (fácil)"],
              ["profesional", "Profesional (intermedio)"],
              ["experto", "Experto (avanzado)"],
            ] as const
          ).map(([id, label]) => (
            <label key={id} className="checkline">
              <input type="radio" name="dif" checked={config.difficulty === id} onChange={() => setConfig({ ...config, difficulty: id })} /> {label}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Modo</legend>
          {(
            [
              ["aprendizaje", "Aprendizaje", "Retroalimentación inmediata."],
              ["evaluacion", "Evaluación", "Retroalimentación al final."],
              ["exploracion", "Exploración", "Cambios sin costo; nota no comparable."],
            ] as const
          ).map(([id, label, hint]) => (
            <label key={id} className="checkline">
              <input type="radio" name="modo" checked={config.mode === id} onChange={() => setConfig({ ...config, mode: id })} /> {label} <small>{hint}</small>
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Duración</legend>
          {(
            [
              ["rapida", "Rápida", "Actividades esenciales."],
              ["normal", "Normal", "Flujo económico, estrés y comité."],
              ["completa", "Completa", "Todas las fases compatibles."],
            ] as const
          ).map(([id, label, hint]) => (
            <label key={id} className="checkline">
              <input type="radio" name="duracion" checked={config.duration === id} onChange={() => setConfig({ ...config, duration: id })} /> {label} <small>{hint}</small>
            </label>
          ))}
        </fieldset>
      </div>
      {error && (
        <p role="alert" className="pb-issues error">
          {error}
        </p>
      )}
      <div className="actions">
        <Button
          disabled={!review.ready}
          onClick={() => {
            const e = onGenerate(p, config);
            setError(e ?? "");
          }}
        >
          <Play size={16} /> CREAR PARTIDA INTERACTIVA
        </Button>
        <Button secondary onClick={() => download(fileSafe(p.title) + ".ludo.json", exportProject(p), "application/json")}>
          <Download size={15} /> Exportar proyecto (.ludo.json)
        </Button>
      </div>
      {!review.ready && <p className="muted">Corrige los errores marcados con ✕ para convertir el proyecto en simulación. Las advertencias no impiden continuar.</p>}
    </>
  );
}
const nf = (v: number | null | undefined, unit = "") => (v === null || v === undefined ? "sin dato" : unit === "M" ? fmtMoney(v) : unit === "%" ? `${Math.round(v * 1000) / 10} %` : `${v.toLocaleString("es-CO")}${unit ? " " + unit : ""}`);
export function Preview({ p }: { p: NormalizedProject }) {
  return (
    <div className="pb-preview">
      <section>
        <h5>{p.title || "Proyecto sin nombre"}</h5>
        <p>{p.description || "Sin descripción."}</p>
        <p className="muted">
          {p.sector || "Sector no identificado"} · {p.territory || "Ubicación no identificada"} · {p.projectType === "publico" ? "Inversión pública" : "Inversión privada"} · horizonte {nf(p.horizon, "años")}
        </p>
      </section>
      <section>
        <h5>Árbol del problema</h5>
        <p>
          <strong>Problema:</strong> {p.problem || "No identificado"}
        </p>
        <p>
          <strong>Causas:</strong> {p.causes.map((c) => c.text).join(" · ") || "No identificadas"}
        </p>
        <p>
          <strong>Efectos:</strong> {p.problemEffects.map((c) => c.text).join(" · ") || "No identificados"}
        </p>
      </section>
      <section>
        <h5>Población y actores</h5>
        <p>
          Afectada {nf(p.population.affected)} · objetivo {nf(p.population.target)} {p.population.unit} · actores: {p.actors.map((a) => a.name).join(", ") || "No identificados"}
        </p>
      </section>
      <section>
        <h5>Objetivos</h5>
        <p>
          <strong>General:</strong> {p.generalObjective || "No identificado"}
        </p>
        <ul>
          {p.specificObjectives.map((o) => (
            <li key={o.id}>{o.text}</li>
          ))}
        </ul>
      </section>
      <section>
        <h5>Alternativas</h5>
        <ul>
          {p.alternatives.map((a) => (
            <li key={a.id}>
              <strong>{a.name || "Sin nombre"}</strong>: inversión {nf(a.investment, "M")}, O&M {nf(a.om, "M")}/año, ingresos {nf(a.revenue, "M")}, beneficio social {nf(a.socialBenefit, "M")}, cobertura {nf(a.coverage, "%")}, vida útil {nf(a.life, "años")}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h5>Cadena de valor</h5>
        <p>
          {(["inputs", "activities", "products", "outcomes", "impacts"] as const).some((k) => p.valueChain[k].some((x) => x.trim()))
            ? (["inputs", "activities", "products", "outcomes", "impacts"] as const).map((k) => p.valueChain[k].filter((x) => x.trim()).join(", ") || "—").join(" → ")
            : "Sin registrar: se usará «alternativa en operación»."}
        </p>
      </section>
      <section>
        <h5>Efectos e impactos</h5>
        {!p.impacts.length && <p>Sin registrar: el módulo de valoración no se incluirá.</p>}
        <ul>
          {p.impacts.map((i) => (
            <li key={i.id}>
              {i.kind === "efecto" ? "Efecto" : "Impacto"} {i.direction}: {i.text}
              {i.method ? ` · método ${i.method}` : ""}
              {i.annualValue !== null && i.annualValue !== undefined ? ` · ${fmtMoney(i.annualValue)}/año` : ""}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h5>Finanzas</h5>
        <p>
          Presupuesto {nf(p.financial.budget, "M")} · plazo {nf(p.financial.deadline, "meses")} · tasa financiera {nf(p.financial.rate, "%")} · tasa social {nf(p.economic.socialRate, "%")} · {p.costs.length} costo(s), {p.benefits.length} beneficio(s), {p.assumptions.length} supuesto(s)
        </p>
      </section>
      <section>
        <h5>Riesgos, regulación y ODS</h5>
        <p>
          {p.risks.map((r) => r.name).join(", ") || "Sin riesgos"} · falla: {p.regulation.failure ?? "No identificada"} · ODS {p.sdgs.suggested.join(", ") || "no identificados"}
          {p.sdgs.playerIdentifies ? " (los identificará el jugador)" : ""}
        </p>
      </section>
    </div>
  );
}

/* ---------------- Modo creador: actividades generadas, editor y vista previa como jugador ---------------- */
const statusText = { esperada: "Respuesta esperada", plausible: "Respuesta plausible", requiere_revision: "Requiere revisión" };
function ActivitiesEditor({ ctx }: { ctx: BuilderCtx }) {
  const p = ctx.p;
  const acts = generateActivities(p);
  const [open, setOpen] = useState<string | null>(acts[0]?.id ?? null);
  const current = acts.find((a) => a.id === open);
  const setOverride = (id: string, patch: ActivityOverride) =>
    ctx.edit([], (d) => {
      d.creator ??= {};
      d.creator.activities ??= {};
      d.creator.activities[id] = { ...d.creator.activities[id], ...patch };
    });
  return (
    <>
      <p className="muted">
        Las actividades se generan por reglas desde tus datos (fuente indicada en cada una). Revísalas: al editarlas quedan como respuesta esperada. No se marca nada como verdad oficial sin evidencia.
      </p>
      <label className="field pb-field">
        <span>Distractores del Árbol del problema (dos causas falsas plausibles)</span>
        <input
          value={(p.creator?.distractors ?? []).join(" | ")}
          placeholder="Ej.: Ausencia de un parque temático | Falta de publicidad"
          onChange={(e) =>
            ctx.edit([], (d) => {
              d.creator ??= {};
              d.creator.distractors = e.target.value.split("|").map((x) => x.trim()).filter(Boolean).slice(0, 2);
            })
          }
        />
        <small>Separa con «|». Si no defines dos, se usan distractores genéricos.</small>
      </label>
      <div className="pb-activities">
        <ul>
          {acts.map((a) => (
            <li key={a.id}>
              <button type="button" className={a.id === open ? "on" : ""} onClick={() => setOpen(a.id)}>
                <span className={"pb-badge " + (a.status === "esperada" ? "ok" : a.status === "plausible" ? "warn" : "error")}>{statusText[a.status]}</span> {a.disabled ? "(desactivada) " : ""}
                {a.question}
              </button>
            </li>
          ))}
          {!acts.length && <li className="muted">Completa más datos para generar actividades.</li>}
        </ul>
        {current && (
          <div className="pb-activity-edit">
            <small className="muted">
              Fuente: {current.source.join(", ")} · concepto: {current.concept} · etapa {current.phase + 1}
            </small>
            <label className="field">
              <span>Pregunta</span>
              <input value={current.question} onChange={(e) => setOverride(current.id, { question: e.target.value })} />
            </label>
            {current.options.map((o, i) => (
              <div key={o.id} className="pb-option">
                <input type="checkbox" aria-label="Respuesta correcta" checked={current.validAnswers.includes(o.id)} onChange={(e) => setOverride(current.id, { answers: e.target.checked ? [...current.validAnswers, o.id] : current.validAnswers.filter((x) => x !== o.id), options: current.options })} />
                <input aria-label={`Opción ${i + 1}`} value={o.text} onChange={(e) => setOverride(current.id, { options: current.options.map((x) => (x.id === o.id ? { ...x, text: e.target.value } : x)), answers: current.validAnswers })} />
              </div>
            ))}
            <label className="field">
              <span>Explicación</span>
              <textarea rows={2} value={current.feedback} onChange={(e) => setOverride(current.id, { explanation: e.target.value })} />
            </label>
            <div className="pb-grid">
              <label className="field">
                <span>Puntos</span>
                <input type="number" min={0} max={20} value={current.score} onChange={(e) => setOverride(current.id, { points: Number(e.target.value) })} />
              </label>
              <label className="field">
                <span>Dificultad</span>
                <select value={current.difficulty} onChange={(e) => setOverride(current.id, { difficulty: e.target.value })}>
                  <option>Básica</option>
                  <option>Intermedia</option>
                  <option>Avanzada</option>
                </select>
              </label>
              <label className="checkline">
                <input type="checkbox" checked={!!current.disabled} onChange={(e) => setOverride(current.id, { disabled: e.target.checked })} /> Desactivar
              </label>
            </div>
            <PlayerPreview a={current} />
          </div>
        )}
      </div>
    </>
  );
}
function PlayerPreview({ a }: { a: GeneratedActivity }) {
  const [pick, setPick] = useState("");
  return (
    <div className="v22-experiment">
      <h4>
        <CircleHelp size={15} aria-hidden /> Vista previa como jugador
      </h4>
      <p>{a.question}</p>
      <div className="v22-choice">
        {a.options.map((o) => (
          <label key={o.id} className={pick === o.id ? "chosen" : ""}>
            <input type="radio" name={"prev" + a.id} checked={pick === o.id} onChange={() => setPick(o.id)} />
            {o.text}
          </label>
        ))}
      </div>
      {pick && (
        <p role="status" className={"v22-status " + (a.validAnswers.includes(pick) ? "ok" : "grave")}>
          <span className="v22-status-label">{a.validAnswers.includes(pick) ? "Correcto:" : "Revisa:"}</span> {a.feedback}
        </p>
      )}
    </div>
  );
}

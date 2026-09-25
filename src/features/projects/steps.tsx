import { useState, type DragEvent } from "react";
import { ArrowDown, ArrowUp, MoveVertical, Plus, Trash2 } from "lucide-react";
import { valuationMethods } from "../../data/valuationMethods";
import { sdgs as sdgList } from "../../data/sdgs";
import { emptyAlternative, uid } from "../../domain/project/project";
import type { BenefitKind, CostCategory, FailureType, ImpactTypeId, NormalizedProject, RiskLevel, TreeItem } from "../../domain/project/types";
import { looksLikeCause, looksLikeEffect, looksLikeSolution } from "../../domain/project/validation";
import { fmtMoney } from "../../domain/format";
import { EvidenceBadge, IssuesFor, LearnLink, NumField, TextField, TextList, type BuilderCtx } from "./fields";

const beneficiaries = ["Usuarios", "Consumidores", "Productores", "Gobierno", "Comunidad", "Trabajadores", "Población objetivo", "Terceros"];
const impactTypes: { id: ImpactTypeId; label: string }[] = [
  { id: "salud", label: "Salud" },
  { id: "tiempo", label: "Tiempo" },
  { id: "productividad", label: "Productividad" },
  { id: "propiedad", label: "Valor de la propiedad" },
  { id: "recreacion", label: "Recreación" },
  { id: "ahorro", label: "Ahorro de costos" },
  { id: "ambiente", label: "Ambiente" },
  { id: "emisiones", label: "Emisiones" },
  { id: "variedad", label: "Variedad de bienes" },
];
const failures: FailureType[] = ["Externalidades", "Monopolio natural", "Poder de mercado", "Información asimétrica", "Bienes públicos", "Ninguna falla suficiente"];
const levels: RiskLevel[] = ["baja", "media", "alta"];

/* ---------------- 1. Información general ---------------- */
export function GeneralStep({ ctx }: { ctx: BuilderCtx }) {
  const p = ctx.p;
  return (
    <>
      <p className="muted">Solo lo necesario para ubicar el proyecto. Los montos van en millones de pesos (M).</p>
      <TextField ctx={ctx} path="title" label="Nombre del proyecto" value={p.title} set={(d, v) => (d.title = v)} placeholder="Ej.: Parque lineal del río Claro" />
      <TextField ctx={ctx} path="description" label="Descripción breve" value={p.description} area set={(d, v) => (d.description = v)} />
      <div className="pb-grid">
        <TextField ctx={ctx} path="sector" label="Sector" value={p.sector} set={(d, v) => (d.sector = v)} />
        <TextField ctx={ctx} path="territory" label="Ubicación general" value={p.territory} set={(d, v) => (d.territory = v)} />
        <label className="field pb-field">
          <span>Tipo de proyecto</span>
          <select value={p.projectType} onChange={(e) => ctx.edit(["projectType"], (d) => (d.projectType = e.target.value as "publico" | "privado"))}>
            <option value="publico">Inversión pública (evaluación social)</option>
            <option value="privado">Inversión privada</option>
          </select>
        </label>
        <NumField ctx={ctx} path="horizon" label="Horizonte de evaluación" unit="años" value={p.horizon} set={(d, v) => (d.horizon = v)} min={1} />
      </div>
    </>
  );
}

/* ---------------- 2. Problema: árbol del problema ---------------- */
function TreeCard({ ctx, item, kind, onDragStart }: { ctx: BuilderCtx; item: TreeItem; kind: "causes" | "problemEffects"; onDragStart: (e: DragEvent) => void }) {
  const other = kind === "causes" ? "problemEffects" : "causes";
  const hint = !item.text.trim() ? "" : looksLikeSolution(item.text) ? "Parece una solución o un producto faltante." : kind === "causes" && looksLikeEffect(item.text) ? "Parece un efecto del problema." : kind === "problemEffects" && looksLikeCause(item.text) && !looksLikeEffect(item.text) ? "Parece una causa." : "";
  const list = ctx.p[kind],
    i = list.findIndex((x) => x.id === item.id);
  return (
    <li className="pb-tree-card" draggable onDragStart={onDragStart}>
      <MoveVertical size={14} aria-hidden className="pb-grip" />
      <input aria-label={kind === "causes" ? "Causa" : "Efecto"} value={item.text} onChange={(e) => ctx.edit([`${kind}.${item.id}`], (d) => (d[kind].find((x) => x.id === item.id)!.text = e.target.value))} placeholder={kind === "causes" ? "Condición que genera el problema" : "Consecuencia del problema"} />
      <select aria-label="Nivel" value={item.level} onChange={(e) => ctx.edit([`${kind}.${item.id}`], (d) => (d[kind].find((x) => x.id === item.id)!.level = e.target.value as TreeItem["level"]))}>
        <option value="directa">{kind === "causes" ? "Directa" : "Directo"}</option>
        <option value="indirecta">{kind === "causes" ? "Indirecta" : "Indirecto"}</option>
      </select>
      <div className="pb-tree-actions">
        <button type="button" className="icon-btn" aria-label="Subir" disabled={i === 0} onClick={() => ctx.edit([kind], (d) => d[kind].splice(i - 1, 0, d[kind].splice(i, 1)[0]))}>
          <ArrowUp size={14} />
        </button>
        <button type="button" className="icon-btn" aria-label="Bajar" disabled={i === list.length - 1} onClick={() => ctx.edit([kind], (d) => d[kind].splice(i + 1, 0, d[kind].splice(i, 1)[0]))}>
          <ArrowDown size={14} />
        </button>
        <button type="button" className="text-btn" onClick={() => ctx.edit([kind, other], (d) => d[other].push(d[kind].splice(i, 1)[0]))}>
          Mover a {kind === "causes" ? "efectos" : "causas"}
        </button>
        <button type="button" className="icon-btn" aria-label="Eliminar" onClick={() => ctx.edit([kind], (d) => d[kind].splice(i, 1))}>
          <Trash2 size={14} />
        </button>
      </div>
      <EvidenceBadge ev={ctx.p.evidence[`${kind}.${item.id}`]} />
      {hint && <small className="pb-assist">Asistencia: {hint} No se cambia automáticamente; decide tú.</small>}
    </li>
  );
}
export function ProblemStep({ ctx }: { ctx: BuilderCtx }) {
  const p = ctx.p;
  const [drag, setDrag] = useState<{ id: string; from: "causes" | "problemEffects" } | null>(null);
  const drop = (to: "causes" | "problemEffects") => (e: DragEvent) => {
    e.preventDefault();
    if (!drag || drag.from === to) return;
    ctx.edit([drag.from, to], (d) => {
      const i = d[drag.from].findIndex((x) => x.id === drag.id);
      if (i >= 0) d[to].push(d[drag.from].splice(i, 1)[0]);
    });
    setDrag(null);
  };
  const zone = (kind: "causes" | "problemEffects", title: string) => (
    <div className={"pb-tree-zone " + kind} onDragOver={(e) => e.preventDefault()} onDrop={drop(kind)} aria-label={title}>
      <h4>{title}</h4>
      <ul>
        {p[kind].map((it) => (
          <TreeCard key={it.id} ctx={ctx} item={it} kind={kind} onDragStart={(e) => (e.dataTransfer.setData("text/plain", it.id), setDrag({ id: it.id, from: kind }))} />
        ))}
      </ul>
      <button type="button" className="btn secondary" onClick={() => ctx.edit([kind], (d) => d[kind].push({ id: uid(kind === "causes" ? "c" : "e"), text: "", level: d[kind].length ? "indirecta" : "directa" }))}>
        <Plus size={14} /> {kind === "causes" ? "Agregar causa" : "Agregar efecto"}
      </button>
      <IssuesFor issues={ctx.issues} path={kind} exact />
    </div>
  );
  return (
    <>
      <p className="muted">
        Escribe primero la situación negativa, no la solución. Ejemplo: «Baja continuidad del servicio de agua» y no «Construir un acueducto». <LearnLink concept="arbol">Árbol del problema</LearnLink>
      </p>
      <div className="pb-tree">
        {zone("problemEffects", "Efectos (consecuencias)")}
        <div className="pb-tree-arrow" aria-hidden>
          ↑
        </div>
        <div className="pb-tree-core">
          <TextField ctx={ctx} path="problem" label="Problema central" value={p.problem} set={(d, v) => (d.problem = v)} placeholder="Situación negativa que afecta a una población" />
        </div>
        <div className="pb-tree-arrow" aria-hidden>
          ↑
        </div>
        {zone("causes", "Causas (por qué ocurre)")}
      </div>
      <p className="muted">Arrastra una tarjeta entre causas y efectos, o usa «Mover a…» con el teclado.</p>
    </>
  );
}

/* ---------------- 3. Actores y población ---------------- */
export function ActorsStep({ ctx }: { ctx: BuilderCtx }) {
  const p = ctx.p;
  return (
    <>
      <div className="pb-grid">
        <NumField ctx={ctx} path="population.total" label="Población total del territorio" value={p.population.total} set={(d, v) => (d.population.total = v)} />
        <NumField ctx={ctx} path="population.affected" label="Población afectada" value={p.population.affected} set={(d, v) => (d.population.affected = v)} hint="Quienes tienen el problema (demanda)." />
        <NumField ctx={ctx} path="population.target" label="Población objetivo" value={p.population.target} set={(d, v) => (d.population.target = v)} hint="A quienes atenderá el proyecto." />
        <NumField ctx={ctx} path="population.currentSupply" label="Atendidos hoy (oferta actual)" value={p.population.currentSupply} set={(d, v) => (d.population.currentSupply = v)} />
        <TextField ctx={ctx} path="population.unit" label="Unidad" value={p.population.unit} set={(d, v) => (d.population.unit = v)} />
      </div>
      <TextField ctx={ctx} path="population.characteristics" label="Características relevantes" value={p.population.characteristics} area set={(d, v) => (d.population.characteristics = v)} />
      <h4>
        Actores <LearnLink concept="actores" />
      </h4>
      <div className="table-wrap">
        <table className="pb-table">
          <thead>
            <tr>
              <th>Actor</th>
              <th>Interés</th>
              <th>Poder (0–100)</th>
              <th>Posición (−100 a 100)</th>
              <th>Influencia</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {p.actors.map((a, i) => (
              <tr key={a.id}>
                <td>
                  <input aria-label="Nombre del actor" value={a.name} onChange={(e) => ctx.edit([`actors.${a.id}`], (d) => (d.actors[i].name = e.target.value))} />
                  <EvidenceBadge ev={p.evidence[`actors.${a.id}`]} />
                </td>
                <td>
                  <input aria-label="Interés" value={a.interest ?? ""} onChange={(e) => ctx.edit([`actors.${a.id}`], (d) => (d.actors[i].interest = e.target.value))} />
                </td>
                <td>
                  <input aria-label="Poder" type="number" min={0} max={100} value={a.power ?? ""} onChange={(e) => ctx.edit([`actors.${a.id}`], (d) => (d.actors[i].power = e.target.value === "" ? null : Number(e.target.value)))} />
                </td>
                <td>
                  <input aria-label="Posición" type="number" min={-100} max={100} value={a.position ?? ""} onChange={(e) => ctx.edit([`actors.${a.id}`], (d) => (d.actors[i].position = e.target.value === "" ? null : Number(e.target.value)))} />
                </td>
                <td>
                  <input aria-label="Influencia" value={a.influence ?? ""} onChange={(e) => ctx.edit([`actors.${a.id}`], (d) => (d.actors[i].influence = e.target.value))} />
                </td>
                <td>
                  <button type="button" className="icon-btn" aria-label="Quitar actor" onClick={() => ctx.edit(["actors"], (d) => d.actors.splice(i, 1))}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn secondary" onClick={() => ctx.edit(["actors"], (d) => d.actors.push({ id: uid("act"), name: "", power: null, position: null }))}>
        <Plus size={14} /> Agregar actor
      </button>
      <IssuesFor issues={ctx.issues} path="actors" exact />
      <IssuesFor issues={ctx.issues} path="population" />
    </>
  );
}

/* ---------------- 4. Objetivos ---------------- */
export function ObjectivesStep({ ctx }: { ctx: BuilderCtx }) {
  const p = ctx.p;
  return (
    <>
      <div className="pb-relation">
        <span>Problema</span>
        <strong>{p.problem || "No identificado"}</strong>
        <span aria-hidden>→</span>
        <span>Objetivo general</span>
      </div>
      <TextField ctx={ctx} path="generalObjective" label="Objetivo general" value={p.generalObjective} set={(d, v) => (d.generalObjective = v)} hint="Expresa el problema central resuelto (situación deseada), no el producto." />
      <h4>
        Objetivos específicos (uno por causa) <LearnLink concept="objetivos" />
      </h4>
      <ul className="pb-objectives">
        {p.specificObjectives.map((o, i) => (
          <li key={o.id}>
            <input aria-label={`Objetivo específico ${i + 1}`} value={o.text} onChange={(e) => ctx.edit([`specificObjectives.${o.id}`], (d) => (d.specificObjectives[i].text = e.target.value))} />
            <select aria-label="Causa que atiende" value={o.causeId ?? ""} onChange={(e) => ctx.edit([`specificObjectives.${o.id}`], (d) => (d.specificObjectives[i].causeId = e.target.value || undefined))}>
              <option value="">¿Qué causa atiende?</option>
              {p.causes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.text || "(causa sin texto)"}
                </option>
              ))}
            </select>
            <button type="button" className="icon-btn" aria-label="Quitar objetivo" onClick={() => ctx.edit(["specificObjectives"], (d) => d.specificObjectives.splice(i, 1))}>
              <Trash2 size={14} />
            </button>
            <IssuesFor issues={ctx.issues} path={`specificObjectives.${o.id}`} />
          </li>
        ))}
      </ul>
      <button type="button" className="btn secondary" onClick={() => ctx.edit(["specificObjectives"], (d) => d.specificObjectives.push({ id: uid("o"), text: "" }))}>
        <Plus size={14} /> Agregar objetivo específico
      </button>
      <IssuesFor issues={ctx.issues} path="specificObjectives" exact />
      <h4>Fines (responden a los efectos)</h4>
      {p.problemEffects.map((e) => {
        const end = p.ends.find((x) => x.effectId === e.id);
        return (
          <label key={e.id} className="field pb-field">
            <span>Fin para «{e.text || "efecto sin texto"}»</span>
            <input value={end?.text ?? ""} onChange={(ev) => ctx.edit(["ends"], (d) => (d.ends = [...d.ends.filter((x) => x.effectId !== e.id), { effectId: e.id, text: ev.target.value }]))} />
          </label>
        );
      })}
    </>
  );
}

/* ---------------- 5. Alternativas ---------------- */
export function AlternativesStep({ ctx }: { ctx: BuilderCtx }) {
  const p = ctx.p;
  const rows: { label: string; get: (a: NormalizedProject["alternatives"][number]) => string }[] = [
    { label: "Inversión", get: (a) => (a.investment !== null ? fmtMoney(a.investment) : "—") },
    { label: "O&M anual", get: (a) => (a.om !== null ? fmtMoney(a.om) : "—") },
    { label: "Ingresos anuales", get: (a) => (a.revenue !== null ? fmtMoney(a.revenue) : "—") },
    { label: "Beneficio social anual", get: (a) => (a.socialBenefit !== null ? fmtMoney(a.socialBenefit) : "—") },
    { label: "Duración de obra", get: (a) => (a.months !== null ? a.months + " meses" : "—") },
    { label: "Vida útil", get: (a) => (a.life !== null ? a.life + " años" : "—") },
    { label: "Valor residual", get: (a) => (a.residual !== null ? fmtMoney(a.residual) : "—") },
    { label: "Cobertura", get: (a) => (a.coverage !== null ? Math.round(a.coverage * 100) + " %" : "—") },
    { label: "Riesgo", get: (a) => a.risk ?? "—" },
  ];
  return (
    <>
      <p className="muted">
        Crea entre dos y cuatro alternativas. La tabla compara mientras escribes; el simulador no elige la mejor. <LearnLink concept="alternativas" />
      </p>
      <div className="pb-alts">
        {p.alternatives.map((a, i) => {
          const path = `alternatives.${a.id}`,
            set = <K extends keyof typeof a>(k: K) => (d: NormalizedProject, v: (typeof a)[K]) => (d.alternatives[i][k] = v);
          return (
            <fieldset key={a.id} className="pb-alt">
              <legend>
                Alternativa {i + 1}
                <button type="button" className="icon-btn" aria-label="Eliminar alternativa" onClick={() => ctx.edit(["alternatives"], (d) => d.alternatives.splice(i, 1))}>
                  <Trash2 size={14} />
                </button>
              </legend>
              <TextField ctx={ctx} path={path + ".name"} label="Nombre" value={a.name} set={set("name")} />
              <TextField ctx={ctx} path={path + ".description"} label="Descripción" value={a.description} set={set("description")} />
              <div className="pb-grid">
                <NumField ctx={ctx} path={path + ".investment"} label="Inversión" unit="M" value={a.investment} set={set("investment")} />
                <NumField ctx={ctx} path={path + ".om"} label="O&M anual" unit="M" value={a.om} set={set("om")} />
                <NumField ctx={ctx} path={path + ".revenue"} label="Ingresos anuales" unit="M" value={a.revenue} set={set("revenue")} />
                <NumField ctx={ctx} path={path + ".socialBenefit"} label="Beneficio social anual" unit="M" value={a.socialBenefit} set={set("socialBenefit")} />
                <NumField ctx={ctx} path={path + ".months"} label="Duración de obra" unit="meses" value={a.months} set={set("months")} />
                <NumField ctx={ctx} path={path + ".life"} label="Vida útil" unit="años" value={a.life} set={set("life")} />
                <NumField ctx={ctx} path={path + ".residual"} label="Valor residual" unit="M" value={a.residual} set={set("residual")} />
                <NumField ctx={ctx} path={path + ".coverage"} label="Cobertura" unit="% de la población objetivo" scale={100} value={a.coverage} set={set("coverage")} />
                <label className="field pb-field">
                  <span>Riesgo</span>
                  <select value={a.risk ?? ""} onChange={(e) => ctx.edit([path + ".risk"], (d) => (d.alternatives[i].risk = (e.target.value || null) as RiskLevel | null))}>
                    <option value="">No identificado</option>
                    {levels.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </label>
                <NumField ctx={ctx} path={path + ".environment"} label="Balance ambiental" unit="−50 a 50" value={a.environment} set={set("environment")} />
              </div>
              <TextField ctx={ctx} path={path + ".capacity"} label="Capacidad" value={a.capacity} set={set("capacity")} />
              <TextField ctx={ctx} path={path + ".tradeoff"} label="Qué ganas y qué sacrificas (trade-off)" value={a.tradeoff} set={set("tradeoff")} />
              <div className="pb-checks" role="group" aria-label="Causas que atiende">
                <span>Causas que atiende:</span>
                {p.causes.map((c) => (
                  <label key={c.id} className="checkline">
                    <input
                      type="checkbox"
                      checked={a.causeIds.includes(c.id)}
                      onChange={(e) => ctx.edit([path + ".causeIds"], (d) => (d.alternatives[i].causeIds = e.target.checked ? [...a.causeIds, c.id] : a.causeIds.filter((x) => x !== c.id)))}
                    />
                    {c.text || "(causa sin texto)"}
                  </label>
                ))}
              </div>
              <IssuesFor issues={ctx.issues} path={path + ".causeIds"} />
            </fieldset>
          );
        })}
      </div>
      {p.alternatives.length < 4 && (
        <button type="button" className="btn secondary" onClick={() => ctx.edit(["alternatives"], (d) => d.alternatives.push(emptyAlternative(uid("alt"))))}>
          <Plus size={14} /> Agregar alternativa
        </button>
      )}
      <IssuesFor issues={ctx.issues} path="alternatives" exact />
      {p.alternatives.length > 1 && (
        <div className="table-wrap">
          <table className="pb-table pb-compare">
            <caption>Comparación de alternativas (sin selección automática)</caption>
            <thead>
              <tr>
                <th>Criterio</th>
                {p.alternatives.map((a, i) => (
                  <th key={a.id}>{a.name || `Alternativa ${i + 1}`}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <th>{r.label}</th>
                  {p.alternatives.map((a) => (
                    <td key={a.id}>{r.get(a)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* ---------------- 6. Cadena de valor ---------------- */
export function ChainStep({ ctx }: { ctx: BuilderCtx }) {
  const vc = ctx.p.valueChain;
  const cols: { key: keyof typeof vc; label: string; ph: string }[] = [
    { key: "inputs", label: "Insumos", ph: "Recursos, equipos" },
    { key: "activities", label: "Actividades", ph: "Construir, capacitar" },
    { key: "products", label: "Productos", ph: "Bien o servicio entregado" },
    { key: "outcomes", label: "Resultados", ph: "Cambio en el uso o acceso" },
    { key: "impacts", label: "Impactos", ph: "Cambio en el bienestar" },
  ];
  return (
    <>
      <p className="muted">
        Insumos → actividades → productos → resultados → impactos. <LearnLink concept="cadena-valor" />
      </p>
      <div className="pb-chain">
        {cols.map((c, i) => (
          <div key={c.key} className={"pb-chain-col " + (vc[c.key].length ? "filled" : "")}>
            <TextList label={c.label} items={vc[c.key]} placeholder={c.ph} onChange={(items) => ctx.edit(["valueChain." + c.key], (d) => (d.valueChain[c.key] = items))} />
            {i < cols.length - 1 && (
              <span className={"pb-chain-link " + (vc[c.key].length && vc[cols[i + 1].key].length ? "on" : "")} aria-hidden>
                →
              </span>
            )}
          </div>
        ))}
      </div>
      <IssuesFor issues={ctx.issues} path="valueChain" />
    </>
  );
}

/* ---------------- 7. Efectos, impactos y valoración ---------------- */
export function ImpactsStep({ ctx }: { ctx: BuilderCtx }) {
  const p = ctx.p;
  return (
    <>
      <p className="muted">
        Un efecto es un cambio directo (en unidades físicas); un impacto es un cambio en el bienestar de un grupo. <LearnLink concept="efectos-impactos" /> <LearnLink concept="valoracion">Valoración</LearnLink>
      </p>
      <div className="pb-impacts">
        {p.impacts.map((im, i) => {
          const path = `impacts.${im.id}`;
          const up = (fn: (x: (typeof p.impacts)[number]) => void) => ctx.edit([path], (d) => fn(d.impacts[i]));
          return (
            <fieldset key={im.id} className="pb-impact">
              <legend>
                {im.kind === "efecto" ? "Efecto" : "Impacto"} {i + 1}
                <button type="button" className="icon-btn" aria-label="Eliminar" onClick={() => ctx.edit(["impacts"], (d) => d.impacts.splice(i, 1))}>
                  <Trash2 size={14} />
                </button>
              </legend>
              <input aria-label="Descripción" value={im.text} placeholder="Ej.: Horas de viaje ahorradas" onChange={(e) => up((x) => (x.text = e.target.value))} />
              <EvidenceBadge ev={p.evidence[path]} />
              <div className="pb-grid">
                <label className="field">
                  <span>Tipo</span>
                  <select value={im.kind} onChange={(e) => up((x) => (x.kind = e.target.value as "efecto" | "impacto"))}>
                    <option value="efecto">Efecto</option>
                    <option value="impacto">Impacto</option>
                  </select>
                </label>
                <label className="field">
                  <span>Dirección</span>
                  <select value={im.direction} onChange={(e) => up((x) => (x.direction = e.target.value as "positivo" | "negativo"))}>
                    <option value="positivo">Positivo</option>
                    <option value="negativo">Negativo</option>
                  </select>
                </label>
                <label className="field">
                  <span>Grupo afectado</span>
                  <select value={im.group} onChange={(e) => up((x) => (x.group = e.target.value))}>
                    <option value="">No identificado</option>
                    {beneficiaries.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Magnitud</span>
                  <input value={im.magnitude} onChange={(e) => up((x) => (x.magnitude = e.target.value))} />
                </label>
                <label className="field">
                  <span>Duración</span>
                  <input value={im.duration} onChange={(e) => up((x) => (x.duration = e.target.value))} />
                </label>
              </div>
              {im.kind === "impacto" && (
                <details className="pb-valuation" open={!!im.type}>
                  <summary>Valoración posible</summary>
                  <div className="pb-grid">
                    <label className="field">
                      <span>Cambio en bienestar</span>
                      <select value={im.type ?? ""} onChange={(e) => up((x) => (x.type = (e.target.value || undefined) as ImpactTypeId | undefined))}>
                        <option value="">No identificado</option>
                        {impactTypes.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Método de valoración</span>
                      <select value={im.method ?? ""} onChange={(e) => up((x) => (x.method = e.target.value || undefined))}>
                        <option value="">Sin método</option>
                        {valuationMethods.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Valor anual (M)</span>
                      <input type="number" value={im.annualValue ?? ""} onChange={(e) => up((x) => (x.annualValue = e.target.value === "" ? null : Number(e.target.value)))} />
                    </label>
                    <label className="field">
                      <span>Unidad de medida</span>
                      <input value={im.unit ?? ""} placeholder="horas, casos, visitas" onChange={(e) => up((x) => (x.unit = e.target.value))} />
                    </label>
                    <label className="field">
                      <span>Cantidad por persona atendida al año</span>
                      <input type="number" value={im.perPerson ?? ""} onChange={(e) => up((x) => (x.perPerson = e.target.value === "" ? null : Number(e.target.value)))} />
                    </label>
                    <label className="field">
                      <span>¿Mide lo mismo que otro impacto?</span>
                      <select value={im.overlapWith ?? ""} onChange={(e) => up((x) => (x.overlapWith = e.target.value || undefined))}>
                        <option value="">No (sin doble conteo)</option>
                        {p.impacts
                          .filter((o) => o.id !== im.id && o.kind === "impacto")
                          .map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.text}
                            </option>
                          ))}
                      </select>
                    </label>
                  </div>
                  <label className="field">
                    <span>Datos disponibles para valorarlo</span>
                    <input value={im.data ?? ""} onChange={(e) => up((x) => (x.data = e.target.value))} />
                  </label>
                </details>
              )}
              <IssuesFor issues={ctx.issues} path={path} />
            </fieldset>
          );
        })}
      </div>
      <div className="actions">
        <button type="button" className="btn secondary" onClick={() => ctx.edit(["impacts"], (d) => d.impacts.push({ id: uid("i"), text: "", kind: "efecto", direction: "positivo", group: "", magnitude: "", duration: "" }))}>
          <Plus size={14} /> Agregar efecto
        </button>
        <button type="button" className="btn secondary" onClick={() => ctx.edit(["impacts"], (d) => d.impacts.push({ id: uid("i"), text: "", kind: "impacto", direction: "positivo", group: "", magnitude: "", duration: "" }))}>
          <Plus size={14} /> Agregar impacto
        </button>
      </div>
      <IssuesFor issues={ctx.issues} path="impacts" exact />
    </>
  );
}

/* ---------------- 8. Costos, beneficios, información financiera y económica ---------------- */
export function FinanceStep({ ctx }: { ctx: BuilderCtx }) {
  const p = ctx.p;
  const costCats: { id: CostCategory; label: string }[] = [
    { id: "inversion", label: "Inversión" },
    { id: "operacion", label: "Operación" },
    { id: "mantenimiento", label: "Mantenimiento" },
    { id: "otros", label: "Otros" },
  ];
  const benefitKinds: { id: BenefitKind; label: string }[] = [
    { id: "ingreso", label: "Ingreso (financiero)" },
    { id: "ahorro", label: "Ahorro de costos" },
    { id: "beneficioEconomico", label: "Beneficio económico" },
    { id: "impactoValorado", label: "Impacto valorado" },
  ];
  return (
    <>
      <h4>
        Costos <LearnLink concept="om" />
      </h4>
      <table className="pb-table">
        <thead>
          <tr>
            <th>Rubro</th>
            <th>Clasificación</th>
            <th>Monto (M)</th>
            <th>Alternativa</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {p.costs.map((c, i) => (
            <tr key={c.id}>
              <td>
                <input aria-label="Rubro" value={c.label} onChange={(e) => ctx.edit([`costs.${c.id}`], (d) => (d.costs[i].label = e.target.value))} />
                <EvidenceBadge ev={p.evidence[`costs.${c.id}`]} />
              </td>
              <td>
                <select aria-label="Clasificación" value={c.category} onChange={(e) => ctx.edit([`costs.${c.id}`], (d) => (d.costs[i].category = e.target.value as CostCategory))}>
                  {costCats.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input aria-label="Monto" type="number" value={c.amount ?? ""} onChange={(e) => ctx.edit([`costs.${c.id}`], (d) => (d.costs[i].amount = e.target.value === "" ? null : Number(e.target.value)))} />
              </td>
              <td>
                <select aria-label="Alternativa" value={c.alternativeId ?? ""} onChange={(e) => ctx.edit([`costs.${c.id}`], (d) => (d.costs[i].alternativeId = e.target.value || undefined))}>
                  <option value="">Todas</option>
                  {p.alternatives.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name || a.id}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <button type="button" className="icon-btn" aria-label="Quitar costo" onClick={() => ctx.edit(["costs"], (d) => d.costs.splice(i, 1))}>
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="btn secondary" onClick={() => ctx.edit(["costs"], (d) => d.costs.push({ id: uid("k"), label: "", category: "inversion", amount: null }))}>
        <Plus size={14} /> Agregar costo
      </button>
      <h4>
        Beneficios <LearnLink concept="flujo-economico">Financiero vs económico</LearnLink>
      </h4>
      <table className="pb-table">
        <thead>
          <tr>
            <th>Beneficio</th>
            <th>Tipo</th>
            <th>Monto anual (M)</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {p.benefits.map((b, i) => (
            <tr key={b.id}>
              <td>
                <input aria-label="Beneficio" value={b.label} onChange={(e) => ctx.edit([`benefits.${b.id}`], (d) => (d.benefits[i].label = e.target.value))} />
              </td>
              <td>
                <select aria-label="Tipo de beneficio" value={b.kind} onChange={(e) => ctx.edit([`benefits.${b.id}`], (d) => (d.benefits[i].kind = e.target.value as BenefitKind))}>
                  {benefitKinds.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input aria-label="Monto anual" type="number" value={b.amount ?? ""} onChange={(e) => ctx.edit([`benefits.${b.id}`], (d) => (d.benefits[i].amount = e.target.value === "" ? null : Number(e.target.value)))} />
              </td>
              <td>
                <button type="button" className="icon-btn" aria-label="Quitar beneficio" onClick={() => ctx.edit(["benefits"], (d) => d.benefits.splice(i, 1))}>
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="btn secondary" onClick={() => ctx.edit(["benefits"], (d) => d.benefits.push({ id: uid("b"), label: "", kind: "ingreso", amount: null }))}>
        <Plus size={14} /> Agregar beneficio
      </button>
      <p className="muted">Un ingreso entra a la caja del ejecutor (flujo financiero). Un beneficio económico es bienestar para la sociedad aunque nadie lo cobre (flujo económico). Una tarifa es transferencia en el flujo económico.</p>
      <h4>
        Información financiera y económica <LearnLink concept="vpn">VPN</LearnLink> <LearnLink concept="rpc">RPC</LearnLink>
      </h4>
      <div className="pb-grid">
        <NumField ctx={ctx} path="financial.budget" label="Presupuesto disponible" unit="M" value={p.financial.budget} set={(d, v) => (d.financial.budget = v)} />
        <NumField ctx={ctx} path="financial.deadline" label="Plazo máximo" unit="meses" value={p.financial.deadline} set={(d, v) => (d.financial.deadline = v)} />
        <NumField ctx={ctx} path="financial.rate" label="Tasa financiera" unit="%" scale={100} value={p.financial.rate} set={(d, v) => (d.financial.rate = v)} />
        <NumField ctx={ctx} path="economic.socialRate" label="Tasa social de descuento" unit="%" scale={100} value={p.economic.socialRate} set={(d, v) => (d.economic.socialRate = v)} hint="Referencia DNP: 9 % (Res. 1092 de 2022)." />
      </div>
      <TextField ctx={ctx} path="economic.adjustments" label="Ajustes económicos (RPC, transferencias, externalidades)" value={p.economic.adjustments} area set={(d, v) => (d.economic.adjustments = v)} hint="El simulador aplica las RPC del DNP por categoría de rubro." />
      <h4>Supuestos</h4>
      <ul className="pb-objectives">
        {p.assumptions.map((a, i) => (
          <li key={a.id}>
            <input aria-label="Supuesto" value={a.label} placeholder="Demanda, inflación, crecimiento, tasa, vida útil, precios" onChange={(e) => ctx.edit(["assumptions"], (d) => (d.assumptions[i].label = e.target.value))} />
            <input aria-label="Valor del supuesto" value={a.value} onChange={(e) => ctx.edit(["assumptions"], (d) => (d.assumptions[i].value = e.target.value))} />
            <button type="button" className="icon-btn" aria-label="Quitar supuesto" onClick={() => ctx.edit(["assumptions"], (d) => d.assumptions.splice(i, 1))}>
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="btn secondary" onClick={() => ctx.edit(["assumptions"], (d) => d.assumptions.push({ id: uid("s"), label: "", value: "" }))}>
        <Plus size={14} /> Agregar supuesto
      </button>
      <IssuesFor issues={ctx.issues} path="financial" />
      <IssuesFor issues={ctx.issues} path="economic" />
      <IssuesFor issues={ctx.issues} path="costs" />
      <IssuesFor issues={ctx.issues} path="benefits" />
    </>
  );
}

/* ---------------- 9. Riesgos, regulación y ODS ---------------- */
export function ContextStep({ ctx }: { ctx: BuilderCtx }) {
  const p = ctx.p,
    r = p.regulation;
  const regText: { key: Exclude<keyof typeof r, "failure">; label: string }[] = [
    { key: "externalities", label: "Externalidades" },
    { key: "existing", label: "Regulación existente" },
    { key: "tariffs", label: "Tarifas" },
    { key: "subsidies", label: "Subsidios" },
    { key: "competition", label: "Competencia" },
    { key: "restrictions", label: "Restricciones" },
    { key: "intervention", label: "Intervención pública" },
  ];
  return (
    <>
      <h4>Riesgos</h4>
      <table className="pb-table">
        <thead>
          <tr>
            <th>Riesgo</th>
            <th>Probabilidad</th>
            <th>Impacto</th>
            <th>Mitigación</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {p.risks.map((k, i) => (
            <tr key={k.id}>
              <td>
                <input aria-label="Riesgo" value={k.name} onChange={(e) => ctx.edit([`risks.${k.id}`], (d) => (d.risks[i].name = e.target.value))} />
              </td>
              {(["probability", "impact"] as const).map((f) => (
                <td key={f}>
                  <select aria-label={f === "probability" ? "Probabilidad" : "Impacto"} value={k[f] ?? ""} onChange={(e) => ctx.edit([`risks.${k.id}`], (d) => (d.risks[i][f] = (e.target.value || null) as RiskLevel | null))}>
                    <option value="">—</option>
                    {levels.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </td>
              ))}
              <td>
                <input aria-label="Mitigación" value={k.mitigation} onChange={(e) => ctx.edit([`risks.${k.id}`], (d) => (d.risks[i].mitigation = e.target.value))} />
              </td>
              <td>
                <button type="button" className="icon-btn" aria-label="Quitar riesgo" onClick={() => ctx.edit(["risks"], (d) => d.risks.splice(i, 1))}>
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="btn secondary" onClick={() => ctx.edit(["risks"], (d) => d.risks.push({ id: uid("r"), name: "", probability: null, impact: null, mitigation: "" }))}>
        <Plus size={14} /> Agregar riesgo
      </button>
      <h4>
        Regulación <LearnLink concept="regulacion">Fallas de mercado</LearnLink>
      </h4>
      <label className="field pb-field">
        <span>
          Falla de mercado principal <EvidenceBadge ev={p.evidence["regulation.failure"]} />
        </span>
        <select value={r.failure ?? ""} onChange={(e) => ctx.edit(["regulation.failure"], (d) => (d.regulation.failure = (e.target.value || null) as FailureType | null))}>
          <option value="">No identificada</option>
          {failures.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
      </label>
      <div className="pb-grid">
        {regText.map((f) => (
          <TextField key={f.key} ctx={ctx} path={"regulation." + f.key} label={f.label} value={r[f.key]} set={(d, v) => (d.regulation[f.key] = v)} />
        ))}
      </div>
      <h4>ODS</h4>
      <label className="checkline">
        <input type="checkbox" checked={p.sdgs.playerIdentifies} onChange={(e) => ctx.edit(["sdgs"], (d) => (d.sdgs.playerIdentifies = e.target.checked))} />
        El jugador deberá identificar los ODS (los que marques aquí serán la respuesta esperada, no se mostrarán preseleccionados).
      </label>
      <div className="pb-sdgs" role="group" aria-label="ODS sugeridos por el creador">
        {sdgList.map((s) => (
          <label key={s.id} className={"pb-sdg " + (p.sdgs.suggested.includes(s.id) ? "on" : "")}>
            <input type="checkbox" checked={p.sdgs.suggested.includes(s.id)} onChange={(e) => ctx.edit(["sdgs"], (d) => (d.sdgs.suggested = e.target.checked ? [...d.sdgs.suggested, s.id].sort((a, b) => a - b) : d.sdgs.suggested.filter((x) => x !== s.id)))} />
            <strong>{s.id}</strong> {s.name}
          </label>
        ))}
      </div>
      <IssuesFor issues={ctx.issues} path="risks" exact />
      <IssuesFor issues={ctx.issues} path="regulation" />
      <IssuesFor issues={ctx.issues} path="sdgs" />
    </>
  );
}

import type { NormalizedProject } from "./types";

/**
 * Validation of a NormalizedProject.
 *  - error: prevents generating a mission (the engine would not have what it needs).
 *  - advertencia: the mission can be generated; the gap is explained and a documented default is used.
 * Nothing is corrected automatically: messages describe the problem, never the answer.
 */
export type IssueLevel = "error" | "advertencia";
export type BuilderSection =
  | "general"
  | "problema"
  | "actores"
  | "objetivos"
  | "alternativas"
  | "cadena"
  | "impactos"
  | "finanzas"
  | "riesgos"
  | "regulacion"
  | "ods";
export interface Issue {
  level: IssueLevel;
  section: BuilderSection;
  path: string;
  message: string;
}
const blank = (s?: string | null) => !s || !s.trim();
const num = (v: number | null | undefined): v is number => typeof v === "number" && Number.isFinite(v);
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

const solutionVerbs = ["construir", "comprar", "crear", "implementar", "instalar", "adquirir", "dotar", "ampliar", "disenar", "realizar", "hacer", "contratar", "montar", "desarrollar", "fortalecer", "mejorar", "aumentar", "reducir", "garantizar"];
/** A problem written as a solution: starts with an action verb or states the absence of a specific product. */
export function looksLikeSolution(text: string) {
  const t = norm(text);
  if (!t) return false;
  const first = t.split(/\s+/)[0];
  if (solutionVerbs.includes(first) || /^(la |el )?(construccion|compra|creacion|implementacion|instalacion|adquisicion) de /.test(t)) return true;
  return /^(falta|ausencia|carencia|no hay|no existe|inexistencia) (de )?(un|una|el|la|nuevo|nueva)?\s*(planta|hospital|puente|via|carretera|edificio|sistema|software|bus|buses|tanque|centro|colegio|escuela|equipo|proyecto|obra)/.test(t);
}
const effectMarkers = ["perdida de", "perdidas de", "aumento de enfermedades", "menor bienestar", "deterioro", "enfermedades", "muertes", "mortalidad", "pobreza", "desempleo", "migracion", "baja calidad de vida", "menor productividad", "menor competitividad", "exclusion"];
const causeMarkers = ["insuficiente", "deficiente", "baja capacidad", "escasa", "escaso", "debil", "inadecuado", "inadecuada", "falta de mantenimiento", "desactualizado", "limitado", "limitada"];
/** Heuristic used only to warn: an effect written in the causes list, or a cause in the effects list. */
export const looksLikeEffect = (text: string) => effectMarkers.some((m) => norm(text).includes(m));
export const looksLikeCause = (text: string) => causeMarkers.some((m) => norm(text).includes(m));

export function validateProject(p: NormalizedProject): Issue[] {
  const out: Issue[] = [];
  const err = (section: BuilderSection, path: string, message: string) => out.push({ level: "error", section, path, message });
  const warn = (section: BuilderSection, path: string, message: string) => out.push({ level: "advertencia", section, path, message });

  if (blank(p.title)) err("general", "title", "El proyecto necesita un nombre.");
  if (num(p.horizon) && (p.horizon < 1 || p.horizon > 50)) err("general", "horizon", "Horizonte inválido: usa entre 1 y 50 años.");
  if (!num(p.horizon)) warn("general", "horizon", "No definiste horizonte: se usará la vida útil de cada alternativa.");

  if (blank(p.problem)) err("problema", "problem", "El problema central está vacío.");
  else if (looksLikeSolution(p.problem))
    warn("problema", "problem", "Este problema parece formulado como una solución. Intenta expresar primero la situación negativa que quieres resolver.");
  const causes = p.causes.filter((c) => !blank(c.text)),
    effects = p.problemEffects.filter((e) => !blank(e.text));
  if (causes.length < 2) err("problema", "causes", "Registra al menos dos causas del problema (una directa y otra directa o indirecta).");
  if (effects.length < 2) err("problema", "problemEffects", "Registra al menos dos efectos del problema.");
  causes.forEach((c, i) => {
    if (looksLikeSolution(c.text)) warn("problema", `causes.${c.id}`, `La causa ${i + 1} parece una solución o un producto faltante; describe la condición que genera el problema.`);
    else if (looksLikeEffect(c.text)) warn("problema", `causes.${c.id}`, `La causa ${i + 1} parece corresponder más a un efecto del problema.`);
  });
  effects.forEach((e, i) => {
    if (looksLikeCause(e.text) && !looksLikeEffect(e.text)) warn("problema", `problemEffects.${e.id}`, `El efecto ${i + 1} parece corresponder más a una causa.`);
  });
  const dupes = [...causes, ...effects].map((x) => norm(x.text));
  if (new Set(dupes).size < dupes.length) warn("problema", "causes", "Hay causas o efectos repetidos.");

  if (p.actors.filter((a) => !blank(a.name)).length < 2) err("actores", "actors", "Registra al menos dos actores involucrados.");
  const pop = p.population;
  if (!num(pop.affected) || pop.affected <= 0) err("actores", "population.affected", "Indica la población afectada (cantidad mayor que cero).");
  if (!num(pop.target) || pop.target <= 0) err("actores", "population.target", "Indica la población objetivo.");
  if (num(pop.affected) && num(pop.target) && pop.target > pop.affected) err("actores", "population.target", "La población objetivo no puede superar la población afectada.");
  if (num(pop.total) && num(pop.affected) && pop.affected > pop.total) err("actores", "population.total", "La población afectada no puede superar la población total.");

  if (blank(p.generalObjective)) err("objetivos", "generalObjective", "Falta el objetivo general.");
  else if (looksLikeSolution(p.generalObjective) && /^(construir|comprar|instalar|adquirir)/.test(norm(p.generalObjective)))
    warn("objetivos", "generalObjective", "El objetivo general describe un producto. Un objetivo expresa la situación deseada: el problema resuelto.");
  const specific = p.specificObjectives.filter((o) => !blank(o.text));
  if (!specific.length) err("objetivos", "specificObjectives", "Registra al menos un objetivo específico.");
  specific.forEach((o) => {
    const i = p.specificObjectives.indexOf(o) + 1;
    if (!o.causeId || !causes.some((c) => c.id === o.causeId))
      warn("objetivos", `specificObjectives.${o.id}`, `El objetivo específico ${i} parece no responder a ninguna causa identificada.`);
  });

  const alts = p.alternatives;
  if (alts.length < 2) err("alternativas", "alternatives", "Crea al menos dos alternativas para poder comparar.");
  if (alts.length > 4) err("alternativas", "alternatives", "El simulador compara hasta cuatro alternativas.");
  alts.forEach((a, i) => {
    const n = `Alternativa ${i + 1}${a.name ? ` («${a.name}»)` : ""}`,
      path = `alternatives.${a.id}`;
    if (blank(a.name)) err("alternativas", path + ".name", `La alternativa ${i + 1} no tiene nombre.`);
    if (!num(a.investment) || a.investment <= 0) err("alternativas", path + ".investment", `${n}: falta la inversión.`);
    if (!num(a.om) || a.om < 0) err("alternativas", path + ".om", `${n}: falta el costo anual de operación y mantenimiento.`);
    if (!num(a.months) || a.months <= 0) err("alternativas", path + ".months", `${n}: falta la duración de la obra (meses).`);
    if (!num(a.life) || a.life <= 0) err("alternativas", path + ".life", `${n}: falta la vida útil.`);
    else if (num(p.horizon) && a.life < p.horizon) warn("alternativas", path + ".life", `${n}: la vida útil es menor que el horizonte; habrá que prever reposición.`);
    if (!num(a.coverage) || a.coverage <= 0 || a.coverage > 1) err("alternativas", path + ".coverage", `${n}: la cobertura debe estar entre 1 % y 100 %.`);
    if (!num(a.residual)) warn("alternativas", path + ".residual", `${n}: no definiste valor residual; se calculará con la vida útil de las obras civiles.`);
    if (!num(a.socialBenefit)) warn("alternativas", path + ".socialBenefit", `${n}: sin beneficio social anual estimado; el flujo económico dependerá de los impactos valorados.`);
    if (!num(a.revenue)) warn("alternativas", path + ".revenue", `${n}: sin ingresos anuales; se asumen 0 en el flujo financiero.`);
    if (!a.causeIds.length) warn("alternativas", path + ".causeIds", `${n}: no indica qué causas atiende.`);
    if (blank(a.tradeoff)) warn("alternativas", path + ".tradeoff", `${n}: describe qué ganas y qué sacrificas (trade-off).`);
  });
  const investments = alts.map((a) => a.investment).filter(num);
  if (num(p.financial.budget) && investments.length && !investments.some((v) => v < p.financial.budget! * 1.35))
    err("finanzas", "financial.budget", "Flujo imposible: ninguna alternativa se puede financiar con el presupuesto disponible.");
  if (alts.length >= 2 && alts.every((a) => (a.revenue ?? 0) <= 0 && (a.socialBenefit ?? 0) <= 0) && !p.impacts.some((i) => num(i.annualValue) && i.annualValue! > 0))
    warn("finanzas", "alternatives", "Ninguna alternativa tiene ingresos ni beneficios: todos los VPN serán negativos.");

  if (!p.valueChain.products.filter((x) => !blank(x)).length) warn("cadena", "valueChain.products", "La cadena de valor no tiene productos; se usará «<alternativa> en operación».");
  const itemIds = new Set(p.impacts.map((i) => i.id));
  p.impacts.forEach((im, i) => {
    if (blank(im.text)) err("impactos", `impacts.${im.id}`, `El efecto o impacto ${i + 1} está vacío.`);
    if (im.overlapWith && !itemIds.has(im.overlapWith)) err("impactos", `impacts.${im.id}.overlapWith`, `El impacto ${i + 1} dice duplicar otro que no existe.`);
    if (im.kind === "impacto" && blank(im.group)) warn("impactos", `impacts.${im.id}.group`, `El impacto «${im.text}» no indica a qué grupo afecta.`);
    if (im.method && !im.type) warn("impactos", `impacts.${im.id}.type`, `El impacto «${im.text}» tiene método pero no tipo de cambio en bienestar.`);
  });
  if (!p.impacts.some((i) => i.kind === "impacto")) warn("impactos", "impacts", "No registraste impactos: el módulo de valoración no se incluirá.");
  p.costs.forEach((c) => {
    if (!num(c.amount)) warn("finanzas", `costs.${c.id}`, `Costo incompleto: «${c.label || "sin nombre"}» no tiene monto.`);
  });
  p.benefits.forEach((b) => {
    if (!num(b.amount)) warn("finanzas", `benefits.${b.id}`, `Beneficio incompleto: «${b.label || "sin nombre"}» no tiene monto.`);
  });
  if (num(p.financial.rate) && (p.financial.rate <= 0 || p.financial.rate > 0.5)) err("finanzas", "financial.rate", "Tasa financiera inválida: usa un valor entre 0 % y 50 %.");
  if (!num(p.financial.rate)) warn("finanzas", "financial.rate", "Sin tasa financiera: se usará la del simulador (12 %).");
  if (num(p.economic.socialRate) && (p.economic.socialRate <= 0 || p.economic.socialRate > 0.3)) err("finanzas", "economic.socialRate", "Tasa social inválida.");
  if (!num(p.economic.socialRate)) warn("finanzas", "economic.socialRate", "Sin tasa social: se usará 9 % (DNP, Resolución 1092 de 2022).");
  if (!num(p.financial.budget)) warn("finanzas", "financial.budget", "Sin presupuesto: se estimará como 1,3 veces la mayor inversión.");

  if (!p.risks.length) warn("riesgos", "risks", "No registraste riesgos: se usarán riesgos genéricos (técnico, ambiental y social).");
  if (!p.regulation.failure) warn("regulacion", "regulation.failure", "No indicaste falla de mercado: el laboratorio regulatorio partirá de «Ninguna falla suficiente».");
  if (!p.sdgs.suggested.length) warn("ods", "sdgs", "No relacionaste ODS: el jugador los elegirá sin respuesta esperada.");
  return out;
}
export const errorsOf = (issues: Issue[]) => issues.filter((i) => i.level === "error");
export const canGenerate = (p: NormalizedProject) => errorsOf(validateProject(p)).length === 0;

/**
 * Completeness based on the fields the mission really needs (not an arbitrary count).
 * Each check has a weight; required fields weigh more than enrichments.
 */
export function completeness(p: NormalizedProject) {
  const altsOk = p.alternatives.length >= 2 && p.alternatives.every((a) => num(a.investment) && num(a.om) && num(a.months) && num(a.life) && num(a.coverage) && !blank(a.name));
  const checks: { label: string; ok: boolean; weight: number; section: BuilderSection }[] = [
    { label: "Nombre y descripción", ok: !blank(p.title) && !blank(p.description), weight: 4, section: "general" },
    { label: "Problema central", ok: !blank(p.problem), weight: 10, section: "problema" },
    { label: "Causas", ok: p.causes.filter((c) => !blank(c.text)).length >= 2, weight: 8, section: "problema" },
    { label: "Efectos", ok: p.problemEffects.filter((c) => !blank(c.text)).length >= 2, weight: 8, section: "problema" },
    { label: "Actores", ok: p.actors.filter((a) => !blank(a.name)).length >= 2, weight: 5, section: "actores" },
    { label: "Población", ok: num(p.population.affected) && num(p.population.target), weight: 6, section: "actores" },
    { label: "Objetivo general", ok: !blank(p.generalObjective), weight: 8, section: "objetivos" },
    { label: "Objetivos específicos", ok: p.specificObjectives.some((o) => !blank(o.text) && !!o.causeId), weight: 6, section: "objetivos" },
    { label: "Alternativas completas", ok: altsOk, weight: 15, section: "alternativas" },
    { label: "Cadena de valor", ok: p.valueChain.activities.length > 0 && p.valueChain.products.length > 0, weight: 5, section: "cadena" },
    { label: "Efectos e impactos", ok: p.impacts.some((i) => i.kind === "impacto"), weight: 6, section: "impactos" },
    { label: "Valoración de impactos", ok: p.impacts.some((i) => !!i.method), weight: 3, section: "impactos" },
    { label: "Información financiera", ok: num(p.financial.rate) && num(p.financial.budget) && p.alternatives.some((a) => num(a.residual)), weight: 5, section: "finanzas" },
    { label: "Información económica", ok: num(p.economic.socialRate) && p.alternatives.some((a) => num(a.socialBenefit)), weight: 4, section: "finanzas" },
    { label: "Riesgos", ok: p.risks.length > 0, weight: 3, section: "riesgos" },
    { label: "Regulación", ok: !!p.regulation.failure, weight: 2, section: "regulacion" },
    { label: "ODS", ok: p.sdgs.suggested.length > 0, weight: 2, section: "ods" },
  ];
  const total = checks.reduce((n, c) => n + c.weight, 0),
    got = checks.reduce((n, c) => n + (c.ok ? c.weight : 0), 0);
  return { percent: Math.round((100 * got) / total), checks };
}

/** Average reliability of imported data (manual data counts as alta). */
export function projectConfidence(p: NormalizedProject) {
  const values = Object.values(p.evidence);
  if (!values.length) return p.source.type === "manual" ? "alta" : "baja";
  const score = values.reduce((n, e) => n + (e.reviewed ? 3 : e.confidence === "alta" ? 3 : e.confidence === "media" ? 2 : 1), 0) / values.length;
  return score >= 2.5 ? "alta" : score >= 1.7 ? "media" : "baja";
}

/** «Revisar mi proyecto»: checklist by element, with the level of preparation. Never proposes the answer. */
export function reviewProject(p: NormalizedProject) {
  const issues = validateProject(p);
  const groups: { label: string; section: BuilderSection; paths: string[] }[] = [
    { label: "Problema", section: "problema", paths: ["problem"] },
    { label: "Causas", section: "problema", paths: ["causes"] },
    { label: "Efectos", section: "problema", paths: ["problemEffects"] },
    { label: "Actores y población", section: "actores", paths: ["actors", "population"] },
    { label: "Objetivos", section: "objetivos", paths: ["generalObjective", "specificObjectives"] },
    ...p.alternatives.map((a, i) => ({ label: `Alternativa ${i + 1}${a.name ? ` · ${a.name}` : ""}`, section: "alternativas" as const, paths: [`alternatives.${a.id}`] })),
    { label: "Cadena de valor", section: "cadena", paths: ["valueChain"] },
    { label: "Impactos", section: "impactos", paths: ["impacts"] },
    { label: "Costos y beneficios", section: "finanzas", paths: ["costs", "benefits", "financial", "economic"] },
    { label: "Riesgos", section: "riesgos", paths: ["risks"] },
    { label: "Regulación", section: "regulacion", paths: ["regulation"] },
    { label: "ODS", section: "ods", paths: ["sdgs"] },
  ];
  const items = groups.map((g) => {
    const mine = issues.filter((i) => g.paths.some((path) => i.path === path || i.path.startsWith(path + ".")));
    return { ...g, status: mine.some((i) => i.level === "error") ? ("error" as const) : mine.length ? ("revisar" as const) : ("ok" as const), messages: mine.map((i) => i.message) };
  });
  const pending = items.filter((i) => i.status !== "ok").length,
    blocking = items.filter((i) => i.status === "error").length;
  return {
    items,
    ready: blocking === 0,
    label: blocking ? `Faltan datos en ${blocking} elemento(s) para simular` : pending ? `Recomendamos revisar ${pending} elemento(s)` : "Listo para simular",
  };
}

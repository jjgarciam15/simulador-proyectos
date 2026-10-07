import type { GameState, Scenario } from "./types";
import { scenarioById } from "../data/scenarios";
import { random } from "./finance";
import { stableShuffle } from "./shuffle";
import {
  determinantName,
  generatorName,
  motiveName,
  soilName,
  soilRequirement,
  territorialProfiles,
  type Determinant,
  type Generator,
  type Motive,
  type SiteProfile,
  type Soil,
} from "../data/ley388";

/**
 * Ordenamiento territorial con la Ley 388 de 1997: three puzzles in the Regulation stage that tie each project
 * (and each alternative) to the law: where it can be built, how the land is acquired and who keeps the increase in
 * land value. Answers change money, time and risks of the game, and they are graded in the final score.
 */
export interface TerritoryAnswers {
  /** Alternative the answers were given for: a new alternative needs a new analysis. */
  alternative: string;
  encaje?: { instrument: string; soil: string; requirement: string; determinant: string; execution: string };
  predios?: { route: string[]; legal: string };
  plusvalia?: { generator: string; amount: number | null; destination: string };
  /** One-time effects already applied (money and time), so confirming again never repeats them. */
  applied?: { encaje?: boolean; predios?: boolean; plusvalia?: boolean };
}
export type TerritoryPuzzle = "encaje" | "predios" | "plusvalia";
export type TerritoryAction =
  | { type: "territory"; puzzle: "encaje"; answers: NonNullable<TerritoryAnswers["encaje"]> }
  | { type: "territory"; puzzle: "predios"; answers: NonNullable<TerritoryAnswers["predios"]> }
  | { type: "territory"; puzzle: "plusvalia"; answers: NonNullable<TerritoryAnswers["plusvalia"]> };

/** Games created from 3.0 on play the territorial puzzles; older saves keep their previous rules and score. */
export const territoryActive = (g: GameState) => g.v2?.territoryRules === 1;

/* ---------------- Territorial profile of the project ---------------- */
export interface ProjectTerritory {
  motive: Motive;
  determinant: Determinant;
  context: string;
  site: SiteProfile;
  /** Simulated: generated for a project created in the Project Builder. */
  generated: boolean;
}
function generatedProfile(s: Scenario, altIndex: number): ProjectTerritory {
  const text = (s.sector + " " + s.title).toLowerCase(),
    privado = s.role === "privado";
  const motive: Motive = privado
    ? null
    : /agua|acueduct|alcantarill|energ|residu|aseo|gas/.test(text)
      ? "d"
      : /v[ií]a|transport|movilidad|carreter|puente/.test(text)
        ? "e"
        : /vivienda|h[aá]bitat|reasent/.test(text)
          ? "b"
          : /parque|espacio p[uú]blico|renovaci/.test(text)
            ? "c"
            : "a";
  const determinant: Determinant = /aliment|agr[ií]col|cultivo/.test(text)
    ? "alimentos"
    : /patrimon|hist[oó]ric/.test(text)
      ? "patrimonio"
      : /v[ií]a|transport|energ|servicio/.test(text)
        ? "infraestructura"
        : "ambiental";
  const rank = [...s.alternatives].sort((a, b) => b.capex - a.capex).findIndex((a) => a.id === s.alternatives[altIndex]?.id);
  const site: SiteProfile =
    rank === 0
      ? { soil: "expansion", plots: 8, generator: privado ? "expansion" : "obra", site: "Terreno de borde que el plan habilitará para uso urbano en su vigencia, todavía sin redes; la obra valoriza los predios vecinos." }
      : rank === 1
        ? { soil: "urbano", plots: 4, generator: "ninguno", site: "Cuatro predios dentro del perímetro urbano, con vías y redes de servicios." }
        : rank === s.alternatives.length - 1
          ? { soil: "urbano", plots: 0, generator: "ninguno", site: "Instalaciones existentes dentro del perímetro urbano." }
          : { soil: "rural", plots: 2, generator: "ninguno", site: "Dos predios fuera del perímetro urbano, en zona de usos agropecuarios." };
  return { motive, determinant, context: "Perfil territorial de referencia generado por el simulador para tu proyecto (datos simulados).", site, generated: true };
}
export function projectTerritory(g: GameState, alternative = g.alternative): ProjectTerritory {
  const s = scenarioById(g.scenarioId),
    index = Math.max(0, s.alternatives.findIndex((a) => a.id === alternative)),
    p = territorialProfiles[s.id];
  if (!p) return generatedProfile(s, index);
  return { motive: p.motive, determinant: p.determinant, context: p.context, site: p.sites[index % 4], generated: false };
}
/** Art. 9: the planning instrument depends on the municipality's population. */
export function planInstrument(population: number) {
  return population > 100000 ? "pot" : population >= 30000 ? "pbot" : "eot";
}

/* ---------------- Puzzle 1 · Encaje en el ordenamiento ---------------- */
export interface Choice {
  id: string;
  text: string;
}
export interface Question {
  id: string;
  prompt: string;
  options: Choice[];
  answer: string;
  /** Why the answer is right (shown as feedback). */
  why: string;
}
const soils: Soil[] = ["urbano", "expansion", "rural", "suburbano", "proteccion"];
export function encajeQuestions(g: GameState): Question[] {
  const s = scenarioById(g.scenarioId),
    t = projectTerritory(g),
    mix = (key: string, list: Choice[]) => stableShuffle(g.seed + key, list);
  return [
    {
      id: "instrument",
      prompt: `El municipio del proyecto tiene ${s.population.toLocaleString("es-CO")} habitantes. ¿Qué instrumento de ordenamiento lo rige?`,
      options: mix("ins", [
        { id: "pot", text: "Plan de Ordenamiento Territorial (POT)" },
        { id: "pbot", text: "Plan Básico de Ordenamiento Territorial (PBOT)" },
        { id: "eot", text: "Esquema de Ordenamiento Territorial (EOT)" },
        { id: "desarrollo", text: "El plan de desarrollo del alcalde" },
        { id: "parcial", text: "Un plan parcial" },
      ]),
      answer: planInstrument(s.population),
      why: "Art. 9: POT con más de 100.000 habitantes, PBOT entre 30.000 y 100.000 y EOT con menos de 30.000. El plan de desarrollo y los planes parciales no reemplazan al plan de ordenamiento.",
    },
    {
      id: "soil",
      prompt: `Sitio de tu alternativa: «${t.site.site}» ¿Qué clase de suelo es?`,
      options: mix("soil", soils.map((id) => ({ id, text: soilName[id] }))),
      answer: t.site.soil,
      why: "Arts. 30 a 35: urbano (con redes, dentro del perímetro), expansión (se habilitará para uso urbano), rural (usos agropecuarios), suburbano (mezcla, con restricciones y autoabastecimiento) y protección (urbanización restringida).",
    },
    {
      id: "requirement",
      prompt: "Según la clase de suelo del sitio, ¿qué debe hacer el proyecto antes de construir?",
      options: mix("req", soils.map((id) => ({ id, text: soilRequirement[id] }))),
      answer: t.site.soil,
      why: `${soilName[t.site.soil]}: ${soilRequirement[t.site.soil].toLowerCase()}.`,
    },
    {
      id: "determinant",
      prompt: `${t.context} ¿Qué determinante de superior jerarquía (art. 10) debes respetar primero?`,
      options: mix("det", [
        ...(Object.keys(determinantName) as Determinant[]).map((id) => ({ id, text: determinantName[id] })),
        { id: "contratista", text: "La programación propuesta por el contratista de obra" },
      ]),
      answer: t.determinant,
      why: "El art. 10 ordena las determinantes que el plan de ordenamiento no puede contradecir; la conveniencia del contratista no es una de ellas.",
    },
    {
      id: "execution",
      prompt: "¿Qué instrumento conecta las obras del plan de ordenamiento con el plan de inversiones del período de gobierno?",
      options: mix("exe", [
        { id: "programa", text: "El programa de ejecución (art. 18)" },
        { id: "parcial", text: "El plan parcial" },
        { id: "licencia", text: "La licencia de construcción" },
        { id: "valorizacion", text: "La contribución de valorización" },
        { id: "avaluo", text: "El avalúo comercial" },
      ]),
      answer: "programa",
      why: "Art. 18: el programa de ejecución define con carácter obligatorio las actuaciones del período y se integra al plan de inversiones del plan de desarrollo.",
    },
  ];
}
/** Each question is worth 20 points. */
export function encajeScore(g: GameState, a = g.v2?.territory?.encaje) {
  if (!a) return 0;
  const qs = encajeQuestions(g);
  return qs.reduce((n, q) => n + (a[q.id as keyof typeof a] === q.answer ? 20 : 0), 0);
}

/* ---------------- Puzzle 2 · Ruta de adquisición de predios ---------------- */
export interface RouteStep {
  id: string;
  text: string;
}
const publicRoute: RouteStep[] = [
  { id: "motivo", text: "Verificar que el proyecto corresponde a un motivo de utilidad pública (art. 58)" },
  { id: "anuncio", text: "Anunciar el proyecto para descontar el mayor valor que genere el anuncio (art. 61, par. 1)" },
  { id: "avaluo", text: "Obtener el avalúo comercial del predio" },
  { id: "oferta", text: "Notificar la oferta de compra al propietario" },
  { id: "negociacion", text: "Negociar la enajenación voluntaria: hasta 30 días hábiles después de la oferta" },
  { id: "expropiacion", text: "Si no hay acuerdo: expropiación judicial, o administrativa si hay urgencia declarada" },
];
const privateRoute: RouteStep[] = [
  { id: "uso", text: "Verificar en el plan de ordenamiento que el uso del proyecto está permitido en el sitio" },
  { id: "avaluo", text: "Obtener el avalúo comercial del predio" },
  { id: "directa", text: "Negociar directamente el precio con el propietario" },
  { id: "promesa", text: "Firmar la promesa de compraventa" },
  { id: "escritura", text: "Otorgar la escritura pública y registrarla en la oficina de instrumentos públicos" },
];
const routeTraps: RouteStep[] = [
  { id: "ocupar", text: "Ocupar el predio para iniciar la obra y pagar después" },
  { id: "presupuesto", text: "Fijar el precio según el presupuesto disponible, sin avalúo" },
  { id: "expropiar-ya", text: "Iniciar la expropiación antes de hacer la oferta de compra" },
];
export function routeSteps(g: GameState) {
  const t = projectTerritory(g),
    correct = t.motive ? publicRoute : privateRoute,
    traps = t.motive ? routeTraps : [{ id: "expropiacion-privada", text: "Solicitar la expropiación del predio por utilidad pública" }, ...routeTraps.slice(0, 2)];
  return { correct: correct.map((x) => x.id), cards: stableShuffle(g.seed + "route", [...correct, ...traps]) };
}
export function legalQuestion(g: GameState): Question {
  const t = projectTerritory(g),
    mix = (list: Choice[]) => stableShuffle(g.seed + "legal", list);
  return t.motive
    ? {
        id: "legal",
        prompt: "Si el propietario no acepta y la obra no puede esperar, ¿qué criterio permite declarar la urgencia para expropiar por vía administrativa (art. 65)?",
        options: mix([
          { id: "precios", text: "Evitar una elevación excesiva de los precios de los inmuebles" },
          { id: "periodo", text: "Inaugurar la obra antes de que termine el período del alcalde" },
          { id: "juridica", text: "Que el propietario sea una persona jurídica" },
          { id: "rural", text: "Que el predio esté en suelo rural" },
          { id: "presupuesto", text: "Que el presupuesto de la obra ya esté aprobado" },
        ]),
        answer: "precios",
        why: "Art. 65: la urgencia se sustenta en criterios como evitar la elevación excesiva de precios, el carácter inaplazable de la solución, las consecuencias lesivas de la demora o la prioridad en los planes.",
      }
    : {
        id: "legal",
        prompt: "El dueño del lote que necesita tu empresa no quiere vender. ¿Puede la empresa pedir su expropiación?",
        options: mix([
          { id: "no", text: "No: solo las entidades públicas facultadas pueden adquirir por utilidad pública (art. 59)" },
          { id: "empleo", text: "Sí, si el proyecto genera empleo" },
          { id: "avaluo", text: "Sí, si paga el avalúo comercial" },
          { id: "concejo", text: "Sí, si el Concejo lo autoriza por acuerdo" },
          { id: "silencio", text: "Sí, si el propietario no responde en 30 días" },
        ]),
        answer: "no",
        why: "Arts. 58 y 59: los motivos de utilidad pública los invocan la Nación, las entidades territoriales y las entidades facultadas. Un privado negocia o busca otro sitio.",
      };
}
/** 70 % the order of the route (position by position), 30 % the legal question. */
export function prediosScore(g: GameState, a = g.v2?.territory?.predios) {
  if (!a) return 0;
  const { correct } = routeSteps(g),
    order = correct.filter((id, i) => a.route[i] === id).length / correct.length,
    extra = a.route.length > correct.length ? 0.15 : 0;
  return Math.round(Math.max(0, 70 * order - 70 * extra) + (a.legal === legalQuestion(g).answer ? 30 : 0));
}

/* ---------------- Puzzle 3 · Participación en la plusvalía ---------------- */
export interface PlusvaliaCase {
  /** Square metres that receive the higher value. */
  area: number;
  /** COP per m² before and after the urban action. */
  before: number;
  after: number;
  /** Rate fixed by the municipal council (30 %–50 %). */
  rate: number;
  /** Participation in M COP (the right liquidation). */
  amount: number;
}
/** Simulated case, fixed by the game code: the participation is about 2,5 %–5 % of the mission budget. */
export function plusvaliaCase(g: GameState): PlusvaliaCase {
  const s = scenarioById(g.scenarioId),
    rate = [30, 35, 40, 45, 50][Math.floor(random(g.seed, "pv-rate") * 5)],
    delta = 40000 + 5000 * Math.floor(random(g.seed, "pv-delta") * 17),
    before = 80000 + 10000 * Math.floor(random(g.seed, "pv-before") * 23),
    share = 0.025 + 0.025 * random(g.seed, "pv-share"),
    area = Math.max(1000, Math.round((share * s.budget * 1e6) / (delta * (rate / 100)) / 1000) * 1000),
    amount = Math.round(((delta * area * rate) / 100 / 1e6) * 10) / 10;
  return { area, before, after: before + delta, rate, amount };
}
const generators: Generator[] = ["expansion", "uso", "aprovechamiento", "obra", "ninguno"];
export function generatorQuestion(g: GameState): Question {
  const t = projectTerritory(g);
  return {
    id: "generator",
    prompt: `Sitio de tu alternativa: «${t.site.site}» ¿Hay un hecho generador de plusvalía?`,
    options: stableShuffle(g.seed + "gen", generators.map((id) => ({ id, text: generatorName[id] }))),
    answer: t.site.generator,
    why: "Art. 74: incorporar suelo a expansión o suburbano, cambiar usos o autorizar más aprovechamiento; art. 87: obras públicas previstas en el plan y no financiadas con valorización.",
  };
}
export function destinationQuestion(g: GameState): Question {
  const t = projectTerritory(g),
    mix = (list: Choice[]) => stableShuffle(g.seed + "dest", list);
  return t.motive
    ? {
        id: "destination",
        prompt: "El municipio recauda la participación. ¿En qué puede usarla?",
        options: mix([
          { id: "obra", text: "Infraestructura vial, servicios públicos o equipamientos como los del proyecto (art. 85)" },
          { id: "funcionamiento", text: "Gastos de funcionamiento de la alcaldía" },
          { id: "nomina", text: "Bonificaciones del equipo que formuló el proyecto" },
          { id: "deuda", text: "Pagar deuda general del municipio sin relación con el ordenamiento" },
          { id: "publicidad", text: "Publicidad institucional de la obra" },
        ]),
        answer: "obra",
        why: "Art. 85: la destinación es específica (vivienda de interés social, infraestructura y servicios, espacio público, transporte masivo, renovación urbana, pago de predios por utilidad pública, patrimonio).",
      }
    : {
        id: "destination",
        prompt: "¿Cuándo debe pagar tu empresa la participación en la plusvalía?",
        options: mix([
          { id: "licencia", text: "Al solicitar la licencia de urbanización o construcción, o al cambiar el uso o transferir el predio (art. 83)" },
          { id: "final", text: "Cuando termine la obra y empiece a vender" },
          { id: "nunca", text: "Nunca: las empresas privadas están exentas" },
          { id: "alcalde", text: "Cuando el alcalde lo decida, sin acto de liquidación" },
          { id: "predial", text: "Cada año, junto con el impuesto predial" },
        ]),
        answer: "licencia",
        why: "Art. 83: la participación es exigible al solicitar licencia, al cambiar efectivamente el uso, al transferir el dominio o al adquirir títulos de derechos adicionales.",
      };
}
/** The liquidation is right within 1 % of the exact value. */
export const amountOk = (g: GameState, amount: number | null | undefined) => {
  const c = plusvaliaCase(g);
  return typeof amount === "number" && Number.isFinite(amount) && Math.abs(amount - c.amount) <= Math.max(0.1, c.amount * 0.01);
};
/** Without a generator, only identifying that is graded. With one: 40 % generator, 35 % liquidation, 25 % destination. */
export function plusvaliaScore(g: GameState, a = g.v2?.territory?.plusvalia) {
  if (!a) return 0;
  const truth = projectTerritory(g).site.generator;
  if (truth === "ninguno") return a.generator === "ninguno" ? 100 : 0;
  if (a.generator !== truth) return 0;
  return 40 + (amountOk(g, a.amount) ? 35 : 0) + (a.destination === destinationQuestion(g).answer ? 25 : 0);
}

/* ---------------- State, quotes and score ---------------- */
/** Answers that still apply: given for the alternative currently selected. */
export function currentTerritory(g: GameState) {
  const t = g.v2?.territory;
  return t && t.alternative === g.alternative ? t : undefined;
}
export function territoryComplete(g: GameState) {
  const t = currentTerritory(g);
  return !!t?.encaje && !!t.predios && !!t.plusvalia;
}
export function territoryScore(g: GameState) {
  const t = currentTerritory(g);
  if (!t) return 0;
  return Math.round((encajeScore(g, t.encaje) + prediosScore(g, t.predios) + plusvaliaScore(g, t.plusvalia)) / 3);
}
export function territoryError(g: GameState, a: TerritoryAction): string | null {
  if (!territoryActive(g)) return "Esta partida usa las reglas regulatorias anteriores.";
  if (g.phase !== 4 || g.snapshot || g.outcome) return "El ordenamiento territorial se analiza en Regulación, antes de invertir.";
  if (!g.alternative) return "Selecciona una alternativa en Formulación.";
  const x = a.answers as Record<string, unknown>;
  if (!x || typeof x !== "object") return "Respuestas inválidas.";
  if (a.puzzle === "encaje") {
    const qs = encajeQuestions(g);
    if (qs.some((q) => !q.options.some((o) => o.id === x[q.id]))) return "Responde las cinco preguntas del encaje territorial.";
  } else if (a.puzzle === "predios") {
    const { cards } = routeSteps(g),
      route = x.route;
    if (!Array.isArray(route) || route.length < 3 || route.length > cards.length || new Set(route).size !== route.length || route.some((id) => !cards.some((c) => c.id === id)))
      return "Arma la ruta con al menos tres pasos, sin repetirlos.";
    if (!legalQuestion(g).options.some((o) => o.id === x.legal)) return "Responde la pregunta sobre la expropiación.";
  } else if (a.puzzle === "plusvalia") {
    if (!generatorQuestion(g).options.some((o) => o.id === x.generator)) return "Identifica si hay hecho generador.";
    if (x.generator !== "ninguno") {
      if (typeof x.amount !== "number" || !Number.isFinite(x.amount) || x.amount < 0) return "Liquida la participación en millones de pesos.";
      if (!destinationQuestion(g).options.some((o) => o.id === x.destination)) return "Responde la pregunta sobre la participación.";
    }
  } else return "Puzzle territorial desconocido.";
  return null;
}
export interface TerritoryQuote {
  cost: number;
  months: number;
  cashIn: number;
  title: string;
  detail: string;
}
/** One-time effects of confirming a puzzle (applied by the engine). */
export function territoryQuote(g: GameState, a: TerritoryAction): TerritoryQuote {
  const s = scenarioById(g.scenarioId),
    t = projectTerritory(g),
    prior = currentTerritory(g)?.applied ?? {},
    out: TerritoryQuote = { cost: 0, months: 0, cashIn: 0, title: "", detail: "" };
  if (a.puzzle === "encaje") {
    const score = encajeScore(g, a.answers),
      handled = a.answers.requirement === t.site.soil;
    out.title = `Encaje en el ordenamiento: ${score}/100`;
    out.detail = `${soilName[t.site.soil]} en el sitio de la alternativa.`;
    if (!prior.encaje && handled && t.site.soil === "expansion") {
      out.months = 2;
      out.detail += " Se tramita el plan parcial antes de urbanizar: 2 meses.";
    }
    if (!prior.encaje && handled && t.site.soil === "proteccion") {
      out.months = 2;
      out.cost = Math.round(s.budget * 0.01);
      out.detail += ` La obra se relocaliza a un sitio compatible: 2 meses y ${out.cost} M.`;
    }
  }
  if (a.puzzle === "predios") {
    const score = prediosScore(g, a.answers);
    out.title = `Ruta de adquisición de predios: ${score}/100`;
    if (!prior.predios && t.site.plots > 0) {
      out.cost = Math.round(s.budget * 0.0004 * t.site.plots * 10) / 10;
      out.months = 1;
      out.detail = `Avalúos, ofertas y negociación de ${t.site.plots} predio(s): ${out.cost} M y 1 mes.`;
    } else out.detail = t.site.plots ? "La gestión predial ya estaba en curso." : "Tu alternativa no requiere adquirir predios.";
  }
  if (a.puzzle === "plusvalia") {
    const score = plusvaliaScore(g, a.answers),
      c = plusvaliaCase(g),
      right = score === 100;
    out.title = `Participación en la plusvalía: ${score}/100`;
    if (t.site.generator === "ninguno") out.detail = "La alternativa no produce un hecho generador de plusvalía.";
    else if (t.motive && right && !prior.plusvalia) {
      out.cashIn = c.amount;
      out.detail = `La liquidación es correcta y su destino es legal: ${c.amount} M de plusvalía cofinancian la obra.`;
    } else if (!t.motive && a.answers.generator === t.site.generator && amountOk(g, a.answers.amount) && !prior.plusvalia) {
      out.cost = c.amount;
      out.detail = `La empresa prevé y paga ${c.amount} M de participación al solicitar la licencia.`;
    } else out.detail = right ? "La participación ya estaba liquidada." : "La liquidación tiene errores: no se reconoce hasta corregirla.";
  }
  return out;
}

/* ---------------- Consequences at investment and during execution ---------------- */
export interface TerritorialEffect {
  title: string;
  detail: string;
  delay?: number;
  extraCost?: number;
  performance?: number;
  reputation?: number;
  eventRisk?: number;
}
/** What an incomplete or wrong territorial analysis costs once the plan meets the territory (at the investment). */
export function territorialConsequences(g: GameState): TerritorialEffect[] {
  if (!territoryActive(g)) return [];
  const t = projectTerritory(g),
    a = currentTerritory(g),
    s = scenarioById(g.scenarioId),
    out: TerritorialEffect[] = [];
  if (a?.encaje?.requirement !== t.site.soil) {
    if (t.site.soil === "proteccion")
      out.push({ title: "Licencia negada en suelo de protección", detail: "El sitio no admite urbanización (art. 35): la obra se relocaliza tarde. 6 meses de retraso, 3 % más de inversión y desempeño −3 %.", delay: 6, extraCost: Math.round(s.budget * 0.03), performance: -0.03, reputation: -3 });
    else if (t.site.soil === "expansion")
      out.push({ title: "Sin plan parcial no hay licencia de urbanismo", detail: "El suelo de expansión exige plan parcial (art. 19): 4 meses de retraso y legitimidad −2.", delay: 4, reputation: -2 });
    else out.push({ title: "Trámite urbanístico incompleto", detail: "El proyecto no previó lo que exige su clase de suelo: 1 mes de retraso.", delay: 1 });
  }
  if (a?.encaje?.determinant !== t.determinant)
    out.push({ title: "Concertación incompleta con las determinantes", detail: `No se priorizó «${determinantName[t.determinant].toLowerCase()}» (art. 10): la autoridad pide ajustes. 2 meses de retraso.`, delay: 2 });
  if (t.site.plots > 0 && (!a?.predios || prediosScore(g, a.predios) < 70))
    out.push({ title: "Adquisición predial impugnable", detail: `La ruta para adquirir ${t.site.plots} predio(s) no sigue la Ley 388: legitimidad −4 y más riesgo de predios sin liberar durante la ejecución.`, reputation: -4, eventRisk: 0.05 });
  if (!t.motive && t.site.generator !== "ninguno" && !a?.applied?.plusvalia) {
    const c = plusvaliaCase(g);
    out.push({ title: "Plusvalía no prevista", detail: `La licencia exige pagar ${c.amount} M de participación (art. 83) que no estaban previstos, más su actualización: 2 meses de retraso.`, delay: 2, extraCost: Math.round(c.amount * 1.1 * 10) / 10 });
  }
  if (!out.length) out.push({ title: "Ordenamiento territorial en regla", detail: "El sitio, la ruta predial y la plusvalía del proyecto cumplen la Ley 388 de 1997." });
  return out;
}
/** Probability that plots are not released during execution (0 without plots or in older games). */
export function landEventProbability(g: GameState) {
  if (!territoryActive(g)) return 0;
  const t = projectTerritory(g);
  if (!t.site.plots) return 0;
  const ok = prediosScore(g, currentTerritory(g)?.predios) >= 70;
  return Math.min(0.6, (0.12 + t.site.plots / 200) * (ok ? 0.4 : 1.6));
}
export function landEvent(g: GameState) {
  const t = projectTerritory(g),
    ok = prediosScore(g, currentTerritory(g)?.predios) >= 70;
  return {
    id: "predios",
    name: "Predios sin liberar",
    description: ok
      ? `Un propietario impugna el avalúo de uno de los ${t.site.plots} predios. La ruta documentada (avalúo, oferta y negociación) permite resolverlo pronto.`
      : `La adquisición de ${t.site.plots} predio(s) no siguió la ruta legal: un juez suspende la entrega de franjas hasta corregir el procedimiento.`,
    category: "territorial",
    probability: landEventProbability(g),
    cost: ok ? 0.02 : 0.07,
    delay: ok ? 1 : 4,
    benefit: ok ? 0 : -0.03,
    study: "social",
  };
}
export { motiveName };

/** Reference answers of the three puzzles (presentation game and tests), for the selected alternative. */
export function referenceTerritory(g: GameState): TerritoryAction[] {
  const qs = encajeQuestions(g),
    answer = (id: string) => qs.find((q) => q.id === id)!.answer,
    t = projectTerritory(g),
    gen = t.site.generator;
  return [
    { type: "territory", puzzle: "encaje", answers: { instrument: answer("instrument"), soil: answer("soil"), requirement: answer("requirement"), determinant: answer("determinant"), execution: answer("execution") } },
    { type: "territory", puzzle: "predios", answers: { route: routeSteps(g).correct, legal: legalQuestion(g).answer } },
    { type: "territory", puzzle: "plusvalia", answers: { generator: gen, amount: gen === "ninguno" ? null : plusvaliaCase(g).amount, destination: gen === "ninguno" ? "" : destinationQuestion(g).answer } },
  ];
}

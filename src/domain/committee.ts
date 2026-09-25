import type { GameState } from "./types";
import { scenarioById } from "../data/scenarios";
import { directSDGs } from "../data/relationships";
import { sdgs as sdgList } from "../data/sdgs";
import { methodById, valuationMethods } from "../data/valuationMethods";
import { compareAlternatives, playerFlow } from "./comparison";
import { criticalVariable, evaluate } from "./flows";
import { missionFlowCase } from "./missionFlow";
import { methodFitFor, valuationSummary } from "./valuation";
import { random } from "./finance";

export interface CommitteeOption {
  id: string;
  text: string;
  /** 1 = strong, defensible answer; 0.5 = partially right; 0 = wrong. */
  credit: number;
  feedback: string;
}
export interface CommitteeQuestion {
  id: string;
  question: string;
  concept: string;
  options: CommitteeOption[];
}
const shuffle = (g: GameState, id: string, o: CommitteeOption[]) =>
  o.sort((a, b) => random(g.seed, "comite" + id + a.id) - random(g.seed, "comite" + id + b.id));
const fitRank = { optima: 0, valida: 1, parcial: 2, inadecuada: 3 } as const;
const fmt = (v: number) => Math.round(v).toLocaleString("es-CO") + " M";
/**
 * Comité evaluador: questions derived from the player's game (alternative, flows, valuation, ODS).
 * Correctness is computed from the game data, so different strategies can be defended.
 */
export function committeeQuestions(g: GameState): CommitteeQuestion[] {
  const s = scenarioById(g.scenarioId),
    rows = g.alternative ? compareAlternatives(g) : [],
    chosen = rows.find((r) => r.chosen),
    qs: CommitteeQuestion[] = [];
  if (!chosen) return qs;
  const cheapest = rows.reduce((b, r) => (r.investment < b.investment ? r : b), rows[0]);
  if (cheapest.id !== chosen.id) {
    const other = cheapest;
    qs.push({
      id: "inversion",
      concept: "Comparación de alternativas",
      question: `¿Por qué elegiste ${chosen.name} si su inversión inicial (${fmt(chosen.investment)}) es mayor que la de ${other.name} (${fmt(other.investment)})?`,
      options: shuffle(g, "inversion", [
        { id: "vpne", text: "Porque su VPN económico con mis valoraciones es mayor.", credit: chosen.npvE > other.npvE ? 1 : 0, feedback: `VPN económico: ${fmt(chosen.npvE)} frente a ${fmt(other.npvE)}.` },
        { id: "causas", text: "Porque atiende más causas del Árbol del problema.", credit: chosen.causes > other.causes ? 1 : 0, feedback: `Causas atendidas: ${chosen.causes} frente a ${other.causes}.` },
        { id: "cobertura", text: "Porque logra mayor cobertura de la población objetivo.", credit: chosen.coverage > other.coverage ? 1 : 0, feedback: `Cobertura potencial: ${(chosen.coverage * 100).toFixed(0)} % frente a ${(other.coverage * 100).toFixed(0)} %.` },
        { id: "om", text: "Porque tiene menores costos anuales de operación y mantenimiento.", credit: chosen.om < other.om ? 1 : 0, feedback: `O&M anual: ${fmt(chosen.om)} frente a ${fmt(other.om)}.` },
        { id: "publico", text: "Porque en un proyecto público la inversión inicial no importa.", credit: 0, feedback: "Los recursos públicos tienen costo de oportunidad: la inversión siempre importa." },
      ]),
    });
  } else {
    const alt = rows.filter((r) => r.id !== chosen.id).reduce((b, r) => (r.coverage > b.coverage ? r : b));
    qs.push({
      id: "inversion",
      concept: "Costo de oportunidad",
      question: `Elegiste la alternativa de menor inversión. ¿Qué sacrificas frente a ${alt.name}?`,
      options: shuffle(g, "inversion", [
        { id: "cobertura", text: "Cobertura: la otra alternativa llega a más población.", credit: alt.coverage > chosen.coverage ? 1 : 0, feedback: `Cobertura: ${(chosen.coverage * 100).toFixed(0)} % frente a ${(alt.coverage * 100).toFixed(0)} %.` },
        { id: "vpne", text: "Valor económico: la otra alternativa tiene mayor VPN económico.", credit: alt.npvE > chosen.npvE ? 1 : 0, feedback: `VPN económico: ${fmt(chosen.npvE)} frente a ${fmt(alt.npvE)}.` },
        { id: "nada", text: "Nada: la alternativa más barata siempre es la mejor.", credit: 0, feedback: "Menor inversión no implica mayor valor: compara beneficios, cobertura y riesgo." },
        { id: "tiempo", text: "Tiempo: la otra alternativa se construye más rápido.", credit: alt.months < chosen.months ? 1 : 0, feedback: `Plazo: ${chosen.months} frente a ${alt.months} meses.` },
        { id: "hundido", text: "Nada: los estudios que ya pagué compensan la diferencia.", credit: 0, feedback: "Los estudios ya pagados son costos hundidos: no cambian la comparación entre alternativas." },
      ]),
    });
  }
  const c = missionFlowCase(g);
  if (c) {
    const f = playerFlow(g, c),
      base = evaluate(c, f.rows, f.econ, f.benefits),
      low = evaluate(c, f.rows, f.econ, f.benefits, { demand: 0.8 }),
      positive = low.npvE >= 0;
    qs.push({
      id: "demanda",
      concept: "Sensibilidad",
      question: `Tu proyecto depende de la demanda. Si cae 20 %, ¿qué ocurre con el VPN económico (hoy ${fmt(base.npvE)})?`,
      options: shuffle(g, "demanda", [
        ...(base.npvE < 0
          ? [
              { id: "peor", text: "Ya es negativo y se aleja más de cero.", credit: low.npvE < base.npvE ? 1 : 0, feedback: `Con la demanda en 80 %, el VPN económico sería ${fmt(low.npvE)}.` },
              { id: "mejora", text: "Pasa a ser positivo porque baja la operación.", credit: 0, feedback: `Menos demanda reduce los beneficios valorados: el VPN económico sería ${fmt(low.npvE)}.` },
            ]
          : [
              { id: "positivo", text: "Baja, pero sigue siendo positivo.", credit: positive && low.npvE < base.npvE ? 1 : 0, feedback: `Con la demanda en 80 %, el VPN económico sería ${fmt(low.npvE)}.` },
              { id: "negativo", text: "Se vuelve negativo: la decisión cambiaría.", credit: !positive ? 1 : 0, feedback: `Con la demanda en 80 %, el VPN económico sería ${fmt(low.npvE)}.` },
            ]),
        { id: "igual", text: "No cambia, porque la demanda no afecta los beneficios.", credit: 0, feedback: "Los beneficios valorados dependen del uso del servicio: menos demanda, menos beneficio." },
        { id: "financiero", text: "Solo cambia el flujo financiero; el económico no.", credit: 0, feedback: "La demanda afecta los beneficios valorados del flujo económico y las tarifas del financiero." },
        { id: "tarifa", text: "Mejora, porque se puede subir la tarifa para compensar la caída.", credit: 0, feedback: "La tarifa es una transferencia en el flujo económico: subirla no crea beneficio para la sociedad." },
      ]),
    });
    const crit = criticalVariable(c, f.rows, f.econ, f.benefits);
    const tied = crit.ranked.filter((r) => Math.abs(r.delta - crit.critical.delta) < 1e-6).map((r) => r.id as string);
    qs.push({
      id: "critica",
      concept: "Variable crítica",
      question: "¿Qué variable amenaza más la viabilidad económica si empeora 10 %?",
      options: shuffle(
        g,
        "critica",
        crit.ranked
          .map((r): CommitteeOption => ({
            id: r.id,
            text: r.label,
            credit: tied.includes(r.id) ? 1 : 0,
            feedback: `Un 10 % desfavorable en ${r.label.toLowerCase()} cambia el VPN económico en ${fmt(r.delta)}.`,
          }))
          .concat(
            [
              { id: "tsd", text: "La tasa social de descuento", credit: 0, feedback: "La tasa social la fija el DNP (9 %): es un parámetro de evaluación, no una variable del proyecto que pueda empeorar." },
              { id: "estudios", text: "Los estudios ya pagados", credit: 0, feedback: "Son costos hundidos: no cambian con la decisión ni con los escenarios." },
            ].slice(0, Math.max(0, 5 - crit.ranked.length)),
          ),
      ),
    });
  }
  const valued = valuationSummary(g).rows.sort((a, b) => Math.abs(b.result.annual) - Math.abs(a.result.annual))[0];
  if (valued) {
    const card = valued.card;
    qs.push({
      id: "valoracion",
      concept: "Valoración económica",
      question: `¿Qué metodología permite defender mejor el valor de «${card.text}»?`,
      options: shuffle(
        g,
        "valoracion",
        [
          ...valuationMethods.filter((m) => m.id === valued.choice.method),
          ...valuationMethods
            .filter((m) => m.id !== valued.choice.method && methodFitFor(card, m.id) !== "inadecuada")
            .sort((a, b) => fitRank[methodFitFor(card, a.id)] - fitRank[methodFitFor(card, b.id)]),
        ]
          .slice(0, 5)
          .concat(valuationMethods.filter((m) => m.id !== valued.choice.method && methodFitFor(card, m.id) === "inadecuada"))
          .slice(0, 6)
          .map((m) => {
            const fit = methodFitFor(card, m.id);
            return {
              id: m.id,
              text: m.name,
              credit: fit === "optima" ? 1 : fit === "valida" ? 0.5 : 0,
              feedback: `${methodById(m.id)!.name}: ${fit === "optima" ? "la más adecuada" : fit === "valida" ? "válida con limitaciones" : fit === "parcial" ? "capta solo una parte del valor" : "no corresponde a este impacto"}.`,
            };
          }),
      ),
    });
  }
  const direct = directSDGs[g.scenarioId] ?? [],
    sdg = g.sdgs.find((id) => direct.includes(id)) ?? g.sdgs[0];
  if (sdg) {
    const isDirect = direct.includes(sdg),
      relevant = s.sdgs.includes(sdg);
    qs.push({
      id: "ods",
      concept: "ODS",
      question: `¿Por qué seleccionaste el ODS ${sdg} · ${sdgList[sdg - 1].name}?`,
      options: shuffle(g, "ods", [
        { id: "directo", text: "Porque el producto del proyecto actúa directamente sobre ese objetivo.", credit: isDirect ? 1 : 0, feedback: isDirect ? "Relación directa: el servicio cambia la meta del ODS." : "La relación con este ODS no es directa." },
        { id: "indirecto", text: "Porque un impacto del proyecto contribuye indirectamente y puedo medirlo.", credit: relevant && !isDirect ? 1 : isDirect ? 0.5 : 0, feedback: relevant ? "Es pertinente si el impacto se mide con un indicador." : "El proyecto no produce impactos verificables en este ODS." },
        { id: "todos", text: "Porque todos los proyectos contribuyen a todos los ODS.", credit: 0, feedback: "Seleccionar sin relación causal no demuestra contribución." },
        { id: "imagen", text: "Porque mejora la imagen del proyecto ante los financiadores.", credit: 0, feedback: "La alineación se sustenta con evidencia, no con comunicación." },
        { id: "exige", text: "Porque el fondo que financia el proyecto exige mencionarlo.", credit: 0, feedback: "Un requisito formal no demuestra contribución: se necesita relación causal e indicador." },
      ]),
    });
  }
  return qs;
}
export function committeeScore(g: GameState) {
  const qs = committeeQuestions(g),
    answers = g.v2?.v22?.committee?.answers ?? {};
  if (!qs.length) return 0;
  return Math.round((100 * qs.reduce((n, q) => n + (q.options.find((o) => o.id === answers[q.id])?.credit ?? 0), 0)) / qs.length);
}
export function referenceCommittee(g: GameState) {
  return Object.fromEntries(committeeQuestions(g).map((q) => [q.id, q.options.reduce((b, o) => (o.credit > b.credit ? o : b)).id]));
}

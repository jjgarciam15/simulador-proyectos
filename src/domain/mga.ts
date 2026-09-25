import type { GameState } from "./types";
import { scenarioById } from "../data/scenarios";

export interface MgaDossier {
  links: { from: string; to: string }[];
  chain: {
    cause: string;
    objective: string;
    product: string;
    activities: string[];
  };
  prediction: string;
  assumption: string;
  reflection: string;
}
export const emptyDossier = (): MgaDossier => ({
  links: [],
  chain: { cause: "", objective: "", product: "", activities: [] },
  prediction: "",
  assumption: "",
  reflection: "",
});
export function causalQuality(g: GameState) {
  const expected = ["n2>n1", "n1>n0", "n0>n3", "n3>n4"];
  const links = (g.mga?.links ?? [])
    .filter((l) => g.nodes.includes(l.from) && g.nodes.includes(l.to))
    .map((l) => l.from + ">" + l.to);
  const correct = expected.filter((l) => links.includes(l)).length;
  return Math.max(
    0,
    ((correct - Math.max(0, links.length - correct) * 0.5) / 4) * 100,
  );
}
export function chainQuality(g: GameState) {
  const c = g.mga?.chain;
  if (!c) return 0;
  const a = scenarioById(g.scenarioId).alternatives.find(
    (a) => a.id === g.alternative,
  );
  const direct =
    scenarioById(g.scenarioId).nodes.find((n) => n.id === c.cause)?.level ===
    "direct";
  const cause =
    !!a &&
    direct &&
    g.nodes.includes(c.cause) &&
    a.causes.some(
      (id) =>
        id === c.cause ||
        scenarioById(g.scenarioId).nodes.find((n) => n.id === id)?.parent ===
          c.cause,
    );
  const activities = c.activities.filter((id) =>
    g.activities.some((a) => a.id === id && a.cost > 0),
  );
  return (
    ((Number(cause) +
      Number(c.objective === c.cause && direct) +
      Number(c.product === "service") +
      Number(activities.length >= 2)) /
      4) *
    100
  );
}
export function mgaChecks(g: GameState) {
  const s = scenarioById(g.scenarioId),
    d = g.mga ?? emptyDossier();
  return [
    {
      phase: 0,
      title: "Relaciones causa → problema → efectos",
      ok: causalQuality(g) === 100,
      detail:
        "Cada flecha expresa una contribución causal. No basta con reunir tarjetas correctas.",
    },
    {
      phase: 0,
      title: "Población y necesidad",
      ok: g.target > 0 && g.target <= s.affected,
      detail: `Referencia: ${s.population.toLocaleString("es-CO")}; afectada: ${s.affected.toLocaleString("es-CO")}; objetivo: ${g.target.toLocaleString("es-CO")}. El déficit del servicio se mide en ${s.unit}, no se suma a personas.`,
    },
    {
      phase: 1,
      title: "Objetivo general",
      ok: g.objective === "n0",
      detail:
        "Debe expresar el cambio del problema central; ejecutar una obra es un medio.",
    },
    {
      phase: 2,
      title: "Objetivo específico, producto y actividades",
      ok: (g.v2?chainV2Score(g):chainQuality(g)) === 100,
      detail:
        "Una causa directa se transforma en objetivo específico. El bien o servicio debe contribuir a él mediante actividades financiadas.",
    },
    {
      phase: 2,
      title: "Medición y verificación",
      ok:
        indicatorReview(g).length === 0 &&
        g.indicators.some((i) => i.kind === "Producto") &&
        g.indicators.some((i) => i.kind === "Resultado") &&
        g.indicators.every(
          (i) => i.source.trim() && i.owner.trim() && i.frequency.trim(),
        ),
      detail:
        "Distingue entrega del producto y cambio en la población; explicita fuente, frecuencia, unidad, línea base y meta. La existencia de campos no valida la calidad de su texto.",
    },
    {
      phase: 3,
      title: "Hipótesis y supuesto externo registrados",
      ok: !!d.prediction.trim() && !!d.assumption.trim(),
      detail:
        "Registra qué esperas y qué condición externa necesitas. Son textos para deliberación; no reciben una nota automática.",
    },
  ];
}

export function indicatorReview(g: GameState) {
  const findings: { name: string; message: string }[] = [];
  for (const i of g.indicators) {
    const add = (message: string) => findings.push({ name: i.name || 'Indicador sin nombre', message });
    const measure = i.measure ?? 'coverage';
    const units = { coverage: 'personas', progress: '%', spending: 'M COP', benefit: 'M COP / año' };
    if (i.unit.trim().toLowerCase() !== units[measure].toLowerCase()) add(`La medida seleccionada devuelve ${units[measure]}. Revisa la unidad; cambiar la etiqueta no convierte el cálculo.`);
    if (measure === 'spending' && i.kind !== 'Gestión') add('El gasto ejecutado mide uso de recursos. No demuestra por sí solo entrega de productos ni cambio en la población.');
    if (measure === 'progress' && ['Resultado', 'Impacto'].includes(i.kind)) add('El avance físico registra ejecución; no demuestra por sí mismo un resultado o impacto social.');
    if (measure === 'coverage' && i.target > g.target) add('La meta supera la población objetivo. Revisa la focalización o la meta, sin contar beneficiarios indirectos como directos.');
    if (measure === 'progress' && (i.target < 0 || i.target > 100 || i.baseline < 0 || i.baseline > 100)) add('El avance físico usa una escala de 0 a 100 %.');
    if (measure !== 'benefit' && (i.baseline < 0 || i.target < 0)) add('Esta medida del simulador no admite cantidades negativas.');
    if (i.baseline === i.target) add('La meta coincide con la línea base. Explica si buscas mantener un servicio o si falta definir el cambio esperado.');
    if (!i.source.trim() || !i.owner.trim() || !i.frequency.trim()) add('Completa fuente de verificación, responsable y periodicidad.');
  }
  return findings;
}

import {chainV2Score} from './projectV2';
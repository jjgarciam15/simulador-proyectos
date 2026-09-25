import { emptyProject, emptyAlternative } from "../domain/project/project";
import type { NormalizedProject } from "../domain/project/types";

/** Complete manual project used by tests (fictitious data, hand-checkable). */
export function sampleProject(): NormalizedProject {
  const p = emptyProject("estudiante", "2026-09-25T00:00:00.000Z");
  return {
    ...p,
    id: "proj-test-parque",
    title: "Parque lineal del río Claro",
    description: "Recuperar la ronda del río como espacio público seguro y reducir inundaciones en tres barrios.",
    sector: "Espacio público y ambiente",
    territory: "Villa Serena (municipio ficticio)",
    projectType: "publico",
    horizon: 15,
    problem: "Deterioro de la ronda del río Claro y riesgo de inundación en los barrios ribereños",
    causes: [
      { id: "c1", text: "Ocupación informal y residuos en la ronda", level: "directa" },
      { id: "c2", text: "Mantenimiento hidráulico insuficiente del cauce", level: "indirecta" },
      { id: "c3", text: "Baja apropiación comunitaria del espacio", level: "directa" },
    ],
    problemEffects: [
      { id: "e1", text: "Pérdidas materiales por inundaciones", level: "directa" },
      { id: "e2", text: "Menor bienestar y salud de los hogares ribereños", level: "indirecta" },
    ],
    actors: [
      { id: "a1", name: "Juntas de acción comunal", interest: "Espacio seguro", power: 55, position: 40, influence: "Movilización" },
      { id: "a2", name: "Secretaría de Ambiente", interest: "Cumplimiento ambiental", power: 85, position: 20, influence: "Permisos" },
      { id: "a3", name: "Comerciantes informales de la ronda", interest: "Ingresos", power: 35, position: -40, influence: "Oposición local" },
    ],
    population: { affected: 18000, target: 12000, currentSupply: 6000, total: 95000, unit: "personas", characteristics: "Hogares de estratos 1 y 2" },
    generalObjective: "Recuperar la ronda del río Claro y reducir el riesgo de inundación",
    specificObjectives: [
      { id: "o1", text: "Liberar la ronda de ocupaciones y residuos", causeId: "c1" },
      { id: "o2", text: "Asegurar el mantenimiento hidráulico del cauce", causeId: "c2" },
    ],
    ends: [{ effectId: "e1", text: "Reducir pérdidas por inundaciones" }],
    alternatives: [
      {
        ...emptyAlternative("alt1"),
        name: "Parque lineal completo",
        description: "Parque de 4 km con obras hidráulicas y equipamiento",
        investment: 9000,
        om: 420,
        revenue: 60,
        socialBenefit: 1900,
        months: 18,
        life: 25,
        residual: 2500,
        coverage: 0.9,
        risk: "alta",
        environment: 30,
        tradeoff: "Mayor cobertura y beneficio; mayor inversión y plazo.",
        causeIds: ["c1", "c2"],
      },
      {
        ...emptyAlternative("alt2"),
        name: "Recuperación por tramos",
        description: "Intervención de 2 km priorizando zonas de inundación",
        investment: 5200,
        om: 260,
        revenue: 20,
        socialBenefit: 1150,
        months: 10,
        life: 25,
        residual: 1400,
        coverage: 0.6,
        risk: "media",
        environment: 20,
        tradeoff: "Menor costo y plazo; deja tramos sin atender.",
        causeIds: ["c2"],
      },
    ],
    valueChain: {
      inputs: ["Recursos del municipio", "Maquinaria"],
      activities: ["Diseñar el parque", "Construir obras hidráulicas", "Acompañamiento social"],
      products: ["Parque lineal construido"],
      outcomes: ["Menos inundaciones"],
      impacts: ["Mayor bienestar de los hogares"],
    },
    costs: [
      { id: "k1", label: "Obras hidráulicas", category: "inversion", amount: 4000 },
      { id: "k2", label: "Vigilancia y aseo", category: "operacion", amount: 200 },
      { id: "k3", label: "Dragado anual", category: "mantenimiento", amount: 120 },
    ],
    benefits: [
      { id: "b1", label: "Arriendo de quioscos", kind: "ingreso", amount: 60 },
      { id: "b2", label: "Daños por inundación evitados", kind: "beneficioEconomico", amount: 900 },
    ],
    impacts: [
      { id: "i1", text: "Menos viviendas inundadas cada año", kind: "efecto", direction: "positivo", group: "Comunidad", magnitude: "120 viviendas", duration: "Vida útil" },
      { id: "i2", text: "Daños materiales evitados en los hogares", kind: "impacto", direction: "positivo", group: "Comunidad", magnitude: "", duration: "Vida útil", type: "ahorro", method: "gastos", annualValue: 900, unit: "hogares protegidos", perPerson: 0.25, data: "Registros de daños de las últimas inundaciones." },
      { id: "i3", text: "Visitas recreativas al parque", kind: "impacto", direction: "positivo", group: "Usuarios", magnitude: "", duration: "Vida útil", type: "recreacion", method: "viaje", annualValue: 1000, unit: "visitas", perPerson: 6, data: "Conteo de visitantes en parques similares." },
      { id: "i4", text: "Mayor valor de los predios vecinos", kind: "impacto", direction: "positivo", group: "Comunidad", magnitude: "", duration: "Vida útil", type: "propiedad", method: "hedonicos", annualValue: 500, overlapWith: "i3", unit: "predios", perPerson: 0.2 },
      { id: "i5", text: "Ruido durante la construcción", kind: "impacto", direction: "negativo", group: "Terceros", magnitude: "", duration: "18 meses", type: "ambiente", annualValue: -60, unit: "hogares expuestos", perPerson: 0.05 },
    ],
    financial: { rate: 0.12, budget: 12000, deadline: 36 },
    economic: { socialRate: 0.09, rpc: {}, adjustments: "" },
    assumptions: [{ id: "s1", label: "Demanda", value: "Crece 1 % anual" }],
    risks: [{ id: "r1", name: "Hallazgos arqueológicos durante la obra", probability: "baja", impact: "alta", mitigation: "Prospección previa" }],
    regulation: { ...p.regulation, failure: "Externalidades", externalities: "Los residuos en la ronda afectan a los barrios aguas abajo." },
    sdgs: { suggested: [11, 13], playerIdentifies: true },
  };
}

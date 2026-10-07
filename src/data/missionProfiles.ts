/**
 * Perfil de misión: nivel, duración orientativa, conceptos, módulos habilitados y pesos de puntuación.
 * Modules that are disabled are hidden, not required and weigh zero (weights are renormalized).
 */
export type Module = "valuation" | "economicFlow" | "distributive" | "stress" | "switching" | "committee";
export interface MissionProfile {
  level: "Introductorio" | "Intermedio" | "Avanzado";
  duration: string;
  concepts: string[];
  modules: Module[];
  /** Optional per-mission weight multipliers by dimension name (1 = default). */
  weights?: Record<string, number>;
}
const all: Module[] = ["valuation", "economicFlow", "distributive", "stress", "switching", "committee"];
export const missionProfiles: Record<string, MissionProfile> = {
  agua: { level: "Intermedio", duration: "45–60 min", concepts: ["Árbol del problema", "Costo de la enfermedad", "Valor del tiempo", "RPC", "Monopolio natural"], modules: ["valuation", "economicFlow", "distributive", "stress", "committee"] },
  movilidad: { level: "Avanzado", duration: "60–90 min", concepts: ["Valor del tiempo", "Precios hedónicos", "Doble conteo", "Externalidades", "Valor de quiebre"], modules: all },
  residuos: { level: "Avanzado", duration: "60–90 min", concepts: ["Costo de viaje", "Gastos de restauración", "Externalidades", "Flujo económico"], modules: all },
  salud: { level: "Intermedio", duration: "45–60 min", concepts: ["Costo de la enfermedad", "Experimentos de elección", "Doble conteo", "Información asimétrica"], modules: ["valuation", "economicFlow", "distributive", "stress", "committee"] },
  planta: { level: "Intermedio", duration: "40–60 min", concepts: ["Flujo financiero", "Externalidades", "Evaluación financiera vs económica"], modules: ["valuation", "economicFlow", "stress", "committee"], weights: { "Flujos, VPN y RPC": 1.3 } },
  mercado: { level: "Avanzado", duration: "60–90 min", concepts: ["Poder de mercado", "Excedente del consumidor", "Transferencias", "Evaluación distributiva"], modules: all, weights: { "Regulación y ODS": 1.3, "Regulación, territorio y ODS": 1.3 } },
  energia: { level: "Avanzado", duration: "60–90 min", concepts: ["Precios de mercado", "Transferencia de beneficios", "Monopolio natural", "Valor de quiebre"], modules: all },
  alimentos: { level: "Introductorio", duration: "20–30 min", concepts: ["Producto, efecto e impacto", "Precios de mercado", "VPN"], modules: ["valuation", "economicFlow", "committee"] },
  vivienda: { level: "Intermedio", duration: "45–60 min", concepts: ["Precios hedónicos", "Doble conteo", "Información asimétrica"], modules: ["valuation", "economicFlow", "distributive", "committee"] },
};
export const profileOf = (id: string) => missionProfiles[id] ?? { level: "Intermedio", duration: "45–60 min", concepts: [], modules: all };
export const moduleEnabled = (id: string, m: Module) => profileOf(id).modules.includes(m);

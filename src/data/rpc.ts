/**
 * Razones Precio Cuenta (RPC) used to convert financial values into economic values.
 * Values come from DNP studies; see MANUAL_CREACION.md → Referencias académicas.
 * - Inputs and foreign exchange: DNP, Archivos de Economía 497 (2019), Anexo 1 and Cuadro 5 discussion (RPCD = 1,032).
 * - Labor: DNP, Archivos de Economía 498 (2019), Cuadro 11 (2018 column).
 * Transfers (taxes, subsidies, tariffs already captured by valued benefits) are excluded from the economic flow (RPC 0).
 */
export interface RpcEntry {
  id: RpcCategory;
  label: string;
  value: number;
  source: string;
  note: string;
}
export type RpcCategory =
  | "obras"
  | "edificaciones"
  | "divisa"
  | "moCalificada"
  | "moNoCalificada"
  | "moRural"
  | "energia"
  | "combustibles"
  | "agua"
  | "transporte"
  | "cemento"
  | "transferencia";
export const rpcTable: RpcEntry[] = [
  { id: "obras", label: "Obras de ingeniería civil (vías, redes, obras hidráulicas)", value: 0.903, source: "DNP AE 497, códigos 420101–420104", note: "Bien no transable; incluye márgenes sin impuestos." },
  { id: "edificaciones", label: "Construcción de edificaciones no residenciales", value: 0.905, source: "DNP AE 497, código 410200", note: "Bien no transable." },
  { id: "divisa", label: "Equipos y bienes importados (divisa)", value: 1.032, source: "DNP AE 497, RPC de la divisa", note: "Costo social de obtener divisas." },
  { id: "moCalificada", label: "Mano de obra calificada urbana", value: 1.018, source: "DNP AE 498, Cuadro 11 (2018)", note: "El salario de mercado refleja casi su precio sombra." },
  { id: "moNoCalificada", label: "Mano de obra no calificada urbana", value: 0.607, source: "DNP AE 498, Cuadro 11 (2018)", note: "El salario de mercado supera el costo de oportunidad social." },
  { id: "moRural", label: "Mano de obra rural", value: 0.722, source: "DNP AE 498, Cuadro 11 (2018)", note: "Distorsiones del mercado laboral rural." },
  { id: "energia", label: "Energía eléctrica distribuida", value: 0.901, source: "DNP AE 497, código 380003", note: "Bien no transable." },
  { id: "combustibles", label: "Gasolinas y otros combustibles", value: 0.822, source: "DNP AE 497, código 270201", note: "Bien mixto; excluye impuestos." },
  { id: "agua", label: "Agua", value: 0.826, source: "DNP AE 497, código 400000", note: "Bien no transable." },
  { id: "transporte", label: "Transporte regular de pasajeros", value: 0.874, source: "DNP AE 497, código 460101", note: "Servicio no transable." },
  { id: "cemento", label: "Cemento, cal y yeso", value: 0.875, source: "DNP AE 497, código 300201", note: "Bien mixto." },
  { id: "transferencia", label: "Transferencias: impuestos, subsidios, tarifas ya valoradas", value: 0, source: "Criterio de evaluación económica", note: "Cambian quién paga, no los recursos de la sociedad: no entran al flujo económico." },
];
export const rpcById = (id: RpcCategory) => rpcTable.find((r) => r.id === id)!;
/** Social discount rate adopted by DNP Resolución 1092 de 2022 for public investment projects. */
export const socialDiscountRate = 0.09;

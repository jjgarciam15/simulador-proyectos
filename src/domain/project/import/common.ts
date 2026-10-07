/** Shared helpers of the PDF/XLSX importers: security checks, Spanish number parsing and field labels. */
export const maxImportBytes = 15 * 1024 * 1024;
export type ImportKind = "pdf" | "xlsx";
export interface FileFacts {
  name: string;
  type: string;
  size: number;
}
/**
 * Security validation before parsing: extension, MIME, size and magic bytes (corruption).
 * Macro-enabled or legacy formats are rejected: nothing is ever executed.
 */
export function checkImportFile(file: FileFacts, head: Uint8Array): { kind: ImportKind } {
  const name = file.name.toLowerCase();
  if (/\.(xlsm|xlsb|xltm|xls|xla|xlam)$/.test(name)) throw new Error("Formato no admitido: los libros con macros o en formato antiguo no se importan. Guarda el archivo como .xlsx sin macros.");
  const kind: ImportKind | null = name.endsWith(".pdf") ? "pdf" : name.endsWith(".xlsx") ? "xlsx" : null;
  if (!kind) throw new Error("Solo se pueden importar archivos .pdf, .xlsx o .proyecta.json (exportado desde PROYECTA).");
  const mimes = {
    pdf: ["application/pdf", "application/x-pdf", ""],
    xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/octet-stream", "application/zip", ""],
  };
  if (!mimes[kind].includes(file.type)) throw new Error(`El tipo de archivo (${file.type}) no corresponde a un ${kind.toUpperCase()}.`);
  if (file.size <= 0) throw new Error("El archivo está vacío.");
  if (file.size > maxImportBytes) throw new Error("El archivo supera 15 MB.");
  const ascii = String.fromCharCode(...head.slice(0, 5));
  if (kind === "pdf" && ascii !== "%PDF-") throw new Error("El archivo no es un PDF válido o está dañado.");
  if (kind === "xlsx" && !(head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04)) throw new Error("El archivo no es un libro .xlsx válido o está dañado.");
  return { kind };
}

export const normText = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Spanish/Colombian number parsing: «9.000» = 9000, «1.234,5» = 1234.5, «12 %» = 12 (percent flag),
 * «$ 9.000 millones» = 9000 M. Values in pesos (> 1.000.000 without «millones») are converted to millions.
 */
export function parseAmount(raw: string | number | null | undefined): { value: number; percent: boolean; converted: boolean } | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? { value: raw, percent: false, converted: false } : null;
  const t = normText(raw);
  const m = t.match(/-?\(?\$?\s*-?\d[\d.,\s]*/);
  if (!m) return null;
  let digits = m[0].replace(/[()$\s]/g, "");
  const negative = digits.startsWith("-") || /^\(/.test(m[0].trim());
  digits = digits.replace(/^-/, "");
  const lastComma = digits.lastIndexOf(","),
    lastDot = digits.lastIndexOf(".");
  let n: number;
  if (lastComma > -1 && lastDot > -1) n = lastComma > lastDot ? Number(digits.replace(/\./g, "").replace(",", ".")) : Number(digits.replace(/,/g, ""));
  else if (lastComma > -1) n = /^\d{1,3}(,\d{3}){2,}$/.test(digits) ? Number(digits.replace(/,/g, "")) : Number(digits.replace(",", "."));
  else if (lastDot > -1) n = /^\d{1,3}(\.\d{3})+$/.test(digits) ? Number(digits.replace(/\./g, "")) : Number(digits);
  else n = Number(digits);
  if (!Number.isFinite(n)) return null;
  if (negative) n = -n;
  const percent = /%|por ciento/.test(t);
  let converted = false;
  if (/millardo|mil millones/.test(t)) n *= 1000;
  else if (!/millon|mill\b|\bm\b|mm/.test(t) && Math.abs(n) >= 1_000_000 && !percent) {
    n = n / 1_000_000;
    converted = true;
  }
  return { value: n, percent, converted };
}
export const parseRate = (raw: string | number | null | undefined) => {
  const a = parseAmount(raw);
  if (!a) return null;
  return a.percent || a.value > 1 ? a.value / 100 : a.value;
};
export const parseShare = parseRate;

/** Labels recognized in PDF lines and spreadsheet cells (normalized, without accents). */
export const fieldLabels: { field: string; patterns: RegExp[] }[] = [
  { field: "title", patterns: [/^(nombre del proyecto|titulo del proyecto|proyecto|nombre)$/] },
  { field: "description", patterns: [/^(descripcion|resumen|descripcion del proyecto)$/] },
  { field: "sector", patterns: [/^sector$/] },
  { field: "territory", patterns: [/^(ubicacion|localizacion|territorio|municipio)$/] },
  { field: "problem", patterns: [/^(problema central|problema principal|problema)$/] },
  { field: "generalObjective", patterns: [/^(objetivo general)$/] },
  { field: "population.affected", patterns: [/^(poblacion afectada|poblacion con el problema|demanda)$/] },
  { field: "population.target", patterns: [/^(poblacion objetivo|beneficiarios|poblacion beneficiaria)$/] },
  { field: "population.total", patterns: [/^(poblacion total|poblacion)$/] },
  { field: "horizon", patterns: [/^(horizonte|horizonte de evaluacion)$/] },
  { field: "financial.rate", patterns: [/^(tasa de descuento|tasa financiera|tasa de oportunidad|tio)$/] },
  { field: "economic.socialRate", patterns: [/^(tasa social de descuento|tasa social|tsd)$/] },
  { field: "financial.budget", patterns: [/^(presupuesto|presupuesto disponible|monto disponible)$/] },
  { field: "financial.deadline", patterns: [/^(plazo|plazo maximo)$/] },
  { field: "regulation.failure", patterns: [/^(falla de mercado|falla)$/] },
  { field: "sdgs", patterns: [/^(ods|objetivos de desarrollo sostenible)$/] },
];
export const listLabels: { field: "causes" | "problemEffects" | "specificObjectives" | "actors" | "risks" | "impacts" | "assumptions"; patterns: RegExp[] }[] = [
  { field: "causes", patterns: [/^(causas?|causas directas|causas indirectas|causa directa|causa indirecta)$/] },
  { field: "problemEffects", patterns: [/^(efectos?|efectos del problema|consecuencias|efecto directo|efecto indirecto)$/] },
  { field: "specificObjectives", patterns: [/^(objetivos especificos|objetivo especifico)$/] },
  { field: "actors", patterns: [/^(actores|actores involucrados|participantes)$/] },
  { field: "risks", patterns: [/^(riesgos|riesgo)$/] },
  { field: "impacts", patterns: [/^(impactos|efectos e impactos|impactos esperados)$/] },
  { field: "assumptions", patterns: [/^(supuestos)$/] },
];
/** Alternative table columns. */
export const altColumns: { key: "name" | "description" | "investment" | "om" | "revenue" | "socialBenefit" | "months" | "life" | "residual" | "coverage"; patterns: RegExp[] }[] = [
  { key: "name", patterns: [/^(alternativa|nombre|opcion)$/] },
  { key: "description", patterns: [/^(descripcion)$/] },
  { key: "investment", patterns: [/^(inversion|inversion inicial|capex|costo de inversion)/] },
  { key: "om", patterns: [/^(o&m|oym|operacion y mantenimiento|costo de operacion|operacion|opex)/] },
  { key: "revenue", patterns: [/^(ingresos?|ingresos anuales|ventas)/] },
  { key: "socialBenefit", patterns: [/^(beneficio social|beneficios? economicos?|beneficio anual|beneficios?)/] },
  { key: "months", patterns: [/^(duracion|meses|plazo de obra|tiempo de obra)/] },
  { key: "life", patterns: [/^(vida util)/] },
  { key: "residual", patterns: [/^(valor residual|residual)/] },
  { key: "coverage", patterns: [/^(cobertura)/] },
];
export const matchLabel = (text: string, patterns: RegExp[]) => {
  const t = normText(text).replace(/[:*•\-–]+$/g, "").replace(/^[\d.)\s]+/, "").trim();
  return patterns.some((p) => p.test(t));
};
export const failureFrom = (text: string) => {
  const t = normText(text);
  if (t.includes("externalidad")) return "Externalidades";
  if (t.includes("monopolio")) return "Monopolio natural";
  if (t.includes("poder de mercado")) return "Poder de mercado";
  if (t.includes("informacion asimetrica") || t.includes("asimetria")) return "Información asimétrica";
  if (t.includes("bien publico") || t.includes("bienes publicos")) return "Bienes públicos";
  if (t.includes("ninguna")) return "Ninguna falla suficiente";
  return null;
};
export const sdgsFrom = (text: string) => [...new Set((text.match(/\b(1[0-7]|[1-9])\b/g) ?? []).map(Number))].filter((n) => n >= 1 && n <= 17);

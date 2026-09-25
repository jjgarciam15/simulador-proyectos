import { strToU8, zipSync } from "fflate";
import { colLetters } from "./xlsx";

/** Tiny .xlsx writer (inline strings and numbers), used for the downloadable import template and tests. */
export type SheetData = { name: string; rows: (string | number | null)[][] };
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export function writeXlsx(sheets: SheetData[]): Uint8Array {
  const files: Record<string, Uint8Array> = {};
  files["[Content_Types].xml"] = strToU8(
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`,
  );
  files["_rels/.rels"] = strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  files["xl/workbook.xml"] = strToU8(
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s, i) => `<sheet name="${esc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`,
  );
  files["xl/_rels/workbook.xml.rels"] = strToU8(
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}</Relationships>`,
  );
  sheets.forEach((s, i) => {
    const rows = s.rows
      .map((row, r) => `<row r="${r + 1}">${row.map((v, c) => (v === null || v === undefined || v === "" ? "" : typeof v === "number" ? `<c r="${colLetters(c)}${r + 1}"><v>${v}</v></c>` : `<c r="${colLetters(c)}${r + 1}" t="inlineStr"><is><t>${esc(v)}</t></is></c>`)).join("")}</row>`)
      .join("");
    files[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows}</sheetData></worksheet>`);
  });
  return zipSync(files);
}
/** Template offered in the import screen: the labels the importer recognizes. */
export function projectTemplate(): SheetData[] {
  return [
    {
      name: "Proyecto",
      rows: [
        ["Campo", "Valor"],
        ["Nombre del proyecto", ""],
        ["Descripción", ""],
        ["Sector", ""],
        ["Ubicación", ""],
        ["Problema central", ""],
        ["Objetivo general", ""],
        ["Población total", ""],
        ["Población afectada", ""],
        ["Población objetivo", ""],
        ["Horizonte", ""],
        ["Tasa de descuento", ""],
        ["Tasa social de descuento", ""],
        ["Presupuesto", ""],
        ["Plazo", ""],
        ["Falla de mercado", ""],
        ["ODS", ""],
      ],
    },
    { name: "Árbol", rows: [["Tipo", "Descripción", "Nivel"], ["Causa", "", "Directa"], ["Causa", "", "Indirecta"], ["Efecto", "", "Directo"], ["Efecto", "", "Indirecto"], ["Objetivo específico", "", ""]] },
    {
      name: "Alternativas",
      rows: [["Alternativa", "Descripción", "Inversión (M)", "O&M anual (M)", "Ingresos anuales (M)", "Beneficio social anual (M)", "Duración (meses)", "Vida útil (años)", "Valor residual (M)", "Cobertura (%)"]],
    },
    { name: "Actores", rows: [["Actor", "Interés", "Poder (0-100)", "Posición (-100 a 100)"]] },
    { name: "Costos", rows: [["Rubro", "Tipo", "Monto (M)"]] },
    { name: "Riesgos", rows: [["Riesgo", "Probabilidad", "Impacto", "Mitigación"]] },
  ];
}

import { unzipSync, strFromU8 } from "fflate";

/**
 * Minimal, local .xlsx reader (Office Open XML). Reads sheet names, cells, cached values and formulas
 * as text. It never evaluates formulas and ignores macros (vbaProject.bin is not read).
 */
export interface XlsxCell {
  ref: string;
  row: number;
  col: number;
  value: string | number | boolean | null;
  formula?: string;
}
export interface XlsxSheet {
  name: string;
  cells: XlsxCell[];
  /** Dense rows (row index 0 = spreadsheet row 1). */
  rows: (string | number | boolean | null)[][];
}
export interface XlsxWorkbook {
  sheets: XlsxSheet[];
  warnings: string[];
}
const decode = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, "&");
const attr = (tag: string, name: string) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
export function colIndex(letters: string) {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}
export const colLetters = (i: number) => {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
};
const maxCells = 200_000;

export function readXlsx(bytes: Uint8Array): XlsxWorkbook {
  let files: Record<string, Uint8Array>;
  try {
    // Only XML parts are extracted; binary parts (macros, images) are skipped.
    files = unzipSync(bytes, { filter: (f) => f.name.endsWith(".xml") || f.name.endsWith(".rels") });
  } catch {
    throw new Error("El libro está dañado o no es un .xlsx válido.");
  }
  const warnings: string[] = [];
  const text = (name: string) => (files[name] ? strFromU8(files[name]) : null);
  const workbook = text("xl/workbook.xml");
  if (!workbook) throw new Error("El archivo no contiene un libro de Excel.");
  if (/vbaProject/i.test(text("[Content_Types].xml") ?? "")) warnings.push("El libro declara macros: se ignoraron y no se ejecutaron.");
  const rels = text("xl/_rels/workbook.xml.rels") ?? "";
  const target: Record<string, string> = {};
  for (const m of rels.matchAll(/<Relationship\b[^>]*>/g)) {
    const id = attr(m[0], "Id"),
      t = attr(m[0], "Target");
    if (id && t) target[id] = t.startsWith("/") ? t.slice(1) : "xl/" + t.replace(/^\.\//, "");
  }
  const shared: string[] = [];
  const sst = text("xl/sharedStrings.xml");
  if (sst)
    for (const si of sst.matchAll(/<si>([\s\S]*?)<\/si>/g)) shared.push(decode([...si[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join("")));
  const sheets: XlsxSheet[] = [];
  let total = 0;
  for (const m of workbook.matchAll(/<sheet\b[^>]*\/?>/g)) {
    const name = decode(attr(m[0], "name") ?? "Hoja"),
      rid = attr(m[0], "r:id"),
      path = rid ? target[rid] : undefined,
      xml = path ? text(path) : null;
    if (!xml) {
      warnings.push(`No se pudo leer la hoja «${name}».`);
      continue;
    }
    const cells: XlsxCell[] = [];
    for (const c of xml.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      if (++total > maxCells) throw new Error("El libro tiene demasiadas celdas para importarlo.");
      const head = c[1],
        body = c[2] ?? "",
        ref = attr(head, "r");
      if (!ref) continue;
      const [, letters, digits] = ref.match(/^([A-Z]+)(\d+)$/) ?? [];
      if (!letters) continue;
      const t = attr(head, "t"),
        v = body.match(/<v>([\s\S]*?)<\/v>/)?.[1],
        f = body.match(/<f\b[^>]*>([\s\S]*?)<\/f>/)?.[1],
        inline = body.match(/<is>([\s\S]*?)<\/is>/)?.[1];
      let value: XlsxCell["value"] = null;
      if (t === "s" && v !== undefined) value = shared[Number(v)] ?? null;
      else if (t === "inlineStr" && inline) value = decode([...inline.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join(""));
      else if (t === "str" && v !== undefined) value = decode(v);
      else if (t === "b" && v !== undefined) value = v === "1";
      else if (t === "e") value = null;
      else if (v !== undefined) value = Number(v);
      if (typeof value === "number" && !Number.isFinite(value)) value = null;
      cells.push({ ref, row: Number(digits) - 1, col: colIndex(letters), value, formula: f ? "=" + decode(f) : undefined });
    }
    const rows: XlsxSheet["rows"] = [];
    for (const cell of cells) {
      if (cell.row > 5000 || cell.col > 200) continue;
      (rows[cell.row] ??= [])[cell.col] = cell.value;
    }
    for (let i = 0; i < rows.length; i++) rows[i] ??= [];
    const noCache = cells.filter((c) => c.formula && c.value === null).length;
    if (noCache) warnings.push(`La hoja «${name}» tiene ${noCache} fórmula(s) sin valor calculado: se marcan como No identificada.`);
    sheets.push({ name, cells, rows });
  }
  if (!sheets.length) throw new Error("El libro no tiene hojas legibles.");
  return { sheets, warnings };
}

import { emptyAlternative, emptyProject, uid } from "../project";
import type { Confidence, FailureType, NormalizedProject, RiskLevel, SourceReference } from "../types";
import {
  altColumns,
  failureFrom,
  fieldLabels,
  listLabels,
  matchLabel,
  normText,
  parseAmount,
  parseRate,
  sdgsFrom,
} from "./common";
import type { XlsxSheet, XlsxWorkbook } from "./xlsx";
import { colLetters } from "./xlsx";

/**
 * PDF/XLSX → NormalizedProject. Only what is found is filled; the rest stays empty and is shown as
 * «No identificada». Each value keeps where it came from and a confidence level, and the project opens
 * in the Project Builder for mandatory review.
 */
export interface ImportReport {
  project: NormalizedProject;
  found: number;
  warnings: string[];
}
type Cell = string | number | boolean | null | undefined;
type NumericAltKey = "investment" | "om" | "revenue" | "socialBenefit" | "months" | "life" | "residual";
class Collector {
  p: NormalizedProject;
  warnings: string[] = [];
  found = 0;
  constructor(type: "imported_pdf" | "imported_excel", fileName: string, now: string) {
    this.p = emptyProject("estudiante", now);
    this.p.source = { type, fileName, importedAt: now };
  }
  note(path: string, confidence: Confidence, ref: SourceReference) {
    this.p.evidence[path] = { confidence, ref, reviewed: false };
    this.found++;
  }
  /** Scalar fields by label. */
  set(field: string, raw: Cell, ref: SourceReference, baseConfidence: Confidence) {
    const text = raw === null || raw === undefined ? "" : String(raw).trim();
    if (!text) return;
    const p = this.p;
    const amount = () => parseAmount(typeof raw === "number" ? raw : text);
    const withAmount = (apply: (v: number) => void, rate = false) => {
      if (rate) {
        const r = parseRate(typeof raw === "number" ? raw : text);
        if (r === null) return;
        apply(r);
        this.note(field, baseConfidence, ref);
        return;
      }
      const a = amount();
      if (!a) return;
      apply(a.value);
      this.note(field, a.converted ? "baja" : baseConfidence, ref);
      if (a.converted) this.warnings.push(`«${field}»: el valor parecía estar en pesos y se convirtió a millones. Verifícalo.`);
    };
    switch (field) {
      case "title":
      case "description":
      case "sector":
      case "territory":
      case "problem":
      case "generalObjective":
        if (!(p as unknown as Record<string, string>)[field]) {
          (p as unknown as Record<string, string>)[field] = text.slice(0, 600);
          this.note(field, baseConfidence, ref);
        }
        return;
      case "population.affected":
        return withAmount((v) => (p.population.affected = Math.round(v)));
      case "population.target":
        return withAmount((v) => (p.population.target = Math.round(v)));
      case "population.total":
        return withAmount((v) => (p.population.total = Math.round(v)));
      case "horizon":
        return withAmount((v) => (p.horizon = Math.round(v)));
      case "financial.rate":
        return withAmount((v) => (p.financial.rate = v), true);
      case "economic.socialRate":
        return withAmount((v) => (p.economic.socialRate = v), true);
      case "financial.budget":
        return withAmount((v) => (p.financial.budget = v));
      case "financial.deadline":
        return withAmount((v) => (p.financial.deadline = Math.round(v)));
      case "regulation.failure": {
        const f = failureFrom(text);
        if (f) {
          p.regulation.failure = f as FailureType;
          this.note(field, baseConfidence, ref);
        } else this.warnings.push(`Falla de mercado no reconocida: «${text}».`);
        return;
      }
      case "sdgs": {
        const ids = sdgsFrom(text);
        if (ids.length) {
          p.sdgs.suggested = ids;
          this.note(field, baseConfidence, ref);
        }
        return;
      }
    }
  }
  /** List items (causes, effects, objectives, actors, risks, impacts, assumptions). */
  add(field: (typeof listLabels)[number]["field"], text: string, ref: SourceReference, confidence: Confidence, level?: string) {
    const t = text.replace(/^[-•*·▪◦–\d.)\s]+/, "").trim();
    if (!t || t.length < 3) return;
    const p = this.p,
      lv = normText(level ?? "").startsWith("indirect") ? "indirecta" : "directa";
    let id = "";
    if (field === "causes") p.causes.push({ id: (id = uid("c")), text: t, level: lv });
    else if (field === "problemEffects") p.problemEffects.push({ id: (id = uid("e")), text: t, level: lv });
    else if (field === "specificObjectives") p.specificObjectives.push({ id: (id = uid("o")), text: t });
    else if (field === "actors") p.actors.push({ id: (id = uid("act")), name: t });
    else if (field === "risks") p.risks.push({ id: (id = uid("r")), name: t, probability: null, impact: null, mitigation: "" });
    else if (field === "impacts") p.impacts.push({ id: (id = uid("i")), text: t, kind: "impacto", direction: /negativ|perdida|dano|contamina|ruido/.test(normText(t)) ? "negativo" : "positivo", group: "", magnitude: "", duration: "" });
    else if (field === "assumptions") p.assumptions.push({ id: (id = uid("s")), label: t.slice(0, 80), value: t });
    this.note(`${field}.${id}`, confidence, ref);
  }
  finish(): ImportReport {
    const p = this.p;
    // Link specific objectives to causes only when the count matches one to one (never guessed otherwise).
    if (p.specificObjectives.length && p.specificObjectives.length === p.causes.length) p.specificObjectives.forEach((o, i) => (o.causeId = p.causes[i].id));
    const missing = [
      ["nombre del proyecto", p.title],
      ["problema central", p.problem],
      ["objetivo general", p.generalObjective],
      ["alternativas", p.alternatives.length],
      ["causas", p.causes.length],
      ["efectos", p.problemEffects.length],
    ]
      .filter(([, v]) => !v)
      .map(([k]) => k);
    if (missing.length) this.warnings.push(`No identificado en el archivo: ${missing.join(", ")}.`);
    return { project: p, found: this.found, warnings: [...new Set(this.warnings)] };
  }
}
const riskLevel = (v: Cell): RiskLevel | null => {
  const t = normText(String(v ?? ""));
  return t.startsWith("alt") ? "alta" : t.startsWith("med") ? "media" : t.startsWith("baj") ? "baja" : null;
};

/* ---------------- Excel ---------------- */
function findHeader(sheet: XlsxSheet, test: (cells: string[]) => boolean) {
  for (let r = 0; r < Math.min(sheet.rows.length, 200); r++) {
    const cells = (sheet.rows[r] ?? []).map((v) => (typeof v === "string" ? v : ""));
    if (test(cells)) return r;
  }
  return -1;
}
export function normalizeExcel(wb: XlsxWorkbook, fileName: string, now = new Date().toISOString()): ImportReport {
  const c = new Collector("imported_excel", fileName, now);
  c.warnings.push(...wb.warnings);
  for (const sheet of wb.sheets) {
    const ref = (row: number, col: number): SourceReference => {
      const cell = sheet.cells.find((x) => x.row === row && x.col === col);
      return { sheet: sheet.name, cell: colLetters(col) + (row + 1), excerpt: cell?.formula };
    };
    const formulaAt = (row: number, col: number) => !!sheet.cells.find((x) => x.row === row && x.col === col)?.formula;
    const consumed = new Set<number>();
    // 1. Alternatives table.
    const altHeader = findHeader(sheet, (cells) => cells.filter((t) => altColumns.some((a) => matchLabel(t, a.patterns))).length >= 3 && cells.some((t) => matchLabel(t, altColumns[0].patterns)));
    if (altHeader >= 0) {
      const header = sheet.rows[altHeader].map((v) => String(v ?? ""));
      const cols = new Map<(typeof altColumns)[number]["key"], number>();
      header.forEach((h, i) => {
        const col = altColumns.find((a) => !cols.has(a.key) && matchLabel(h, a.patterns));
        if (col) cols.set(col.key, i);
      });
      for (let r = altHeader + 1; r < sheet.rows.length; r++) {
        const row = sheet.rows[r] ?? [],
          name = row[cols.get("name")!];
        if (name === null || name === undefined || String(name).trim() === "") break;
        consumed.add(r);
        const a = { ...emptyAlternative(uid("alt")), name: String(name).trim() };
        c.note(`alternatives.${a.id}.name`, "alta", ref(r, cols.get("name")!));
        for (const [key, col] of cols) {
          if (key === "name") continue;
          const raw = row[col];
          if (raw === null || raw === undefined || raw === "") continue;
          if (key === "description") a.description = String(raw);
          else if (key === "coverage") {
            const v = parseRate(typeof raw === "number" ? raw : String(raw));
            if (v === null) continue;
            a.coverage = v;
          } else {
            const v = parseAmount(typeof raw === "number" ? raw : String(raw));
            if (!v) continue;
            a[key as NumericAltKey] = key === "months" || key === "life" ? Math.round(v.value) : v.value;
          }
          c.note(`alternatives.${a.id}.${key}`, formulaAt(r, col) ? "media" : "alta", ref(r, col));
        }
        c.p.alternatives.push(a);
      }
      consumed.add(altHeader);
    }
    // 2. Actors, costs and risks tables.
    const table = (first: RegExp, second: RegExp) => findHeader(sheet, (cells) => cells.some((t) => first.test(normText(t))) && cells.some((t) => second.test(normText(t))));
    const actorHeader = table(/^actor/, /^(poder|interes|posicion)/);
    if (actorHeader >= 0) {
      const h = sheet.rows[actorHeader].map((v) => normText(String(v ?? "")));
      const col = (re: RegExp) => h.findIndex((x) => re.test(x));
      const [cn, ci, cp, cpos] = [col(/^actor/), col(/^interes/), col(/^poder/), col(/^posicion/)];
      for (let r = actorHeader + 1; r < sheet.rows.length; r++) {
        const row = sheet.rows[r] ?? [];
        if (!row[cn] || !String(row[cn]).trim()) break;
        consumed.add(r);
        const id = uid("act");
        c.p.actors.push({ id, name: String(row[cn]).trim(), interest: ci >= 0 && row[ci] ? String(row[ci]) : undefined, power: cp >= 0 ? parseAmount(row[cp] as number | string)?.value ?? null : null, position: cpos >= 0 ? parseAmount(row[cpos] as number | string)?.value ?? null : null });
        c.note(`actors.${id}`, "alta", ref(r, cn));
      }
      consumed.add(actorHeader);
    }
    const costHeader = table(/^(rubro|concepto|item)/, /^(tipo|categoria|clasificacion)/);
    if (costHeader >= 0) {
      const h = sheet.rows[costHeader].map((v) => normText(String(v ?? "")));
      const [cn, ct, cm] = [h.findIndex((x) => /^(rubro|concepto|item)/.test(x)), h.findIndex((x) => /^(tipo|categoria|clasificacion)/.test(x)), h.findIndex((x) => /^(monto|valor|costo)/.test(x))];
      for (let r = costHeader + 1; r < sheet.rows.length; r++) {
        const row = sheet.rows[r] ?? [];
        if (!row[cn] || !String(row[cn]).trim()) break;
        consumed.add(r);
        const t = normText(String(row[ct] ?? "")),
          category = t.startsWith("invers") ? "inversion" : t.startsWith("oper") ? "operacion" : t.startsWith("mant") ? "mantenimiento" : "otros";
        const id = uid("k");
        c.p.costs.push({ id, label: String(row[cn]).trim(), category, amount: cm >= 0 ? parseAmount(row[cm] as number | string)?.value ?? null : null });
        c.note(`costs.${id}`, cm >= 0 && formulaAt(r, cm) ? "media" : "alta", ref(r, cn));
      }
      consumed.add(costHeader);
    }
    const riskHeader = table(/^riesgo/, /^(probabilidad|impacto|mitigacion)/);
    if (riskHeader >= 0) {
      const h = sheet.rows[riskHeader].map((v) => normText(String(v ?? "")));
      const [cn, cp, ci, cm] = [h.findIndex((x) => /^riesgo/.test(x)), h.findIndex((x) => /^probabilidad/.test(x)), h.findIndex((x) => /^impacto/.test(x)), h.findIndex((x) => /^mitigacion/.test(x))];
      for (let r = riskHeader + 1; r < sheet.rows.length; r++) {
        const row = sheet.rows[r] ?? [];
        if (!row[cn] || !String(row[cn]).trim()) break;
        consumed.add(r);
        const id = uid("r");
        c.p.risks.push({ id, name: String(row[cn]).trim(), probability: cp >= 0 ? riskLevel(row[cp]) : null, impact: ci >= 0 ? riskLevel(row[ci]) : null, mitigation: cm >= 0 ? String(row[cm] ?? "") : "" });
        c.note(`risks.${id}`, "alta", ref(r, cn));
      }
      consumed.add(riskHeader);
    }
    // 3. Label/value pairs and typed list rows.
    for (let r = 0; r < sheet.rows.length; r++) {
      if (consumed.has(r)) continue;
      const row = sheet.rows[r] ?? [];
      for (let col = 0; col < row.length; col++) {
        const label = row[col];
        if (typeof label !== "string" || !label.trim()) continue;
        const nextCol = row.findIndex((v, i) => i > col && v !== null && v !== undefined && String(v).trim() !== "");
        const field = fieldLabels.find((f) => matchLabel(label, f.patterns));
        if (field) {
          if (nextCol > col && nextCol <= col + 3) c.set(field.field, row[nextCol], ref(r, nextCol), formulaAt(r, nextCol) ? "media" : "alta");
          break;
        }
        const t = normText(label);
        const typed = /^causa/.test(t) ? "causes" : /^efecto/.test(t) ? "problemEffects" : /^objetivo especifico/.test(t) ? "specificObjectives" : /^supuesto/.test(t) ? "assumptions" : /^impacto/.test(t) ? "impacts" : null;
        // A row with an empty description and only a level («Causa | | Directa», as in the blank template) is not data.
        const onlyLevel = typeof row[nextCol] === "string" && /^(in)?direct[oa]s?$/.test(normText(row[nextCol] as string));
        if (typed && onlyLevel) break;
        if (typed && nextCol > col && typeof row[nextCol] === "string") {
          const levelCell = row.slice(nextCol + 1).find((v) => typeof v === "string" && /direct|indirect/i.test(v)) as string | undefined;
          c.add(typed, row[nextCol] as string, ref(r, nextCol), "alta", levelCell ?? (/indirect/.test(t) ? "indirecta" : undefined));
          break;
        }
        const list = listLabels.find((l) => matchLabel(label, l.patterns));
        if (list && nextCol < 0) {
          for (let rr = r + 1; rr < sheet.rows.length; rr++) {
            const v = sheet.rows[rr]?.[col];
            if (typeof v !== "string" || !v.trim() || fieldLabels.some((f) => matchLabel(v, f.patterns)) || listLabels.some((l) => matchLabel(v, l.patterns))) break;
            consumed.add(rr);
            c.add(list.field, v, ref(rr, col), "media");
          }
          break;
        }
        break;
      }
    }
  }
  return c.finish();
}

/* ---------------- PDF ---------------- */
/** Lines of each page (from the PDF text layer). */
export function normalizePdf(pages: string[][], fileName: string, now = new Date().toISOString()): ImportReport {
  const c = new Collector("imported_pdf", fileName, now);
  const text = pages.flat().join(" ").trim();
  if (!text) {
    c.warnings.push("El PDF no tiene texto seleccionable (parece escaneado). El reconocimiento óptico (OCR) no está disponible: completa los datos en el Project Builder.");
    return c.finish();
  }
  let list: (typeof listLabels)[number]["field"] | null = null,
    alt: ReturnType<typeof emptyAlternative> | null = null;
  pages.forEach((lines, pageIndex) => {
    const page = pageIndex + 1;
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      const ref: SourceReference = { page, excerpt: line.slice(0, 160) };
      const altMatch = line.match(/^alternativa\s*(?:\d+|[a-d])?\s*[:.–-]\s*(.+)$/i);
      if (altMatch) {
        alt = { ...emptyAlternative(uid("alt")), name: altMatch[1].trim() };
        c.p.alternatives.push(alt);
        c.note(`alternatives.${alt.id}.name`, "media", ref);
        list = null;
        continue;
      }
      const kv = line.match(/^([^:]{2,60}):\s*(.*)$/);
      if (kv) {
        const [, label, value] = kv;
        const altCol = altColumns.find((a) => a.key !== "name" && matchLabel(label, a.patterns));
        if (alt && altCol && value) {
          const current = alt as ReturnType<typeof emptyAlternative>;
          if (altCol.key === "description") current.description = value;
          else if (altCol.key === "coverage") current.coverage = parseRate(value);
          else {
            const a = parseAmount(value);
            if (a) current[altCol.key as NumericAltKey] = altCol.key === "months" || altCol.key === "life" ? Math.round(a.value) : a.value;
          }
          c.note(`alternatives.${current.id}.${altCol.key}`, "media", ref);
          continue;
        }
        const field = fieldLabels.find((f) => matchLabel(label, f.patterns));
        if (field && value) {
          alt = null;
          list = null;
          c.set(field.field, value, ref, "media");
          continue;
        }
        const listField = listLabels.find((l) => matchLabel(label, l.patterns));
        if (listField) {
          alt = null;
          list = listField.field;
          if (value) c.add(list, value, ref, "media", /indirect/i.test(label) ? "indirecta" : "directa");
          continue;
        }
      }
      const heading = listLabels.find((l) => matchLabel(line, l.patterns));
      if (heading) {
        alt = null;
        list = heading.field;
        continue;
      }
      if (fieldLabels.some((f) => matchLabel(line, f.patterns))) {
        list = null;
        continue;
      }
      if (list && /^([-•*·▪◦–]|\d+[.)])\s*/.test(line)) c.add(list, line, ref, "media", /indirect/i.test(line) ? "indirecta" : "directa");
      else if (list && line.length > 200) list = null;
    }
  });
  return c.finish();
}

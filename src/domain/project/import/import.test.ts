import { describe, expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";
import { checkImportFile, parseAmount, parseRate } from "./common";
import { readXlsx } from "./xlsx";
import { writeXlsx, projectTemplate } from "./xlsxWriter";
import { normalizeExcel, normalizePdf } from "./normalize";
import { extractPdfLines, type PdfJsLike } from "./pdf";
import { simplePdf } from "../../../testSupport/pdfWriter";
import { excelSheets, pdfPages } from "../../../testSupport/importFixtures";
import { generateMission } from "../generator";
import { validateProject } from "../validation";
import { parseProject } from "../schema";

const config = { difficulty: "guiado", mode: "aprendizaje", duration: "normal" } as const;
const pdfjs = async () => (await import("pdfjs-dist/legacy/build/pdf.mjs")) as unknown as PdfJsLike;

describe("Seguridad de archivos", () => {
  const pdfHead = strToU8("%PDF-1.4"),
    zipHead = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
  it("valida extensión, MIME, tamaño y firma del archivo", () => {
    expect(checkImportFile({ name: "a.pdf", type: "application/pdf", size: 10 }, pdfHead).kind).toBe("pdf");
    expect(checkImportFile({ name: "a.xlsx", type: "", size: 10 }, zipHead).kind).toBe("xlsx");
    expect(() => checkImportFile({ name: "a.xlsm", type: "", size: 10 }, zipHead)).toThrow(/macros/);
    expect(() => checkImportFile({ name: "a.xls", type: "", size: 10 }, zipHead)).toThrow(/macros|antiguo/);
    expect(() => checkImportFile({ name: "a.docx", type: "", size: 10 }, zipHead)).toThrow(/Solo se pueden/);
    expect(() => checkImportFile({ name: "a.pdf", type: "text/html", size: 10 }, pdfHead)).toThrow(/no corresponde/);
    expect(() => checkImportFile({ name: "a.pdf", type: "application/pdf", size: 20 * 1024 * 1024 }, pdfHead)).toThrow(/15 MB/);
    expect(() => checkImportFile({ name: "a.pdf", type: "application/pdf", size: 10 }, zipHead)).toThrow(/dañado/);
    expect(() => checkImportFile({ name: "a.xlsx", type: "", size: 10 }, pdfHead)).toThrow(/dañado/);
  });
  it("interpreta números en formato colombiano sin inventar unidades", () => {
    expect(parseAmount("9.000")!.value).toBe(9000);
    expect(parseAmount("1.234,5")!.value).toBe(1234.5);
    expect(parseAmount("$ 3.500 millones")!.value).toBe(3500);
    expect(parseAmount("2.400.000.000")).toEqual({ value: 2400, percent: false, converted: true });
    expect(parseRate("12 %")).toBeCloseTo(0.12);
    expect(parseRate(0.1)).toBeCloseTo(0.1);
    expect(parseAmount("sin dato")).toBeNull();
  });
});

describe("Excel → NormalizedProject", () => {
  it("lee hojas, encabezados, tablas, valores y fórmulas como texto, sin ejecutar macros", () => {
    const files = {
      "[Content_Types].xml": strToU8('<Types><Default Extension="bin" ContentType="application/vnd.ms-office.vbaProject"/><Override PartName="/xl/vbaProject.bin"/></Types>'),
      "xl/workbook.xml": strToU8('<workbook><sheets><sheet name="Datos" sheetId="1" r:id="rId1"/></sheets></workbook>'),
      "xl/_rels/workbook.xml.rels": strToU8('<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>'),
      "xl/sharedStrings.xml": strToU8("<sst><si><t>Inversión</t></si><si><r><t>Presu</t></r><r><t>puesto</t></r></si></sst>"),
      "xl/worksheets/sheet1.xml": strToU8('<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1"><v>100</v></c></row><row r="2"><c r="A2" t="s"><v>1</v></c><c r="B2"><f>B1*2</f><v>200</v></c><c r="C2"><f>B2+1</f></c></row></sheetData></worksheet>'),
      "xl/vbaProject.bin": new Uint8Array([1, 2, 3]),
    };
    const wb = readXlsx(zipSync(files));
    const cells = wb.sheets[0].cells;
    expect(wb.sheets[0].name).toBe("Datos");
    expect(cells.find((c) => c.ref === "A2")!.value).toBe("Presupuesto");
    expect(cells.find((c) => c.ref === "B2")).toMatchObject({ value: 200, formula: "=B1*2" });
    expect(cells.find((c) => c.ref === "C2")!.value).toBeNull();
    expect(wb.warnings.join(" ")).toMatch(/macros: se ignoraron/);
    expect(wb.warnings.join(" ")).toMatch(/sin valor calculado/);
    expect(() => readXlsx(new Uint8Array([0x50, 0x4b, 3, 4, 9, 9]))).toThrow(/dañado/);
  });
  it("normaliza el libro con referencias de hoja y celda y confianza, y verifica los números", () => {
    const report = normalizeExcel(readXlsx(writeXlsx(excelSheets)), "biblioteca.xlsx", "2026-09-25T00:00:00Z");
    const p = report.project;
    expect(p.source.type).toBe("imported_excel");
    expect(p.title).toBe("Biblioteca rural de San Roque");
    expect(p.population).toMatchObject({ total: 25000, affected: 6000, target: 4500 });
    expect(p.horizon).toBe(12);
    expect(p.financial.rate).toBeCloseTo(0.1);
    expect(p.economic.socialRate).toBeCloseTo(0.09);
    expect(p.regulation.failure).toBe("Bienes públicos");
    expect(p.sdgs.suggested).toEqual([4, 9, 10]);
    expect(p.causes.map((c) => c.level)).toEqual(["directa", "indirecta"]);
    expect(p.problemEffects).toHaveLength(2);
    expect(p.specificObjectives.every((o) => o.causeId)).toBe(true);
    expect(p.alternatives.map((a) => [a.name, a.investment, a.om, a.socialBenefit, a.months, a.life, a.residual, a.coverage])).toEqual([
      ["Biblioteca central con wifi", 1800, 140, 420, 14, 25, 700, 0.7],
      ["Bibliotecas satélite", 1300, 190, 380, 8, 12, 150, 0.85],
    ]);
    expect(p.actors.map((a) => [a.name, a.power, a.position])).toEqual([["Secretaría de Educación", 80, 50], ["Juntas de padres", 40, 70]]);
    expect(p.costs.map((c) => [c.category, c.amount])).toEqual([["inversion", 1200], ["operacion", 90]]);
    expect(p.risks[0]).toMatchObject({ probability: "media", impact: "alta" });
    const inv = Object.entries(p.evidence).find(([k]) => k.endsWith(".investment"))![1];
    expect(inv).toMatchObject({ confidence: "alta", ref: { sheet: "Alternativas", cell: "C2" } });
    expect(p.evidence.title.ref).toMatchObject({ sheet: "Proyecto", cell: "B2" });
  });
  it("la plantilla descargable se lee de nuevo y deja los campos vacíos como No identificada", () => {
    const report = normalizeExcel(readXlsx(writeXlsx(projectTemplate())), "plantilla.xlsx");
    expect(report.project.title).toBe("");
    expect(report.project.alternatives).toEqual([]);
    expect(report.warnings.join(" ")).toMatch(/No identificado en el archivo/);
  });
});

describe("PDF → NormalizedProject", () => {
  it("extrae el texto nativo con página y normaliza campos, listas y alternativas", async () => {
    const { pages } = await extractPdfLines(simplePdf(pdfPages), await pdfjs());
    expect(pages).toHaveLength(2);
    expect(pages[0][1]).toBe("Nombre del proyecto: Mercado campesino de Los Álamos");
    const report = normalizePdf(pages, "mercado.pdf");
    const p = report.project;
    expect(p.source.type).toBe("imported_pdf");
    expect(p.title).toBe("Mercado campesino de Los Álamos");
    expect(p.problem).toMatch(/^Bajos ingresos/);
    expect(p.causes).toHaveLength(2);
    expect(p.problemEffects).toHaveLength(2);
    expect(p.specificObjectives).toHaveLength(2);
    expect(p.population).toMatchObject({ affected: 4800, target: 3200 });
    expect(p.financial).toMatchObject({ budget: 3500 });
    expect(p.financial.rate).toBeCloseTo(0.12);
    expect(p.regulation.failure).toBe("Poder de mercado");
    expect(p.sdgs.suggested).toEqual([1, 2, 8]);
    expect(p.alternatives.map((a) => [a.name, a.investment, a.om, a.revenue, a.months, a.life, a.coverage])).toEqual([
      ["Plaza de mercado cubierta", 2400, 150, 90, 12, 20, 0.8],
      ["Mercado móvil itinerante", 900, 210, null, 4, 8, 0.45],
    ]);
    expect(p.evidence.title).toMatchObject({ confidence: "media", ref: { page: 1 } });
    expect(Object.entries(p.evidence).find(([k]) => k.endsWith(".investment"))![1].ref!.page).toBe(2);
    // Nothing invented: missing data stays empty
    expect(p.actors).toEqual([]);
    expect(p.alternatives[1].revenue).toBeNull();
  });
  it("un PDF sin texto (escaneado) no inventa datos y pide completar manualmente", () => {
    const report = normalizePdf([[], []], "escaneado.pdf");
    expect(report.found).toBe(0);
    expect(report.warnings[0]).toMatch(/OCR/);
  });
});

describe("Las tres fuentes llegan al mismo MissionGenerator", () => {
  it("un proyecto importado requiere revisión; tras revisarlo y completarlo genera la partida", async () => {
    const excel = normalizeExcel(readXlsx(writeXlsx(excelSheets)), "biblioteca.xlsx").project;
    expect(validateProject(excel).some((i) => i.path === "metadata.importReviewed" && i.level === "error")).toBe(true);
    excel.metadata.importReviewed = true;
    const res = generateMission(parseProject(JSON.parse(JSON.stringify(excel))), config, "gen-xlsx");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.mission.scenario.alternatives.map((a) => a.capex)).toEqual([1800, 1300]);

    const { pages } = await extractPdfLines(simplePdf(pdfPages), await pdfjs());
    const pdf = normalizePdf(pages, "mercado.pdf").project;
    pdf.metadata.importReviewed = true;
    // The document has no actors: the builder asks for them (error) instead of inventing them.
    expect(validateProject(pdf).filter((i) => i.level === "error").map((i) => i.path)).toEqual(["actors"]);
    pdf.actors = [
      { id: "x1", name: "Asociación de productores" },
      { id: "x2", name: "Intermediarios" },
    ];
    const res2 = generateMission(pdf, config, "gen-pdf");
    expect(res2.ok).toBe(true);
  });
});

import { useState } from "react";
import { FileSpreadsheet, FileText, ShieldCheck, Upload } from "lucide-react";
import { checkImportFile } from "../../domain/project/import/common";
import { readXlsx } from "../../domain/project/import/xlsx";
import { normalizeExcel, normalizePdf, type ImportReport } from "../../domain/project/import/normalize";
import { projectTemplate, writeXlsx } from "../../domain/project/import/xlsxWriter";
import { importPortable } from "../../domain/project/schema";
import type { NormalizedProject } from "../../domain/project/types";
import { uid } from "../../domain/project/project";
import { Button, Panel } from "../../components/ui";
import { download } from "./ProjectBuilder";

/**
 * Importar proyecto: the file is read in this browser only (no upload). Pipeline:
 * archivo → validación de seguridad → parser → extracción → normalización → revisión en el Project Builder.
 */
export default function ImportProject({ onOpen, onBack }: { onOpen: (p: NormalizedProject) => void; onBack: () => void }) {
  const [report, setReport] = useState<ImportReport | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [over, setOver] = useState(false);
  async function handle(file: File) {
    setError("");
    setReport(null);
    setBusy(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (file.name.toLowerCase().endsWith(".json")) {
        if (file.size > 2_000_000) throw new Error("El archivo es demasiado grande para un proyecto.");
        const p = importPortable(new TextDecoder().decode(bytes));
        onOpen({ ...p, id: uid("proj") });
        return;
      }
      const { kind } = checkImportFile({ name: file.name, type: file.type, size: file.size }, bytes.slice(0, 8));
      if (kind === "xlsx") setReport(normalizeExcel(readXlsx(bytes), file.name));
      else {
        const { extractPdfInBrowser } = await import("../../domain/project/import/pdfBrowser");
        const { pages, truncated } = await extractPdfInBrowser(bytes);
        const r = normalizePdf(pages, file.name);
        if (truncated) r.warnings.push("Se leyeron solo las primeras 80 páginas.");
        setReport(r);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo leer el archivo.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="reading">
      <button className="text-btn" onClick={onBack}>
        ← Mis proyectos
      </button>
      <h1>Importar proyecto</h1>
      <p className="lead">Transforma un documento existente en una estructura académica editable y luego en una simulación.</p>
      <Panel title="Archivo" kicker="PDF · XLSX · .proyecta.json">
        <p className="pb-privacy">
          <ShieldCheck size={16} aria-hidden /> El archivo se procesa solo en este navegador: no se envía a ningún servicio. Los libros con macros no se aceptan y las fórmulas se leen como texto, sin ejecutarse. Máximo 15 MB.
        </p>
        <label
          className={"pb-drop " + (over ? "over" : "")}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            const f = e.dataTransfer.files[0];
            if (f) void handle(f);
          }}
        >
          <Upload size={22} aria-hidden />
          <strong>{busy ? "Leyendo el archivo…" : "Arrastra aquí un PDF o un Excel, o haz clic para elegirlo"}</strong>
          <input type="file" accept=".pdf,.xlsx,.json,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/json" onChange={(e) => e.target.files?.[0] && void handle(e.target.files[0])} disabled={busy} />
        </label>
        <div className="actions">
          <Button secondary onClick={() => download("plantilla-proyecto-proyecta.xlsx", writeXlsx(projectTemplate()), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}>
            <FileSpreadsheet size={15} /> Descargar plantilla Excel
          </Button>
        </div>
        <p className="muted">
          <FileText size={14} aria-hidden /> En un PDF se reconocen líneas «Etiqueta: valor» (Problema central, Objetivo general, Población objetivo, Inversión…), listas bajo «Causas», «Efectos» u «Objetivos específicos» y bloques «Alternativa 1: …». En Excel se reconocen
          pares etiqueta/valor y tablas de alternativas, actores, costos y riesgos. Los PDF escaneados no tienen texto: el reconocimiento óptico (OCR) no está incluido.
        </p>
        {error && (
          <p role="alert" className="pb-issues error">
            {error}
          </p>
        )}
      </Panel>
      {report && (
        <Panel title="Resultado de la extracción" kicker="REVISIÓN OBLIGATORIA">
          <p>
            Se identificaron <strong>{report.found}</strong> dato(s) en <strong>{report.project.source.fileName}</strong>. Cada dato conserva su página, hoja o celda de origen y un nivel de confianza.
          </p>
          <ul className="pb-summary">
            <li>Nombre: {report.project.title || "No identificada"}</li>
            <li>Problema central: {report.project.problem || "No identificada"}</li>
            <li>
              Causas: {report.project.causes.length} · efectos: {report.project.problemEffects.length} · objetivos específicos: {report.project.specificObjectives.length}
            </li>
            <li>Alternativas: {report.project.alternatives.map((a) => a.name).join(", ") || "No identificadas"}</li>
            <li>Actores: {report.project.actors.length || "No identificados"}</li>
          </ul>
          {report.warnings.length > 0 && (
            <ul className="pb-issues">
              {report.warnings.map((w) => (
                <li key={w} className="warn">
                  <strong>Advertencia:</strong> {w}
                </li>
              ))}
            </ul>
          )}
          <Button onClick={() => onOpen(report.project)}>Revisar y completar en el Project Builder</Button>
        </Panel>
      )}
    </main>
  );
}

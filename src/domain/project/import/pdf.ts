/**
 * Native PDF text extraction with pdf.js, fully local (no file leaves the browser).
 * Text items are grouped into lines by their vertical position. Scanned PDFs return no text;
 * OCR is not bundled (it would need large language data), so the importer asks for manual review.
 */
export interface PdfTextItem {
  str: string;
  transform: number[];
}
export interface PdfJsLike {
  getDocument(src: { data: Uint8Array; isEvalSupported?: boolean; disableFontFace?: boolean; useSystemFonts?: boolean; verbosity?: number }): {
    promise: Promise<{ numPages: number; getPage(n: number): Promise<{ getTextContent(): Promise<{ items: unknown[] }> }>; destroy(): Promise<void> }>;
  };
}
export const maxPdfPages = 80;
export function linesFromItems(items: PdfTextItem[]) {
  const rows = new Map<number, { x: number; s: string }[]>();
  for (const it of items) {
    if (!it.str) continue;
    const y = Math.round(it.transform[5] / 2) * 2;
    (rows.get(y) ?? rows.set(y, []).get(y)!).push({ x: it.transform[4], s: it.str });
  }
  return [...rows.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, parts]) =>
      parts
        .sort((a, b) => a.x - b.x)
        .map((p) => p.s)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}
export async function extractPdfLines(bytes: Uint8Array, pdfjs: PdfJsLike): Promise<{ pages: string[][]; truncated: boolean }> {
  let doc;
  try {
    doc = await pdfjs.getDocument({ data: bytes, isEvalSupported: false, disableFontFace: true, verbosity: 0 }).promise;
  } catch {
    throw new Error("No se pudo leer el PDF: está dañado o protegido.");
  }
  const pages: string[][] = [];
  const n = Math.min(doc.numPages, maxPdfPages);
  for (let i = 1; i <= n; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(linesFromItems(content.items.filter((x): x is PdfTextItem => typeof (x as PdfTextItem).str === "string")));
  }
  await doc.destroy();
  return { pages, truncated: doc.numPages > maxPdfPages };
}

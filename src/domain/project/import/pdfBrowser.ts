import { extractPdfLines, type PdfJsLike } from "./pdf";

/** Loads pdf.js on demand (code-split) with its local worker; nothing is fetched from external services. */
export async function extractPdfInBrowser(bytes: Uint8Array) {
  const [pdfjs, worker] = await Promise.all([import("pdfjs-dist"), import("pdfjs-dist/build/pdf.worker.min.mjs?url")]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  return extractPdfLines(bytes, pdfjs as unknown as PdfJsLike);
}

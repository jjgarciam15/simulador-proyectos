/** Minimal text PDF writer for tests (Helvetica, WinAnsi). One text line per entry. */
const esc = (s: string) =>
  [...s]
    .map((ch) => {
      const c = ch.charCodeAt(0);
      if (ch === "(" || ch === ")" || ch === "\\") return "\\" + ch;
      if (c > 126 && c < 256) return "\\" + c.toString(8).padStart(3, "0");
      if (c >= 256) return "?";
      return ch;
    })
    .join("");
export function simplePdf(pages: string[][]): Uint8Array {
  const objects: string[] = [];
  const pageIds: number[] = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  let next = 4;
  for (const lines of pages) {
    const content = "BT /F1 11 Tf 14 TL 50 800 Td " + lines.map((l) => `(${esc(l)}) Tj T*`).join(" ") + " ET";
    const contentId = next++,
      pageId = next++;
    objects[contentId] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`;
    pageIds.push(pageId);
  }
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => id + " 0 R").join(" ")}] /Count ${pageIds.length} >>`;
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (let i = 1; i < objects.length; i++) {
    offsets[i] = out.length;
    out += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = out.length;
  out += `xref\n0 ${objects.length}\n0000000000 65535 f \n` + offsets.slice(1).map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("");
  out += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Uint8Array.from([...out].map((c) => c.charCodeAt(0) & 255));
}

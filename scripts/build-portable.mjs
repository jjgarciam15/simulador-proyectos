// Builds the portable Windows package: compiled app + PowerShell static server, no Node.js needed to run it.
// Usage: pnpm portable  →  release/PROYECTA-<version>-portable.zip (and the unzipped folder next to it).
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { zipSync } from "fflate";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const version = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
const dist = join(root, "dist");
if (!existsSync(join(dist, "index.html"))) throw new Error("Falta dist/: ejecuta primero pnpm build.");
const name = `PROYECTA-${version}-portable`;
const out = join(root, "release");
const folder = join(out, name);
rmSync(folder, { recursive: true, force: true });
mkdirSync(folder, { recursive: true });
cpSync(dist, join(folder, "app"), { recursive: true });
const src = join(root, "scripts", "portable");
const crlf = (text) => text.replace(/\r?\n/g, "\r\n");
const bom = "\uFEFF";
// cmd.exe needs CRLF; Windows PowerShell 5.1 reads UTF-8 correctly only with a BOM.
writeFileSync(join(folder, "ABRIR_PROYECTA.cmd"), crlf(readFileSync(join(src, "ABRIR_PROYECTA.cmd"), "utf8")));
writeFileSync(join(folder, "servidor-portatil.ps1"), bom + crlf(readFileSync(join(src, "servidor-portatil.ps1"), "utf8")));
writeFileSync(join(folder, "LEEME.txt"), bom + crlf(readFileSync(join(src, "LEEME.txt"), "utf8").replace("{version}", version)));

const files = {};
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else files[`${name}/${relative(folder, full).split("\\").join("/")}`] = readFileSync(full);
  }
};
walk(folder);
const zip = join(out, `${name}.zip`);
writeFileSync(zip, zipSync(files, { level: 9 }));
console.log(`Paquete portátil: ${relative(root, zip)} (${(statSync(zip).size / 1048576).toFixed(1)} MB, ${Object.keys(files).length} archivos)`);

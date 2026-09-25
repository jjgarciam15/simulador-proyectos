import { execFileSync } from "node:child_process";

// Scan staged/tracked content only. Never print matched secret values.
let files;
try {
  files = execFileSync("git", ["ls-files", "--cached", "-z"], {
    encoding: "utf8",
  })
    .split("\0")
    .filter(Boolean);
} catch {
  console.error(
    "Inicializa Git y prepara los archivos antes de revisar el repositorio.",
  );
  process.exit(1);
}
if (!files.length) {
  console.error("No hay archivos preparados en el índice de Git.");
  process.exit(1);
}
const problems = [];
const forbidden =
  /(^|\/)(node_modules|dist|\.local|\.pnpm-store|coverage|test-results|playwright-report|exports)(\/|$)|(^|\/)\.env($|\.)|\.(pem|key|pfx|tsbuildinfo|log)$/;
const secrets = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{30,}\b/,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b/,
];
let bytes = 0;
for (const file of files) {
  if (forbidden.test(file) && !file.endsWith(".env.example"))
    problems.push(`${file}: archivo local o sensible incluido`);
  const size = Number(
    execFileSync("git", ["cat-file", "-s", ":" + file], {
      encoding: "utf8",
    }).trim(),
  );
  bytes += size;
  if (size > 50 * 1024 * 1024) {
    problems.push(`${file}: supera el límite interno de 50 MiB`);
    continue;
  }
  if (!/\.(png|jpg|jpeg|webp|gif|woff2?|ico|pdf)$/i.test(file)) {
    const text = execFileSync("git", ["show", ":" + file], {
      encoding: "utf8",
      maxBuffer: 52 * 1024 * 1024,
    });
    if (secrets.some((pattern) => pattern.test(text)))
      problems.push(`${file}: posible credencial; revisar sin publicarla`);
    if (/[A-Z]:[\\/]Users[\\/][^\s\\/]+[\\/]/.test(text))
      problems.push(`${file}: ruta personal absoluta`);
  }
}
for (const required of [
  "README.md",
  "package.json",
  "pnpm-lock.yaml",
  ".gitignore",
  ".github/workflows/ci.yml",
  "docs/GUIA_GITHUB.md",
])
  if (!files.includes(required)) problems.push(`Falta ${required}`);
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(
  `Repositorio revisado: ${files.length} archivos, ${(bytes / 1024 / 1024).toFixed(2)} MiB. Sin coincidencias en los patrones comprobados. Esta revisión no sustituye una auditoría de seguridad.`,
);

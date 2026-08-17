import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const files = ["index.html", "styles.css", "content.js", "script.js", "server.mjs"];
const errors = [];

for (const file of files) {
  const source = await readFile(resolve(root, file), "utf8");

  source.split(/\r?\n/).forEach((line, index) => {
    if (/\s+$/.test(line)) errors.push(`${file}:${index + 1} possui espaço ao fim da linha.`);
    if (line.includes("\t")) errors.push(`${file}:${index + 1} possui tabulação.`);
    if (line.includes("\uFFFD")) errors.push(`${file}:${index + 1} possui caractere inválido.`);
  });
}

const html = await readFile(resolve(root, "index.html"), "utf8");
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
const h1Count = (html.match(/<h1(?:\s|>)/g) ?? []).length;

if (duplicateIds.length) errors.push(`IDs duplicados: ${[...new Set(duplicateIds)].join(", ")}.`);
if (h1Count !== 1) errors.push(`Esperado exatamente um h1; encontrado: ${h1Count}.`);
if (!html.includes('lang="pt-BR"')) errors.push("Idioma principal não definido como pt-BR.");
if (!html.includes('name="description"')) errors.push("Meta description ausente.");
if (!html.includes("prefers-reduced-motion") && !(await readFile(resolve(root, "styles.css"), "utf8")).includes("prefers-reduced-motion")) {
  errors.push("Tratamento de prefers-reduced-motion ausente.");
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Lint estrutural concluído: ${files.length} arquivos verificados, sem problemas.`);
}

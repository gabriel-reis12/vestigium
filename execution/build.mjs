import { cp, copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "dist");
const sourceFiles = ["index.html", "styles.css", "content.js", "script.js"];

if (!output.startsWith(`${root}${sep}`) || output === root) {
  throw new Error("Diretório de build inválido.");
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of sourceFiles) {
  await copyFile(resolve(root, file), resolve(output, file));
}

await cp(resolve(root, "imagens"), resolve(output, "imagens"), {
  recursive: true,
  filter: (source) => !/^ezgif-frame-\d{3}\.png$/i.test(basename(source)),
});
await cp(resolve(root, "vendor"), resolve(output, "vendor"), { recursive: true });
try {
  await cp(resolve(root, "video"), resolve(output, "video"), { recursive: true });
} catch {
  // pasta de vídeo opcional
}

const html = await readFile(resolve(output, "index.html"), "utf8");
if (!html.includes("./imagens/intro-frames/frame-001.jpg")) {
  throw new Error("O build perdeu a referência à sequência de abertura.");
}

const manifest = {
  entry: "index.html",
  assets: {
    frames: 267,
    source: "imagens/intro-frames/frame-001.jpg ... frame-267.jpg",
    format: "jpeg",
    dimensions: "1600x900",
  },
};

await writeFile(
  resolve(output, "build-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

console.log(`Build estático gerado em ${output}`);

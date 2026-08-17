import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..");

test("a landing possui a arquitetura semântica principal", async () => {
  const html = await readFile(resolve(root, "index.html"), "utf8");
  const requiredIds = [
    "intro",
    "conteudo",
    "caso",
    "conteudo-do-caso",
    "como-funciona",
    "experiencia",
    "nivel",
    "para-quem",
    "galeria",
    "comunidade",
    "oferta",
    "faq",
  ];

  requiredIds.forEach((id) => assert.match(html, new RegExp(`id="${id}"`)));
  assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1);
  assert.match(html, /<main>/);
  assert.match(html, /<footer/);
});

test("a sequência de abertura contém todos os 267 quadros", async () => {
  await Promise.all(
    Array.from({ length: 267 }, (_, index) =>
      access(resolve(root, "imagens", `ezgif-frame-${String(index + 1).padStart(3, "0")}.png`)),
    ),
  );
});

test("o conteúdo comercial segue as diretrizes oficiais", async () => {
  const source = await readFile(resolve(root, "content.js"), "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { filename: "content.js" });
  const { product, links, faq } = sandbox.window.VESTIGIUM_CONTENT;

  assert.equal(product.price, "R$ 87,90");
  assert.equal(product.availability, null);
  Object.values(links).forEach((value) => assert.equal(value, null));
  assert.ok(Array.isArray(faq) && faq.length === 8);
  assert.ok(faq.every((item) => item.status === "confirmed"));
});

test("a página não carrega dependências externas", async () => {
  const html = await readFile(resolve(root, "index.html"), "utf8");
  assert.doesNotMatch(html, /https?:\/\//i);
  assert.doesNotMatch(html, /node_modules/i);
});

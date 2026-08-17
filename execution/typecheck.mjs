import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..");
const source = await readFile(resolve(root, "content.js"), "utf8");
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox, { filename: "content.js" });

const config = sandbox.window.VESTIGIUM_CONTENT;
const errors = [];
const expectString = (value, path) => {
  if (typeof value !== "string" || !value.trim()) errors.push(`${path} deve ser uma string preenchida.`);
};
const expectNullableString = (value, path) => {
  if (value !== null && typeof value !== "string") errors.push(`${path} deve ser string ou null.`);
};

if (!config || typeof config !== "object") {
  errors.push("VESTIGIUM_CONTENT não foi definido.");
} else {
  expectString(config.product?.name, "product.name");
  expectString(config.product?.players, "product.players");
  expectString(config.product?.duration, "product.duration");
  expectNullableString(config.product?.price, "product.price");
  expectNullableString(config.product?.availability, "product.availability");

  for (const key of ["checkout", "instagram", "contact", "privacy", "terms"]) {
    expectNullableString(config.links?.[key], `links.${key}`);
  }

  if (!Array.isArray(config.gallery) || config.gallery.length === 0) {
    errors.push("gallery deve conter ao menos um registro.");
  } else {
    config.gallery.forEach((item, index) => {
      expectString(item.src, `gallery[${index}].src`);
      expectString(item.alt, `gallery[${index}].alt`);
      expectString(item.caption, `gallery[${index}].caption`);
      if (!Number.isInteger(item.width) || item.width <= 0) {
        errors.push(`gallery[${index}].width deve ser um inteiro positivo.`);
      }
      if (!Number.isInteger(item.height) || item.height <= 0) {
        errors.push(`gallery[${index}].height deve ser um inteiro positivo.`);
      }
    });
  }

  if (!Array.isArray(config.faq) || config.faq.length === 0) {
    errors.push("faq deve conter ao menos uma pergunta.");
  } else {
    config.faq.forEach((item, index) => {
      expectString(item.question, `faq[${index}].question`);
      expectString(item.answer, `faq[${index}].answer`);
      if (!["confirmed", "pending"].includes(item.status)) {
        errors.push(`faq[${index}].status deve ser confirmed ou pending.`);
      }
    });
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Verificação de tipos do conteúdo concluída sem problemas.");
}

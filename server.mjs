import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

const host = "127.0.0.1";
const port = Number(process.env.PORT) || 4173;
const root = resolve(import.meta.dirname);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".js": "text/javascript; charset=utf-8",
  ".mp4": "video/mp4",
  ".json": "application/json; charset=utf-8",
};

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://${host}`).pathname);
  const requestedPath = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = resolve(root, requestedPath);

  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end();
    return;
  }

  try {
    if (!statSync(filePath).isFile()) throw new Error("not a file");

    const isMedia = [".jpg", ".mp4"].includes(extname(filePath));
    response.writeHead(200, {
      "Cache-Control": isMedia ? "public, max-age=3600" : "no-cache",
      "Content-Type": mimeTypes[extname(filePath)] ?? "application/octet-stream",
    });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404).end();
  }
}).listen(port, host, () => {
  console.log(`Vestigium disponível em http://localhost:${port}`);
});

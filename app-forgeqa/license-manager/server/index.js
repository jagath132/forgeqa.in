import "dotenv/config";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const PORT = parseInt(process.env.PORT || "3000", 10);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function serveStatic(req, res, next) {
  const url = new URL(req.url, "http://localhost");
  let filePath = path.join(DIST, url.pathname === "/" ? "index.html" : url.pathname);

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      if (err.code === "ENOENT") {
        const indexPath = path.join(DIST, "index.html");
        fs.stat(indexPath, (err2, stat2) => {
          if (err2 || !stat2.isFile()) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "text/plain");
            res.end("Not Found");
            return;
          }
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          fs.createReadStream(indexPath).pipe(res);
        });
        return;
      }
      next();
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.statusCode = 200;
    res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
    fs.createReadStream(filePath).pipe(res);
  });
}

async function main() {
  if (!fs.existsSync(DIST)) {
    console.error("Build output not found at", DIST);
    console.error("Run `npm run build` before starting the production server.");
    process.exit(1);
  }

  const { createApiMiddleware } = await import("./api.js");
  const apiMiddleware = createApiMiddleware(process.env);

  const server = http.createServer((req, res) => {
    apiMiddleware(req, res, () => {
      serveStatic(req, res, () => {
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/plain");
        res.end("Not Found");
      });
    });
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`ForgeKey production server running on http://0.0.0.0:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

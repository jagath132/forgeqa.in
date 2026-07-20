import { createApiMiddleware } from "../server/api.js";

const middleware = createApiMiddleware(process.env);

export default async function handler(req, res) {
  try {
    await middleware(req, res, () => {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "API route not found" }));
    });
  } catch (err) {
    console.error("Vercel function error:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  }
}

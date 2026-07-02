import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Ensure critical secrets are on process.env for server-side modules
  for (const key of ["RESEND_API_KEY", "JWT_SECRET", "ENCRYPTION_SECRET", "MONGO_URI", "MONGO_DB_NAME", "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM", "APP_URL", "SUPPORT_EMAIL", "STRIPE_PRO_PRICE_ID", "STRIPE_ENTERPRISE_PRICE_ID", "VITE_SENTRY_DSN"]) {
    if (env[key]) process.env[key] ??= env[key];
  }

  // Cache the API middleware so we don't re-import + rebuild on every request in dev
  let apiMiddleware = null;

  return {
    plugins: [
      react(),
      {
        name: "nextest-node-api",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!apiMiddleware) {
              const { createApiMiddleware } = await import("./server/api.js");
              apiMiddleware = createApiMiddleware(env);
            }
            apiMiddleware(req, res, next);
          });
        },
      },
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/react-dom")) return "react-vendor";
            if (id.includes("node_modules/react")) return "react-vendor";
            if (id.includes("node_modules/recharts")) return "charts";
            if (id.includes("node_modules/lucide-react")) return "icons";
            if (id.includes("node_modules/jspdf")) return "pdf";
            if (id.includes("node_modules/xlsx")) return "xlsx";
            if (id.includes("node_modules/tesseract")) return "ocr";
            if (id.includes("node_modules/mammoth")) return "docs";
          },
        },
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.ts",
      include: ["src/**/*.test.{ts,tsx}", "server/**/*.test.js"],
      server: {
        deps: { inline: ["mongodb"] },
      },
      pool: "forks",
      poolOptions: {
        forks: {
          singleFork: true,
        },
      },
    },
  };
});

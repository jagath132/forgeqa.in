import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Ensure critical secrets are on process.env for server-side modules
  for (const key of ["RESEND_API_KEY", "JWT_SECRET", "ENCRYPTION_SECRET", "MONGO_URI", "MONGO_DB_NAME", "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM", "APP_URL", "STRIPE_PRO_PRICE_ID", "STRIPE_ENTERPRISE_PRICE_ID", "VITE_SENTRY_DSN"]) {
    if (env[key]) process.env[key] ??= env[key];
  }

  return {
    plugins: [
      react(),
      {
        name: "nextest-node-api",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const { createApiMiddleware } = await import("./server/api.js");
            const middleware = createApiMiddleware(env);
            middleware(req, res, next);
          });
        },
      },
    ],
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

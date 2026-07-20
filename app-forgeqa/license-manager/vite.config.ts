import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { createApiMiddleware } from "./server/api.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const key of ["RESEND_API_KEY", "JWT_SECRET", "MONGO_URI", "MONGO_DB_NAME", "ADMIN_EMAIL", "ADMIN_PASSWORD", "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET", "app_forgeqa_in_APP_URL"]) {
    if (env[key]) process.env[key] ??= env[key];
  }

  // Cache the API middleware so we don't re-create on every request in dev
  let apiMiddleware = null;

  return {
    plugins: [
      react(),
      {
        name: "forgekey-api",
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (!apiMiddleware) apiMiddleware = createApiMiddleware(env);
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
          },
        },
      },
    },
    server: {
      port: 5174,
    },
  };
});
